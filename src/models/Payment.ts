import mongoose, { Schema, Types } from "mongoose";
import { IPayment, ISandboxPaymentData } from "../interfaces/IPayment";
import IBaseDocument from "../interfaces/IBaseDocument";

export interface IPaymentDocument extends IPayment, IBaseDocument {}

const sandboxPaymentDataSchema = new Schema(
  {
    cardNumber: {
      type: String,
      required: true,
      match: [/^\d{16}$/, "Card number must be 16 digits"],
    },
    cardHolder: {
      type: String,
      required: true,
      trim: true,
    },
    expiryDate: {
      type: String,
      required: true,
      match: [
        /^(0[1-9]|1[0-2])\/\d{2}$/,
        "Expiry date must be in MM/YY format",
      ],
    },
    cvv: {
      type: String,
      required: true,
      match: [/^\d{3,4}$/, "CVV must be 3 or 4 digits"],
    },
    gatewayResponse: {
      success: { type: Boolean, required: true },
      transactionId: { type: String, required: true },
      message: { type: String, required: true },
    },
  },
  { _id: false }
);

const paymentSchema = new Schema<IPaymentDocument>(
  {
    appointmentId: {
      type: Schema.Types.ObjectId,
      ref: "Appointment",
      required: [true, "Appointment ID is required"],
      unique: true,
    },
    patientId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Patient ID is required"],
    },
    amount: {
      type: Number,
      required: [true, "Payment amount is required"],
      min: [0.01, "Amount must be greater than 0"],
      validate: {
        validator: function (value: number) {
          return /^\d+(\.\d{1,2})?$/.test(value.toString());
        },
        message: "Amount can have maximum 2 decimal places",
      },
    },
    currency: {
      type: String,
      default: "USD",
      enum: ["USD", "EUR", "BRL"],
      uppercase: true,
    },
    status: {
      type: String,
      enum: ["pending", "completed", "failed", "refunded"],
      default: "pending",
    },
    paymentMethod: {
      type: String,
      enum: ["credit_card", "debit_card", "paypal", "stripe"],
      required: [true, "Payment method is required"],
    },
    transactionId: {
      type: String,
      unique: true,
      sparse: true,
    },
    sandboxData: {
      type: sandboxPaymentDataSchema,
      required: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        if (ret.sandboxData) {
          ret.sandboxData.cardNumber =
            "**** **** **** " + ret.sandboxData.cardNumber.slice(-4);
          delete ret.sandboxData.cvv;
        }
        delete ret.__v;
        return ret;
      },
    },
  }
);

paymentSchema.index({ patientId: 1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ createdAt: -1 });

paymentSchema.pre<IPaymentDocument>("save", function (next) {
  if (!this.transactionId && this.status === "completed") {
    // Generate a unique transaction ID
    this.transactionId =
      "TXN_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
  }
  next();
});

paymentSchema.statics.getPaymentsByPatient = function (patientId: string) {
  return this.find({ patientId })
    .populate("appointmentId", "date time reason")
    .sort({ createdAt: -1 });
};

export const Payment = mongoose.model<IPaymentDocument>(
  "Payment",
  paymentSchema
);
