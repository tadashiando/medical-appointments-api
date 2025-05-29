import { Types } from "mongoose";
import { Appointment } from "../models/Appointment";
import { parseISO, isWeekend } from "date-fns";
import {
  DEFAULT_APPOINTMENT_DURATION,
  WORKING_HOURS_CONFIG,
} from "../utils/constants";

export class ScheduleService {
  /**
   * Generates available time slots for a day (every 30 minutes)
   * @returns Array of time slots in HH:MM format
   */
  generateTimeSlots(): string[] {
    const slots: string[] = [];
    const slotDuration = DEFAULT_APPOINTMENT_DURATION;

    // Morning slots
    for (
      let hour = WORKING_HOURS_CONFIG.MORNING_START;
      hour < WORKING_HOURS_CONFIG.MORNING_END;
      hour++
    ) {
      slots.push(`${hour.toString().padStart(2, "0")}:00`);
      slots.push(`${hour.toString().padStart(2, "0")}:30`);
    }

    // Afternoon slots
    for (
      let hour = WORKING_HOURS_CONFIG.AFTERNOON_START;
      hour < WORKING_HOURS_CONFIG.AFTERNOON_END;
      hour++
    ) {
      slots.push(`${hour.toString().padStart(2, "0")}:00`);
      slots.push(`${hour.toString().padStart(2, "0")}:30`);
    }

    return slots;
  }

  /**
   * Gets available time slots for a doctor on a specific date
   * @param doctorId - Doctor's unique identifier
   * @param date - Date in YYYY-MM-DD format
   * @returns Array of available time slots
   */
  async getAvailableSlots(doctorId: string, date: string): Promise<string[]> {
    const appointmentDate = parseISO(date);

    // No slots available on weekends
    if (isWeekend(appointmentDate)) {
      return [];
    }

    // No slots available for past dates
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (appointmentDate < today) {
      return [];
    }

    // Get all possible time slots
    const allSlots = this.generateTimeSlots();

    // Get existing appointments for the day
    const existingAppointments = await Appointment.find({
      doctorId: new Types.ObjectId(doctorId),
      date: appointmentDate,
      status: { $in: ["pending", "confirmed"] },
    }).select("time");

    const bookedTimes = existingAppointments.map((apt) => apt.time);

    // Return available slots (not booked)
    return allSlots.filter((slot) => !bookedTimes.includes(slot));
  }
}
