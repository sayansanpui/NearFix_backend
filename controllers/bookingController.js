import Booking from "../models/Booking.js";
import Worker from "../models/Worker.js";

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