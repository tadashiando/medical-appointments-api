import express from "express";
import authorizationRoutes from "./authorizationRoutes";
import appointmentRoutes from "./appointmentRoutes";
import paymentRoutes from "./paymentRoutes";
import scheduleRoutes from "./scheduleRoutes";

const router = express.Router();

router.use("/auth", authorizationRoutes);
router.use("/appointments", appointmentRoutes);
router.use("/payments", paymentRoutes);
router.use("/schedule", scheduleRoutes);

export default router;
