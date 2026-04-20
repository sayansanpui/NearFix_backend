import express from "express";
import { getMessages, getUnreadCount, sendMessage } from "../controllers/messageController.js";
import auth, { authorizeRoles } from "../middleware/auth.js";

const router = express.Router();

router.post("/", auth, sendMessage);
router.get("/unread-count", auth, authorizeRoles("worker"), getUnreadCount);
router.get("/:bookingId", auth, getMessages);

export default router;