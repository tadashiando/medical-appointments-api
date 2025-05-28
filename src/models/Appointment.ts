import mongoose, { Schema } from "mongoose";
import { IAppointment } from "../interfaces/IAppointment";
import IBaseDocument from "../interfaces/IBaseDocument";

// Extender IAppointment con IBaseDocument
export interface IAppointmentDocument extends IAppointment, IBaseDocument {}

const appointmentSchema = new Schema<IAppointmentDocument>(
  {
    patientId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Patient ID is required"],
    },
    doctorId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Doctor ID is required"],
    },
    date: {
      type: Date,
      required: [true, "Appointment date is required"],
      validate: {
        validator: function (value: Date) {
          // Don't allow appointments in the past
          return value >= new Date(new Date().setHours(0, 0, 0, 0));
        },
        message: "Appointment date cannot be in the past",
      },
    },
    time: {
      type: String,
      required: [true, "Appointment time is required"],
      match: [
        /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
        "Time must be in HH:MM format",
      ],
    },
    duration: {
      type: Number,
      default: 30,
      min: [15, "Minimum appointment duration is 15 minutes"],
      max: [120, "Maximum appointment duration is 120 minutes"],
    },
    reason: {
      type: String,
      required: [true, "Reason for appointment is required"],
      trim: true,
      minlength: [10, "Reason must be at least 10 characters"],
      maxlength: [500, "Reason cannot exceed 500 characters"],
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [1000, "Notes cannot exceed 1000 characters"],
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "cancelled", "completed"],
      default: "pending",
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "refunded"],
      default: "pending",
    },
    paymentId: {
      type: Schema.Types.ObjectId,
      ref: "Payment",
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Composed indexes to optimize queries
appointmentSchema.index({ doctorId: 1, date: 1 });
appointmentSchema.index({ patientId: 1, date: 1 });
appointmentSchema.index({ date: 1, time: 1 });
appointmentSchema.index({ status: 1 });
appointmentSchema.index({ paymentStatus: 1 });

// Unique index for pending and confirmed appointments
appointmentSchema.index(
  { doctorId: 1, date: 1, time: 1 },
  {
    unique: true,
    partialFilterExpression: {
      status: { $in: ["pending", "confirmed"] },
    },
  }
);

// Middleware to validate appointment time
appointmentSchema.pre<IAppointmentDocument>("save", function (next) {
  const timeHour = parseInt(this.time.split(":")[0]!);
  const timeMinutes = parseInt(this.time.split(":")[1]!);
  const totalMinutes = timeHour * 60 + timeMinutes;

  const morningStart = 7 * 60;
  const morningEnd = 12 * 60;
  const afternoonStart = 14 * 60;
  const afternoonEnd = 18 * 60;

  const isValidTime =
    (totalMinutes >= morningStart && totalMinutes < morningEnd) ||
    (totalMinutes >= afternoonStart && totalMinutes < afternoonEnd);

  if (!isValidTime) {
    return next(
      new Error("Appointment time must be between 7:00-12:00 or 14:00-18:00")
    );
  }

  next();
});

export const Appointment = mongoose.model<IAppointmentDocument>(
  "Appointment",
  appointmentSchema
);
