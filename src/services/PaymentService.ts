import { Types } from "mongoose";
import { Payment } from "../models/Payment";
import { Appointment } from "../models/Appointment";

export class PaymentService {
  /**
   * Validates if an appointment can be paid by a patient
   * @param appointmentId - Appointment's unique identifier
   * @param patientId - Patient's unique identifier
   * @returns Validation result indicating if payment is allowed
   */
  async canPayAppointment(
    appointmentId: string,
    patientId: string
  ): Promise<{ can: boolean; error?: string }> {
    const appointment = await Appointment.findOne({
      _id: appointmentId,
      patientId: new Types.ObjectId(patientId),
    });

    if (!appointment) {
      return { can: false, error: "Appointment not found or unauthorized" };
    }

    if (appointment.status === "cancelled") {
      return { can: false, error: "Cannot pay for cancelled appointment" };
    }

    if (appointment.paymentStatus === "paid") {
      return { can: false, error: "Appointment is already paid" };
    }

    return { can: true };
  }

  /**
   * Validates credit card data format and expiration
   * @param cardData - Credit card information object
   * @returns Validation result with success status and error message
   */
  validateCardData(cardData: {
    cardNumber: string;
    expiryDate: string;
    cvv: string;
    cardHolder: string;
  }): { valid: boolean; error?: string } {
    // Validate card number (16 digits)
    if (!/^\d{16}$/.test(cardData.cardNumber)) {
      return { valid: false, error: "Card number must be 16 digits" };
    }

    // Validate expiry date format (MM/YY)
    if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(cardData.expiryDate)) {
      return { valid: false, error: "Expiry date must be in MM/YY format" };
    }

    // Check card not expired
    const [month, year] = cardData.expiryDate.split("/");
    const expiryDate = new Date(2000 + parseInt(year!), parseInt(month!) - 1);
    const now = new Date();
    now.setDate(1);

    if (expiryDate < now) {
      return { valid: false, error: "Card has expired" };
    }

    // Validate CVV (3 or 4 digits)
    if (!/^\d{3,4}$/.test(cardData.cvv)) {
      return { valid: false, error: "CVV must be 3 or 4 digits" };
    }

    // Validate cardholder name
    if (!cardData.cardHolder.trim() || cardData.cardHolder.length < 2) {
      return { valid: false, error: "Card holder name is required" };
    }

    return { valid: true };
  }

  /**
   * Simulates payment processing in sandbox environment
   * @param cardNumber - Credit card number for simulation rules
   * @returns Simulated payment gateway response
   */
  simulatePayment(cardNumber: string): {
    success: boolean;
    transactionId: string;
    message: string;
  } {
    // Sandbox rules: cards ending in 0 always fail, others have 90% success
    const lastDigit = parseInt(cardNumber.slice(-1));
    const success = lastDigit !== 0 && Math.random() > 0.1;

    const transactionId = success
      ? `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      : "";

    const message = success
      ? "Payment processed successfully"
      : "Payment failed - Card declined";

    return { success, transactionId, message };
  }
}
