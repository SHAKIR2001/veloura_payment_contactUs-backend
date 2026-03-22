import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import Stripe from 'stripe';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const app = express();

app.use(express.json({ limit: '1mb' }));

const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost,http://127.0.0.1')
	.split(',')
	.map((s) => s.trim().replace(/\/$/, ''))
	.filter(Boolean);

function isOriginAllowed(origin) {
	if (!origin) return true;
	if (allowedOrigins.includes('*')) return true;

	let originUrl;
	try {
		originUrl = new URL(origin);
	} catch {
		return false;
	}

	for (const allowed of allowedOrigins) {
		if (allowed === origin) return true;

		let allowedUrl;
		try {
			allowedUrl = new URL(allowed);
		} catch {
			// Ignore invalid allowed entries.
			continue;
		}

		// If allowed origin has no explicit port, allow any port on that host.
		if (!allowedUrl.port) {
			if (
				allowedUrl.protocol === originUrl.protocol &&
				allowedUrl.hostname === originUrl.hostname
			) {
				return true;
			}
			continue;
		}

		if (allowedUrl.origin === originUrl.origin) return true;
	}

	return false;
}

app.use(
	cors({
		origin(origin, cb) {
			if (isOriginAllowed(origin)) return cb(null, true);
			// Don't throw an error (which becomes a 500 HTML response). Just deny CORS.
			return cb(null, false);
		},
		credentials: true,
	})
);

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

const stripeSecretKey = process.env.STRIPE_SECRET_KEY || '';
if (!stripeSecretKey) {
	// Service should still boot; Stripe routes will return a clear error.
	console.warn('Missing STRIPE_SECRET_KEY. Stripe endpoints will not work.');
}

/** @type {Stripe | null} */
let stripe = null;

function getStripe() {
	if (!stripeSecretKey) return null;
	if (!stripe) {
		stripe = new Stripe(stripeSecretKey, { apiVersion: '2024-06-20' });
	}
	return stripe;
}

const API_PREFIX = '/api/payments/stripe';

function toStripeLineItems(items, currency) {
	return items.map((item) => {
		const quantity = Number(item.quantity || 0);
		const price = Number(item.price || 0);
		if (!Number.isFinite(quantity) || quantity <= 0) throw new Error('Invalid quantity');
		if (!Number.isFinite(price) || price <= 0) throw new Error('Invalid price');

		const name = item.productName || item.name || 'Item';
		const unitAmount = Math.round(price * 100);

		const productData = {
			name,
			...(item.imageUrl ? { images: [item.imageUrl] } : {}),
		};

		return {
			quantity,
			price_data: {
				currency,
				unit_amount: unitAmount,
				product_data: productData,
			},
		};
	});
}

app.post(`${API_PREFIX}/create-checkout-session`, async (req, res) => {
	try {
		const stripeClient = getStripe();
		if (!stripeClient) {
			return res.status(500).json({ error: 'STRIPE_SECRET_KEY is not configured' });
		}

		const { items, successUrl, cancelUrl } = req.body || {};
		if (!Array.isArray(items) || items.length === 0) {
			return res.status(400).json({ error: 'items[] is required' });
		}

		const currency = (process.env.STRIPE_CURRENCY || 'usd').toLowerCase();
		const line_items = toStripeLineItems(items, currency);

		const frontendBase = process.env.FRONTEND_URL || 'http://localhost:5173';
		const success_url =
			successUrl || `${frontendBase}/order-details?session_id={CHECKOUT_SESSION_ID}`;
		const cancel_url = cancelUrl || `${frontendBase}/checkout?canceled=1`;

		const session = await stripeClient.checkout.sessions.create({
			mode: 'payment',
			line_items,
			success_url,
			cancel_url,
			// shipping_address_collection could be added later if needed.
		});

		return res.json({ id: session.id, url: session.url });
	} catch (err) {
		const message = err?.message || 'Failed to create checkout session';
		return res.status(500).json({ error: message });
	}
});

app.get(`${API_PREFIX}/session/:id`, async (req, res) => {
	try {
		const stripeClient = getStripe();
		if (!stripeClient) {
			return res.status(500).json({ error: 'STRIPE_SECRET_KEY is not configured' });
		}
		const id = req.params.id;
		if (!id) return res.status(400).json({ error: 'Session id is required' });

		const session = await stripeClient.checkout.sessions.retrieve(id);
		return res.json({
			id: session.id,
			payment_status: session.payment_status,
			status: session.status,
			amount_total: session.amount_total,
			currency: session.currency,
		});
	} catch (err) {
		const message = err?.message || 'Failed to retrieve session';
		return res.status(500).json({ error: message });
	}
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const swaggerDocument = YAML.load(path.join(__dirname, 'openapi.yaml'));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

const port = Number(process.env.PORT || 5003);
app.listen(port, () => {
	console.log(`Payment service listening on http://localhost:${port} 🚀`);
});