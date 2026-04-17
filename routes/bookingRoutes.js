import express from "express";
import { createBooking, getMyBookings } from "../controllers/bookingController.js";
import auth from "../middleware/auth.js";

const router = express.Router();

router.post("/", auth, createBooking);
router.get("/my", auth, getMyBookings);

export default router;