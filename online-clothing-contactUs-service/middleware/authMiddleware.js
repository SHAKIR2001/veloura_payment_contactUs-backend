import jwt from "jsonwebtoken";

const resolveJwtConfig = () => {
    const publicKey = (process.env.JWT_PUBLIC_KEY || "").replace(/\\n/g, "\n");
    if (publicKey) {
        return { algorithm: "RS256", publicKey };
    }

    const secret = process.env.JWT_SECRET;
    if (secret) {
        return { algorithm: "HS256", secret };
    }

    throw new Error("JWT configuration missing. Set JWT_PUBLIC_KEY or JWT_SECRET.");
};

const isAdmin = (decoded) => {
    if (decoded?.role === "shop_owner") return true;
    if (Array.isArray(decoded?.roles) && decoded.roles.includes("shop_owner")) return true;
    return false;
};

export function verifyAdmin(req, res, next) {
    const authHeader = req.headers["authorization"];

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];

    try {
        const { algorithm, publicKey, secret } = resolveJwtConfig();
        const verificationKey = algorithm === "RS256" ? publicKey : secret;
        const decoded = jwt.verify(token, verificationKey, { algorithms: [algorithm] });

        if (!isAdmin(decoded)) {
            return res.status(403).json({ message: "Access denied. Admins only." });
        }

        req.user = decoded;
        next();
    } catch (e) {
        return res.status(401).json({ message: "Invalid or expired token" });
    }
}