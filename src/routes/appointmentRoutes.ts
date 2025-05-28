import express from "express";
import { validate } from "../middleware/validation";
import { authenticateToken } from "../middleware/authentication";
import { authorizeRole } from "../middleware/authorization";
import {
  createAppointmentSchema,
  confirmAppointmentSchema,
  appointmentParamsSchema,
} from "../utils/validationSchemas";
import {
  createAppointment,
  confirmAppointment,
  getTodayAppointments,
  getMyAppointments,
  cancelAppointment,
  getDoctorAppointments,
} from "../controllers/appointmentController";

const router = express.Router();

router.post(
  "/",
  validate(createAppointmentSchema),
  authenticateToken,
  authorizeRole(["patient"]),
  createAppointment
);

router.put(
  "/:appointmentId/confirm",
  validate(confirmAppointmentSchema),
  authenticateToken,
  authorizeRole(["doctor"]),
  confirmAppointment
);

router.get(
  "/today",
  authenticateToken,
  authorizeRole(["doctor"]),
  getTodayAppointments
);

router.get(
  "/:status",
  authenticateToken,
  authorizeRole(["doctor"]),
  getDoctorAppointments
);

router.get(
  "/my-appointments",
  authenticateToken,
  authorizeRole(["patient"]),
  getMyAppointments
);

router.put(
  "/:appointmentId/cancel",
  validate(appointmentParamsSchema),
  authenticateToken,
  authorizeRole(["patient", "doctor"]),
  cancelAppointment
);

export default router;
