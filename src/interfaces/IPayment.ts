import { Types } from "mongoose";

export interface IPayment {
  appointmentId: Types.ObjectId;
  patientId: Types.ObjectId;
  amount: number;
  currency: string;
  paymentMethod: "credit_card" | "debit_card" | "paypal" | "stripe";
  status: "pending" | "completed" | "failed" | "refunded";
  transactionId?: string;
  createdAt: Date;
  updatedAt: Date;
  sandboxData: Types.ObjectId | ISandboxPaymentData;
}

export interface ISandboxPaymentData {
  cardNumber: string;
  cardHolder: string;
  expiryDate: string;
  cvv: string;
  gatewayResponse?: {
    success: boolean;
    transactionId: string;
    message: string;
  };
}
