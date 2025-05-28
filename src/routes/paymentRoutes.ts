import express from "express";
import { validate } from "../middleware/validation";
import { authenticateToken } from "../middleware/authentication";
import { authorizeRole } from "../middleware/authorization";
import { processPaymentSchema } from "../utils/validationSchemas";
import { processPayment } from "../controllers/paymentController";

const router = express.Router();

router.post(
  "/process",
  validate(processPaymentSchema),
  authenticateToken,
  authorizeRole(["patient"]),
  processPayment
);

export default router;
