import express from "express";
import { getMessages, sendMessage } from "../controllers/messageController.js";
import auth from "../middleware/auth.js";

const router = express.Router();

router.post("/", auth, sendMessage);
router.get("/:bookingId", getMessages);

export default router;