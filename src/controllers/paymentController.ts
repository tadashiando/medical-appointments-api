import { Request, Response } from "express";
import { Types } from "mongoose";
import { Payment } from "../models/Payment";
import { Appointment } from "../models/Appointment";
import { PaymentService } from "../services/PaymentService";
import { ISandboxPaymentData } from "../interfaces/IPayment";

const paymentService = new PaymentService();

/**
 * Processes payment for a medical appointment (patients only)
 * @param req - Express request object with payment data
 * @param res - Express response object
 */
export const processPayment = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const {
      appointmentId,
      amount,
      paymentMethod,
      cardNumber,
      cardHolder,
      expiryDate,
      cvv,
    } = req.body;

    if (!req.user) {
      res
        .status(401)
        .json({ success: false, message: "Authentication required" });
      return;
    }

    const patientId = req.user.userId;

    // Validate that payment can be processed
    const canPay = await paymentService.canPayAppointment(
      appointmentId,
      patientId
    );
    if (!canPay.can) {
      res.status(400).json({ success: false, message: canPay.error });
      return;
    }

    // Validate credit card data
    const cardValidation = paymentService.validateCardData({
      cardNumber,
      cardHolder,
      expiryDate,
      cvv,
    });
    if (!cardValidation.valid) {
      res.status(400).json({ success: false, message: cardValidation.error });
      return;
    }

    // Simulate payment processing in sandbox environment
    const paymentResult = paymentService.simulatePayment(cardNumber);

    // Create payment record
    const sandboxData: ISandboxPaymentData = {
      cardNumber,
      cardHolder,
      expiryDate,
      cvv,
      gatewayResponse: {
        success: paymentResult.success,
        transactionId: paymentResult.transactionId,
        message: paymentResult.message,
      },
    };

    const payment = new Payment({
      appointmentId: appointmentId,
      patientId: patientId,
      amount,
      currency: "USD",
      paymentMethod,
      status: paymentResult.success ? "completed" : "failed",
      transactionId: paymentResult.transactionId || undefined,
      sandboxData,
    });

    const savedPayment = await payment.save();

    // Update appointment if payment successful
    if (paymentResult.success) {
      await Appointment.findByIdAndUpdate(appointmentId, {
        paymentStatus: "paid",
        paymentId: savedPayment._id,
      });
    }

    res.status(paymentResult.success ? 200 : 400).json({
      success: paymentResult.success,
      message: paymentResult.message,
      data: {
        paymentId: (savedPayment._id as Types.ObjectId).toString(),
        status: savedPayment.status,
        transactionId: savedPayment.transactionId,
        amount: savedPayment.amount,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error processing payment",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
