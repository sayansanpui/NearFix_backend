import "dotenv/config";
import cors from "cors";
import express from "express";
import mongoose from "mongoose";
import authRoutes from "./routes/authRoutes.js";
import workerRoutes from "./routes/workerRoutes.js";

const app = express();

app.use(cors({
    origin: "*",
}));
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/workers", workerRoutes);

app.get("/health", (_req, res) => {
    res.status(200).json({ status: "ok" });
});

const port = process.env.PORT || 5021;

const startServer = async () => {
    if (!process.env.MONGO_URI) {
        console.error("Missing MONGO_URI in .env");
        process.exit(1);
    }

    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("DB Connected");

        app.listen(port, () => {
            console.log(`Server running on port ${port}`);
        });
    } catch (error) {
        console.error("DB error:", error);
        process.exit(1);
    }
};

startServer();
