import Message from "../models/Message.js";

export const sendMessage = async (req, res) => {
    try {
        const senderId = req.user?.userId;
        if (!senderId) {
            return res.status(401).json({ message: "Unauthorized." });
        }

        const { receiverId, bookingId, text } = req.body;
        if (!receiverId || !bookingId || !text?.trim()) {
            return res.status(400).json({
                message: "receiverId, bookingId, and text are required.",
            });
        }

        const message = await Message.create({
            senderId,
            receiverId,
            bookingId,
            text: text.trim(),
        });

        return res.status(201).json(message);
    } catch (error) {
        console.error("Send message error:", error);
        return res.status(500).json({ message: "Failed to send message." });
    }
};

export const getMessages = async (req, res) => {
    try {
        const { bookingId } = req.params;
        if (!bookingId) {
            return res.status(400).json({ message: "bookingId is required." });
        }

        const messages = await Message.find({ bookingId }).sort({ createdAt: 1 });
        return res.status(200).json(messages);
    } catch (error) {
        console.error("Get messages error:", error);
        return res.status(500).json({ message: "Failed to fetch messages." });
    }
};