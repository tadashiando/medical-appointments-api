import { Request, Response } from "express";
import { Types } from "mongoose";
import { Appointment } from "../models/Appointment";
import { AppointmentService } from "../services/AppointmentService";
import { parseISO } from "date-fns";

const appointmentService = new AppointmentService();
/**
 * Creates a new medical appointment for a patient
 * @param req - Express request object with appointment data
 * @param res - Express response object
 */
export const createAppointment = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { doctorId, date, time, reason, notes } = req.body;

    if (!req.user) {
      res
        .status(401)
        .json({ success: false, message: "Authentication required" });
      return;
    }

    const patientId = req.user.userId;

    // Validate that doctor and patient exist and are active
    const userValidation = await appointmentService.validateUsers(
      doctorId,
      patientId
    );
    if (!userValidation.valid) {
      res.status(400).json({ success: false, message: userValidation.error });
      return;
    }

    // Validate appointment time according to business rules
    const timeValidation = appointmentService.isValidAppointmentTime(
      date,
      time
    );
    if (!timeValidation.valid) {
      res.status(400).json({ success: false, message: timeValidation.error });
      return;
    }

    // Check doctor availability for the requested slot
    const appointmentDate = parseISO(date);
    const isAvailable = await appointmentService.isDoctorAvailable(
      doctorId,
      appointmentDate,
      time
    );
    if (!isAvailable) {
      res
        .status(400)
        .json({ success: false, message: "Time slot is not available" });
      return;
    }

    // Create the appointment
    const appointment = new Appointment({
      patientId: new Types.ObjectId(patientId),
      doctorId: new Types.ObjectId(doctorId as string),
      date: appointmentDate,
      time,
      reason,
      notes,
      status: "pending",
      paymentStatus: "pending",
    });

    await appointment.save();
    const populatedAppointment = await appointment.populate(
      "doctorId",
      "name email specialization"
    );

    res.status(201).json({
      success: true,
      message: "Appointment created successfully",
      data: populatedAppointment,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error creating appointment",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * Confirms an appointment (doctors only, requires payment)
 * @param req - Express request object with appointment ID and optional notes
 * @param res - Express response object
 */
export const confirmAppointment = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { appointmentId } = req.params;
    const { notes } = req.body;

    if (!req.user) {
      res
        .status(401)
        .json({ success: false, message: "Authentication required" });
      return;
    }

    if (!appointmentId) {
      res
        .status(400)
        .json({ success: false, message: "Appointment ID is required" });
      return;
    }

    const doctorId = req.user.userId;

    // Validate that appointment can be confirmed
    const validation = await appointmentService.canConfirmAppointment(
      appointmentId,
      doctorId
    );
    if (!validation.can) {
      res.status(400).json({ success: false, message: validation.error });
      return;
    }

    // Update appointment status to confirmed
    const appointment = await Appointment.findByIdAndUpdate(
      appointmentId,
      {
        status: "confirmed",
        notes: notes ? `Doctor notes: ${notes}` : undefined,
      },
      { new: true }
    ).populate("patientId", "name email phone");

    res.json({
      success: true,
      message: "Appointment confirmed successfully",
      data: appointment,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error confirming appointment",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * Gets all appointments for the current day (doctors only)
 * @param req - Express request object
 * @param res - Express response object
 */
export const getTodayAppointments = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res
        .status(401)
        .json({ success: false, message: "Authentication required" });
      return;
    }

    const doctorId = req.user.userId;

    const appointments = await appointmentService.getTodayAppointments(
      doctorId
    );

    res.json({
      success: true,
      message: "Today appointments retrieved successfully",
      data: appointments,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error retrieving appointments",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * Gets all appointments for the authenticated patient
 * @param req - Express request object
 * @param res - Express response object
 */
export const getMyAppointments = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res
        .status(401)
        .json({ success: false, message: "Authentication required" });
      return;
    }

    const patientId = req.user.userId;

    const appointments = await appointmentService.getPatientAppointments(
      patientId
    );

    res.json({
      success: true,
      message: "Appointments retrieved successfully",
      data: appointments,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error retrieving appointments",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * Gets all appointments for the authenticated doctor by status
 * @param req - Express request object
 * @param res - Express response object
 */
export const getDoctorAppointments = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res
        .status(401)
        .json({ success: false, message: "Authentication required" });
      return;
    }

    const doctorId = req.user.userId;
    const { status } = req.params;

    const appointments = await appointmentService.getDoctorAppointments(
      doctorId,
      status ?? "pending"
    );

    res.json({
      success: true,
      message: "Appointments retrieved successfully",
      data: appointments,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error retrieving appointments",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * Cancels an appointment (patients and doctors)
 * @param req - Express request object with appointment ID
 * @param res - Express response object
 */
export const cancelAppointment = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { appointmentId } = req.params;

    if (!req.user) {
      res
        .status(401)
        .json({ success: false, message: "Authentication required" });
      return;
    }

    if (!appointmentId) {
      res
        .status(400)
        .json({ success: false, message: "Appointment ID is required" });
      return;
    }

    const userId = req.user.userId;
    const userRole = req.user.role;

    // Build query based on user role for authorization
    const query: any = { _id: appointmentId };
    if (userRole === "patient") {
      query.patientId = new Types.ObjectId(userId);
    } else {
      query.doctorId = new Types.ObjectId(userId);
    }

    const appointment = await Appointment.findOne(query);
    if (!appointment) {
      res.status(404).json({
        success: false,
        message: "Appointment not found or unauthorized",
      });
      return;
    }

    // Validate appointment can be cancelled
    if (appointment.status === "cancelled") {
      res
        .status(400)
        .json({ success: false, message: "Appointment is already cancelled" });
      return;
    }

    if (appointment.status === "completed") {
      res.status(400).json({
        success: false,
        message: "Cannot cancel completed appointment",
      });
      return;
    }

    // Cancel the appointment
    appointment.status = "cancelled";
    await appointment.save();

    res.json({
      success: true,
      message: "Appointment cancelled successfully",
      data: appointment,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error cancelling appointment",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
