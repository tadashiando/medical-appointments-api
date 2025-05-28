import { Types } from "mongoose";
import { Appointment } from "../models/Appointment";
import { parseISO, isWeekend } from "date-fns";

export class ScheduleService {
  /**
   * Generates available time slots for a day (every 30 minutes)
   * @returns Array of time slots in HH:MM format
   */
  generateTimeSlots(): string[] {
    const slots: string[] = [];

    // Morning slots: 7:00-11:30 (last slot ends at 12:00)
    for (let hour = 7; hour < 12; hour++) {
      slots.push(`${hour.toString().padStart(2, "0")}:00`);
      slots.push(`${hour.toString().padStart(2, "0")}:30`);
    }

    // Afternoon slots: 14:00-17:30 (last slot ends at 18:00)
    for (let hour = 14; hour < 18; hour++) {
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
