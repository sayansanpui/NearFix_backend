import mongoose from "mongoose";

const workerSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        name: {
            type: String,
            required: true,
            trim: true,
        },
        skill: {
            type: String,
            required: true,
            trim: true,
        },
        price: {
            type: Number,
            required: true,
        },
        location: {
            lat: {
                type: Number,
                required: true,
            },
            lng: {
                type: Number,
                required: true,
            },
        },
        image: {
            type: String,
            required: true,
            trim: true,
        },
        availability: {
            type: Boolean,
            default: true,
        },
        rating: {
            type: Number,
            default: 0,
        },
    },
    { timestamps: true }
);

const Worker = mongoose.model("Worker", workerSchema);

export default Worker;
