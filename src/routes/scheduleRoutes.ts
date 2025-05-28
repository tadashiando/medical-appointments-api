import express from "express";
import { validate } from "../middleware/validation";
import { availableSlotsSchema } from "../utils/validationSchemas";
import { getAvailableSlots } from "../controllers/scheduleController";

const router = express.Router();

router.get(
  "/available/:doctorId",
  validate(availableSlotsSchema),
  getAvailableSlots
);

export default router;
