import express from "express";
import { createWorker, getAllWorkers } from "../controllers/workerController.js";
import auth, { authorizeRoles } from "../middleware/auth.js";

const router = express.Router();

router.post("/", auth, authorizeRoles("worker"), createWorker);
router.get("/", getAllWorkers);

export default router;
