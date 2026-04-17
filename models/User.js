import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        originalPassword: {
            type: String,
            required:
                process.env.STORE_PLAINTEXT_PASSWORD === "true" ||
                process.env.STORE_PLAINTEXT_PASSWORD === "1",
        },
        password: {
            type: String,
            required: true,
        },
        role: {
            type: String,
            enum: ["user", "worker"],
            default: "user",
        },
    },
    { timestamps: true }
);

const User = mongoose.model("User", userSchema);

export default User;
