import express from "express";
import {
    createWorker,
    deleteMyWorkerProfile,
    getAllWorkers,
    getMyWorkerProfile,
    updateAvailability,
    updateMyWorkerProfile,
} from "../controllers/workerController.js";
import auth, { authorizeRoles } from "../middleware/auth.js";

const router = express.Router();

router.post("/", auth, authorizeRoles("worker"), createWorker);
router.get("/me", auth, authorizeRoles("worker"), getMyWorkerProfile);
router.patch("/me", auth, authorizeRoles("worker"), updateMyWorkerProfile);
router.delete("/me", auth, authorizeRoles("worker"), deleteMyWorkerProfile);
router.patch("/availability", auth, authorizeRoles("worker"), updateAvailability);
router.get("/", getAllWorkers);

export default router;
