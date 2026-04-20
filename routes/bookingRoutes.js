import express from "express";
import {
    createBooking,
    getBookingParticipants,
    getMyBookings,
    getWorkerBookingNotificationCount,
    getWorkerBookings,
    updateBookingStatus,
} from "../controllers/bookingController.js";
import auth, { authorizeRoles } from "../middleware/auth.js";

const router = express.Router();

router.post("/", auth, createBooking);
router.get("/my", auth, getMyBookings);
router.get("/worker-notification-count", auth, authorizeRoles("worker"), getWorkerBookingNotificationCount);
router.get("/worker", auth, authorizeRoles("worker"), getWorkerBookings);
router.patch("/:id/status", auth, authorizeRoles("worker"), updateBookingStatus);
router.get("/:bookingId/participants", auth, getBookingParticipants);

export default router;