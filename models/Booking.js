import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        workerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Worker",
            required: true,
        },
        status: {
            type: String,
            default: "confirmed",
            trim: true,
        },
        seenByWorker: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: { createdAt: true, updatedAt: false },
    }
);

const Booking = mongoose.model("Booking", bookingSchema);

export default Booking;