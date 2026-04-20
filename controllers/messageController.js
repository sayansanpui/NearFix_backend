import Message from "../models/Message.js";
import Booking from "../models/Booking.js";
import mongoose from "mongoose";

const normalizeId = (value) => {
    if (!value) return "";
    return typeof value === "string" ? value : value.toString();
};

const isSameId = (left, right) => normalizeId(left) === normalizeId(right);

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

        if (!mongoose.isValidObjectId(bookingId)) {
            return res.status(400).json({ message: "Invalid bookingId." });
        }

        if (!mongoose.isValidObjectId(receiverId)) {
            return res.status(400).json({ message: "Invalid receiverId." });
        }

        const booking = await Booking.findById(bookingId).populate("workerId", "userId");
        if (!booking || !booking.workerId) {
            return res.status(404).json({ message: "Booking not found." });
        }

        const customerUserId = normalizeId(booking.userId);
        const workerUserId = normalizeId(booking.workerId.userId);
        const isCustomerSender = isSameId(senderId, customerUserId);
        const isWorkerSender = isSameId(senderId, workerUserId);

        if (!isCustomerSender && !isWorkerSender) {
            return res.status(403).json({ message: "Forbidden." });
        }

        const expectedReceiverId = isCustomerSender ? workerUserId : customerUserId;
        if (!isSameId(receiverId, expectedReceiverId)) {
            return res.status(400).json({
                message: "receiverId must be the other booking participant.",
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
        const authUserId = req.user?.userId;
        if (!authUserId) {
            return res.status(401).json({ message: "Unauthorized." });
        }

        const { bookingId } = req.params;
        if (!bookingId) {
            return res.status(400).json({ message: "bookingId is required." });
        }

        if (!mongoose.isValidObjectId(bookingId)) {
            return res.status(400).json({ message: "Invalid bookingId." });
        }

        const booking = await Booking.findById(bookingId).populate("workerId", "userId");
        if (!booking || !booking.workerId) {
            return res.status(404).json({ message: "Booking not found." });
        }

        const customerUserId = normalizeId(booking.userId);
        const workerUserId = normalizeId(booking.workerId.userId);
        const isCustomer = isSameId(authUserId, customerUserId);
        const isWorker = isSameId(authUserId, workerUserId);

        if (!isCustomer && !isWorker) {
            return res.status(403).json({ message: "Forbidden." });
        }

        await Message.updateMany(
            {
                bookingId,
                receiverId: authUserId,
                isRead: { $ne: true },
            },
            {
                $set: { isRead: true },
            }
        );

        const messages = await Message.find({ bookingId }).sort({ createdAt: 1 });
        return res.status(200).json(messages);
    } catch (error) {
        console.error("Get messages error:", error);
        return res.status(500).json({ message: "Failed to fetch messages." });
    }
};

export const getUnreadCount = async (req, res) => {
    try {
        const authUserId = req.user?.userId;
        if (!authUserId) {
            return res.status(401).json({ message: "Unauthorized." });
        }

        const unreadCount = await Message.countDocuments({
            receiverId: authUserId,
            isRead: { $ne: true },
        });

        return res.status(200).json({ unreadCount });
    } catch (error) {
        console.error("Get unread count error:", error);
        return res.status(500).json({ message: "Failed to fetch unread count." });
    }
};