import "dotenv/config";
import mongoose from "mongoose";

if (!process.env.MONGO_URI) {
  console.error("Missing MONGO_URI in .env");
  process.exit(1);
}

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("DB Connected");
    process.exit(0);
  })
  .catch((err) => {
    console.error("DB error:", err);
    process.exit(1);
  });
