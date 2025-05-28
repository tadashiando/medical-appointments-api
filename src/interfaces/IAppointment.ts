import { Types } from "mongoose";

export interface IAppointment {
  patientId: Types.ObjectId;
  doctorId: Types.ObjectId;
  date: Date;
  time: string;
  duration: number;
  reason: string;
  notes?: string;
  status: "pending" | "confirmed" | "cancelled" | "completed";
  paymentStatus: "pending" | "paid" | "refunded";
  paymentId?: Types.ObjectId;
}
