import { Types } from "mongoose";
import { Appointment } from "../models/Appointment";
import { User } from "../models/User";
import { getDay, parseISO, isBefore, startOfDay } from "date-fns";

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

    // Check not on weekends
    const dayOfWeek = getDay(appointmentDate);
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return {
        valid: false,
        error: "Appointments cannot be scheduled on weekends",
      };
    }

    // Validate working hours: 7:00-12:00 and 14:00-18:00
    const timeParts = time.split(":");
    if (timeParts.length !== 2) {
      throw new Error("Invalid time format. Use HH:MM");
    }

    const hours = parseInt(timeParts[0]!);
    const minutes = parseInt(timeParts[1]!);

    if (isNaN(hours) || isNaN(minutes)) {
      throw new Error("Invalid time format. Use HH:MM");
    }
    const totalMinutes = hours * 60 + minutes;
    const morningStart = 7 * 60,
      morningEnd = 12 * 60;
    const afternoonStart = 14 * 60,
      afternoonEnd = 18 * 60;

    const isValidTime =
      (totalMinutes >= morningStart && totalMinutes < morningEnd) ||
      (totalMinutes >= afternoonStart && totalMinutes < afternoonEnd);

    if (!isValidTime) {
      return {
        valid: false,
        error: "Appointments must be between 7:00-12:00 or 14:00-18:00",
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
    console.log(patientId);
    
    const [doctor, patient] = await Promise.all([
      User.findOne({ _id: doctorId, role: "doctor", isActive: true }),
      User.findOne({ _id: patientId, role: "patient", isActive: true }),
    ]);

    console.log(patient);
    
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
