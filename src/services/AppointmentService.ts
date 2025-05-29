import { Types } from "mongoose";
import { Appointment } from "../models/Appointment";
import { User } from "../models/User";
import {
  parseISO,
  isBefore,
  startOfDay,
  isWeekend,
  parse,
  isValid,
} from "date-fns";
import { WORKING_HOURS_CONFIG } from "../utils/constants";

export class AppointmentService {
  /**
   * Checks if a doctor is available at a specific date and time
   * @param doctorId - Doctor's unique identifier
   * @param date - Appointment date
   * @param time - Time in HH:MM format
   * @returns True if available, false if occupied
   */
  async isDoctorAvailable(
    doctorId: string,
    date: Date,
    time: string
  ): Promise<boolean> {
    const existingAppointment = await Appointment.findOne({
      doctorId: new Types.ObjectId(doctorId),
      date,
      time,
      status: { $in: ["pending", "confirmed"] },
    });

    return !existingAppointment;
  }

  /**
   * Validates appointment time according to business rules
   * @param date - Date in YYYY-MM-DD format
   * @param time - Time in HH:MM format
   * @returns Validation result with success status and error message
   */
  isValidAppointmentTime(
    date: string,
    time: string
  ): { valid: boolean; error?: string } {
    const appointmentDate = parseISO(date);

    // Check not in the past
    if (isBefore(appointmentDate, startOfDay(new Date()))) {
      return {
        valid: false,
        error: "Cannot schedule appointments in the past",
      };
    }

    // Check not on weekends (usando isWeekend do date-fns)
    if (isWeekend(appointmentDate)) {
      return {
        valid: false,
        error: "Appointments cannot be scheduled on weekends",
      };
    }

    // Validate working hours: 7:00-12:00 and 14:00-18:00
    const parsedTime = parse(time, "HH:mm", new Date());

    if (!isValid(parsedTime)) {
      return {
        valid: false,
        error: "Invalid time format. Use HH:MM",
      };
    }

    const hours = parsedTime.getHours();
    const isValidTime =
      (hours >= WORKING_HOURS_CONFIG.MORNING_START &&
        hours < WORKING_HOURS_CONFIG.MORNING_END) ||
      (hours >= WORKING_HOURS_CONFIG.AFTERNOON_START &&
        hours < WORKING_HOURS_CONFIG.AFTERNOON_END);

    if (!isValidTime) {
      return {
        valid: false,
        error: `Appointments must be between ${WORKING_HOURS_CONFIG.MORNING_START}:00-${WORKING_HOURS_CONFIG.MORNING_END}:00 or ${WORKING_HOURS_CONFIG.AFTERNOON_START}:00-${WORKING_HOURS_CONFIG.AFTERNOON_END}:00`,
      };
    }

    return { valid: true };
  }

  /**
   * Validates that doctor and patient exist and are active
   * @param doctorId - Doctor's unique identifier
   * @param patientId - Patient's unique identifier
   * @returns Validation result with success status and error message
   */
  async validateUsers(
    doctorId: string,
    patientId: string
  ): Promise<{ valid: boolean; error?: string }> {
    const [doctor, patient] = await Promise.all([
      User.findOne({ _id: doctorId, role: "doctor", isActive: true }),
      User.findOne({ _id: patientId, role: "patient", isActive: true }),
    ]);

    if (!doctor) return { valid: false, error: "Doctor not found or inactive" };
    if (!patient)
      return { valid: false, error: "Patient not found or inactive" };

    return { valid: true };
  }

  /**
   * Gets all appointments for a doctor on the current day
   * @param doctorId - Doctor's unique identifier
   * @returns Array of today's appointments with patient info
   */
  async getTodayAppointments(doctorId: string) {
    const today = new Date();
    const startOfDay = new Date(today.setUTCHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setUTCHours(23, 59, 59, 999));

    return Appointment.find({
      doctorId: new Types.ObjectId(doctorId),
      date: { $gte: startOfDay, $lte: endOfDay },
      status: { $in: ["pending", "confirmed"] },
    })
      .populate("patientId", "name email phone")
      .sort({ time: 1 });
  }

  /**
   * Gets all appointments for a doctor by appointment status
   * @param doctorId - Doctor's unique identifier
   * @param status - Appointment status
   * @returns Array of appointments with patient info
   */
  async getDoctorAppointments(doctorId: string, status: string) {
    return Appointment.find({
      doctorId: new Types.ObjectId(doctorId),
      status: { $in: [status] },
    })
      .populate("patientId", "name email phone")
      .sort({ time: 1 });
  }

  /**
   * Gets all appointments for a specific patient
   * @param patientId - Patient's unique identifier
   * @returns Array of patient's appointments with doctor info
   */
  async getPatientAppointments(patientId: string) {
    return Appointment.find({
      patientId: new Types.ObjectId(patientId),
    })
      .populate("doctorId", "name email specialization")
      .sort({ date: -1 });
  }

  /**
   * Checks if an appointment can be confirmed by a doctor
   * @param appointmentId - Appointment's unique identifier
   * @param doctorId - Doctor's unique identifier
   * @returns Validation result indicating if confirmation is allowed
   */
  async canConfirmAppointment(
    appointmentId: string,
    doctorId: string
  ): Promise<{ can: boolean; error?: string }> {
    const appointment = await Appointment.findOne({
      _id: appointmentId,
      doctorId: new Types.ObjectId(doctorId),
    });

    if (!appointment) {
      return { can: false, error: "Appointment not found or unauthorized" };
    }

    if (appointment.status === "cancelled") {
      return { can: false, error: "Cannot confirm cancelled appointment" };
    }

    if (appointment.paymentStatus !== "paid") {
      return {
        can: false,
        error: "Appointment must be paid before confirmation",
      };
    }

    return { can: true };
  }
}
