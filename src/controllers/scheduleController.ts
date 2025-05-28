import { Request, Response } from "express";
import { User } from "../models/User";
import { ScheduleService } from "../services/ScheduleService";

const scheduleService = new ScheduleService();

/**
 * Gets available time slots for a doctor on a specific date
 * @param req - Express request object with doctor ID and date
 * @param res - Express response object
 */
export const getAvailableSlots = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { doctorId } = req.params;
    const { date } = req.query as { date: string };

    if (!doctorId) {
      res
        .status(400)
        .json({ success: false, message: "Doctor ID is required" });
      return;
    }

    // Verify doctor exists and is active
    const doctor = await User.findOne({
      _id: doctorId,
      role: "doctor",
      isActive: true,
    });

    if (!doctor) {
      res
        .status(404)
        .json({ success: false, message: "Doctor not found or inactive" });
      return;
    }

    // Get available slots for the requested date
    const availableSlots = await scheduleService.getAvailableSlots(
      doctorId,
      date
    );

    res.json({
      success: true,
      message: "Available slots retrieved successfully",
      data: {
        doctorId,
        doctorName: doctor.name,
        date,
        availableSlots,
        totalSlots: availableSlots.length,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error retrieving available slots",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
