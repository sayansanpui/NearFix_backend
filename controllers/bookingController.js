import Booking from "../models/Booking.js";
import Worker from "../models/Worker.js";
import mongoose from "mongoose";

const normalizeId = (value) => {
    if (!value) return "";
    return typeof value === "string" ? value : value.toString();
};

const isSameId = (left, right) => normalizeId(left) === normalizeId(right);

export const createBooking = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized." });
        }

        const { workerId } = req.body;
        if (!workerId) {
            return res.status(400).json({ message: "workerId is required." });
        }

        if (!mongoose.isValidObjectId(workerId)) {
            return res.status(400).json({ message: "Invalid workerId." });
        }

        const worker = await Worker.findById(workerId);
        if (!worker) {
            return res.status(404).json({ message: "Worker not found." });
        }

        await Booking.create({
            userId,
            workerId,
        });

        return res.status(201).json({ message: "Booking created successfully." });
    } catch (error) {
        console.error("Create booking error:", error);
        return res.status(500).json({ message: "Failed to create booking." });
    }
};

export const getMyBookings = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized." });
        }

        const bookings = await Booking.find({ userId }).sort({ createdAt: -1 });
        return res.status(200).json(bookings);
    } catch (error) {
        console.error("Get my bookings error:", error);
        return res.status(500).json({ message: "Failed to fetch bookings." });
    }
};

export const getWorkerBookings = async (req, res) => {
    try {
        const authUserId = req.user?.userId;
        const authRole = req.user?.role;

        if (!authUserId) {
            return res.status(401).json({ message: "Unauthorized." });
        }

        if (authRole !== "worker") {
            return res.status(403).json({ message: "Only workers can access worker bookings." });
        }

        const workerProfile = await Worker.findOne({ userId: authUserId }).select("_id name userId");
        if (!workerProfile) {
            return res.status(404).json({ message: "Worker profile not found." });
        }

        const bookings = await Booking.find({ workerId: workerProfile._id })
            .populate("userId", "name")
            .sort({ createdAt: -1 });

        const response = bookings.map((booking) => ({
            bookingId: booking._id,
            status: booking.status,
            createdAt: booking.createdAt,
            user: {
                id: booking.userId?._id,
                name: booking.userId?.name || "",
            },
            worker: {
                id: workerProfile._id,
                name: workerProfile.name,
                userId: workerProfile.userId,
            },
        }));

        await Booking.updateMany(
            {
                workerId: workerProfile._id,
                seenByWorker: false,
            },
            {
                $set: { seenByWorker: true },
            }
        );

        return res.status(200).json(response);
    } catch (error) {
        console.error("Get worker bookings error:", error);
        return res.status(500).json({ message: "Failed to fetch worker bookings." });
    }
};

export const getWorkerBookingNotificationCount = async (req, res) => {
    try {
        const authUserId = req.user?.userId;
        const authRole = req.user?.role;

        if (!authUserId) {
            return res.status(401).json({ message: "Unauthorized." });
        }

        if (authRole !== "worker") {
            return res.status(403).json({ message: "Only workers can access booking notifications." });
        }

        const workerProfile = await Worker.findOne({ userId: authUserId }).select("_id");
        if (!workerProfile) {
            return res.status(404).json({ message: "Worker profile not found." });
        }

        const unseenBookingCount = await Booking.countDocuments({
            workerId: workerProfile._id,
            seenByWorker: false,
        });

        return res.status(200).json({ unseenBookingCount });
    } catch (error) {
        console.error("Get worker booking notification count error:", error);
        return res.status(500).json({ message: "Failed to fetch booking notifications." });
    }
};

export const updateBookingStatus = async (req, res) => {
    try {
        const authUserId = req.user?.userId;
        const authRole = req.user?.role;

        if (!authUserId) {
            return res.status(401).json({ message: "Unauthorized." });
        }

        if (authRole !== "worker") {
            return res.status(403).json({ message: "Only workers can update booking status." });
        }

        const { id: bookingId } = req.params;
        const { status } = req.body || {};

        if (!bookingId) {
            return res.status(400).json({ message: "bookingId is required." });
        }

        if (!mongoose.isValidObjectId(bookingId)) {
            return res.status(400).json({ message: "Invalid bookingId." });
        }

        const allowedStatuses = new Set(["pending", "accepted", "rejected", "completed"]);
        if (typeof status !== "string" || !allowedStatuses.has(status)) {
            return res.status(400).json({
                message: "status must be one of: pending, accepted, rejected, completed.",
            });
        }

        const workerProfile = await Worker.findOne({ userId: authUserId }).select("_id");
        if (!workerProfile) {
            return res.status(404).json({ message: "Worker profile not found." });
        }

        const booking = await Booking.findById(bookingId);
        if (!booking) {
            return res.status(404).json({ message: "Booking not found." });
        }

        if (!isSameId(booking.workerId, workerProfile._id)) {
            return res.status(403).json({ message: "Forbidden." });
        }

        const allowedTransitions = {
            confirmed: new Set(["accepted", "rejected"]),
            pending: new Set(["accepted", "rejected"]),
            accepted: new Set(["completed"]),
            rejected: new Set(),
            completed: new Set(),
        };

        const currentStatus = booking.status === "confirmed" ? "pending" : booking.status;
        const nextAllowedStatuses = allowedTransitions[booking.status] || allowedTransitions[currentStatus] || new Set();
        if (!nextAllowedStatuses.has(status)) {
            return res.status(400).json({
                message: `Invalid status transition from ${booking.status} to ${status}.`,
            });
        }

        booking.status = status;
        await booking.save();

        return res.status(200).json({
            message: "Booking status updated successfully.",
            booking,
        });
    } catch (error) {
        console.error("Update booking status error:", error);
        return res.status(500).json({ message: "Failed to update booking status." });
    }
};

export const getBookingParticipants = async (req, res) => {
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

        const booking = await Booking.findById(bookingId)
            .populate("userId", "name")
            .populate("workerId", "name userId");

        if (!booking || !booking.userId || !booking.workerId) {
            return res.status(404).json({ message: "Booking not found." });
        }

        const customerUserId = normalizeId(booking.userId._id);
        const workerUserId = normalizeId(booking.workerId.userId);
        const isCustomer = isSameId(authUserId, customerUserId);
        const isWorker = isSameId(authUserId, workerUserId);

        if (!isCustomer && !isWorker) {
            return res.status(403).json({ message: "Forbidden." });
        }

        const receiverId = isCustomer ? workerUserId : customerUserId;

        return res.status(200).json({
            bookingId: booking._id,
            user: {
                id: booking.userId._id,
                name: booking.userId.name,
            },
            worker: {
                id: booking.workerId._id,
                name: booking.workerId.name,
                userId: booking.workerId.userId,
            },
            receiverId,
        });
    } catch (error) {
        console.error("Get booking participants error:", error);
        return res.status(500).json({ message: "Failed to fetch booking participants." });
    }
};