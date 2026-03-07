import ContactMessage from "../models/contact.js";

async function getNextContactMessageId() { //use to create an uniq ID for messages
    let id = 0;

    const last = await ContactMessage.find().sort({ id: -1 }).limit(1);
    if (last.length === 0) {
        id = 1;
    } else {
        id = last[0].id + 1;
    }

    return id;
}

export async function createContactMessage(req, res) {
    try {
         const data = req.body
         data.id = await getNextContactMessageId()

        const newMessage = new ContactMessage(data);
        const saved = await newMessage.save();

        res.status(201).json({
            message: "Message sent successfully",
            id: saved.id,
        });
    } catch (e) {
        res.status(500).json({ message: "Message cannot be sent" });
    }
}

export async function getAllContactMessages(req, res) {
    try {
        const messages = await ContactMessage.find().sort({ createdAt: -1 });
        res.status(200).json(messages);
    } catch (e) {
        res.status(500).json({ message: "Failed to fetch messages" });
    }
}

export async function resolveContactMessage(req, res) {
    try {
        const { id } = req.params;
        const updated = await ContactMessage.findOneAndUpdate(
            { id: Number(id) },
            { isResolved: true },
            { new: true }
        );

        if (!updated) {
            return res.status(404).json({ message: "Message not found" });
        }

        res.status(200).json({ message: "Marked as resolved", data: updated });
    } catch (e) {
        res.status(500).json({ message: "Failed to resolve message" });
    }
}