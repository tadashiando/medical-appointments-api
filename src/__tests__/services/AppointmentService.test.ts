import { AppointmentService } from "../../services/AppointmentService";
import { User } from "../../models/User";
import { Appointment } from "../../models/Appointment";
import { mockUsers, mockAppointments, mockIds } from "../utils/testHelpers";
import { log } from "console";

// Mock the models
jest.mock("../../models/User");
jest.mock("../../models/Appointment");

const MockedUser = jest.mocked(User);
const MockedAppointment = jest.mocked(Appointment);

describe("AppointmentService", () => {
  let appointmentService: AppointmentService;

  beforeEach(() => {
    appointmentService = new AppointmentService();
    jest.clearAllMocks();
  });

  describe("isDoctorAvailable", () => {
    it("should return true when doctor is available", async () => {
      // Arrange
      MockedAppointment.findOne = jest.fn().mockResolvedValue(null);

      // Act
      const result = await appointmentService.isDoctorAvailable(
        mockIds.doctor1,
        new Date("2025-10-15"),
        "09:00"
      );

      // Assert
      expect(result).toBe(true);
      expect(MockedAppointment.findOne).toHaveBeenCalledWith({
        doctorId: expect.anything(),
        date: new Date("2025-10-15"),
        time: "09:00",
        status: { $in: ["pending", "confirmed"] },
      });
    });

    it("should return false when doctor is not available", async () => {
      // Arrange
      MockedAppointment.findOne = jest
        .fn()
        .mockResolvedValue(mockAppointments.pending);

      // Act
      const result = await appointmentService.isDoctorAvailable(
        mockIds.doctor1,
        new Date("2025-10-15"),
        "09:00"
      );

      // Assert
      expect(result).toBe(false);
    });
  });

  describe("isValidAppointmentTime", () => {
    it("should return valid for working hours", () => {
      // Test morning hours
      const morningResult = appointmentService.isValidAppointmentTime(
        "2025-10-15",
        "09:00"
      );
      
      expect(morningResult.valid).toBe(true);

      // Test afternoon hours
      const afternoonResult = appointmentService.isValidAppointmentTime(
        "2025-10-15",
        "15:00"
      );
      expect(afternoonResult.valid).toBe(true);
    });

    it("should return invalid for non-working hours", () => {
      // Test lunch break
      const lunchResult = appointmentService.isValidAppointmentTime(
        "2025-10-15",
        "13:00"
      );
      expect(lunchResult.valid).toBe(false);
      expect(lunchResult.error).toContain("7:00-12:00 or 14:00-18:00");

      // Test evening
      const eveningResult = appointmentService.isValidAppointmentTime(
        "2025-10-15",
        "19:00"
      );
      expect(eveningResult.valid).toBe(false);
    });

    it("should return invalid for weekends", () => {
      // Test Saturday (day 6)
      const saturdayResult = appointmentService.isValidAppointmentTime(
        "2025-10-18",
        "09:00"
      ); // Saturday
      expect(saturdayResult.valid).toBe(false);
      expect(saturdayResult.error).toContain("weekends");

      // Test Sunday (day 0)
      const sundayResult = appointmentService.isValidAppointmentTime(
        "2025-10-19",
        "09:00"
      ); // Sunday
      expect(sundayResult.valid).toBe(false);
      expect(sundayResult.error).toContain("weekends");
    });

    it("should return invalid for past dates", () => {
      const result = appointmentService.isValidAppointmentTime(
        "2024-03-14",
        "09:00"
      );
      expect(result.valid).toBe(false);
      expect(result.error).toContain("past");

      // Restore Date
      jest.restoreAllMocks();
    });
  });

  describe("validateUsers", () => {
    it("should return valid when both users exist and are active", async () => {
      // Arrange
      MockedUser.findOne = jest
        .fn()
        .mockResolvedValueOnce(mockUsers.doctor) // First call for doctor
        .mockResolvedValueOnce(mockUsers.patient); // Second call for patient

      // Act
      const result = await appointmentService.validateUsers(
        mockIds.doctor1,
        mockIds.patient1
      );

      // Assert
      expect(result.valid).toBe(true);
      expect(MockedUser.findOne).toHaveBeenCalledTimes(2);
    });

    it("should return invalid when doctor not found", async () => {
      // Arrange
      MockedUser.findOne = jest
        .fn()
        .mockResolvedValueOnce(null) // Doctor not found
        .mockResolvedValueOnce(mockUsers.patient);

      // Act
      const result = await appointmentService.validateUsers(
        mockIds.doctor1,
        mockIds.patient1
      );

      // Assert
      expect(result.valid).toBe(false);
      expect(result.error).toContain("Doctor not found");
    });

    it("should return invalid when patient not found", async () => {
      // Arrange
      MockedUser.findOne = jest
        .fn()
        .mockResolvedValueOnce(mockUsers.doctor)
        .mockResolvedValueOnce(null); // Patient not found

      // Act
      const result = await appointmentService.validateUsers(
        mockIds.doctor1,
        mockIds.patient1
      );

      // Assert
      expect(result.valid).toBe(false);
      expect(result.error).toContain("Patient not found");
    });
  });

  describe("canConfirmAppointment", () => {
    it("should return true when appointment can be confirmed", async () => {
      // Arrange
      MockedAppointment.findOne = jest
        .fn()
        .mockResolvedValue(mockAppointments.paid);

      // Act
      const result = await appointmentService.canConfirmAppointment(
        mockIds.appointment1,
        mockIds.doctor1
      );

      // Assert
      expect(result.can).toBe(true);
    });

    it("should return false when appointment not found", async () => {
      // Arrange
      MockedAppointment.findOne = jest.fn().mockResolvedValue(null);

      // Act
      const result = await appointmentService.canConfirmAppointment(
        mockIds.appointment1,
        mockIds.doctor1
      );

      // Assert
      expect(result.can).toBe(false);
      expect(result.error).toContain("not found");
    });

    it("should return false when appointment is cancelled", async () => {
      // Arrange
      const cancelledAppointment = {
        ...mockAppointments.paid,
        status: "cancelled",
      };
      MockedAppointment.findOne = jest
        .fn()
        .mockResolvedValue(cancelledAppointment);

      // Act
      const result = await appointmentService.canConfirmAppointment(
        mockIds.appointment1,
        mockIds.doctor1
      );

      // Assert
      expect(result.can).toBe(false);
      expect(result.error).toContain("cancelled");
    });

    it("should return false when appointment is not paid", async () => {
      // Arrange
      MockedAppointment.findOne = jest
        .fn()
        .mockResolvedValue(mockAppointments.pending);

      // Act
      const result = await appointmentService.canConfirmAppointment(
        mockIds.appointment1,
        mockIds.doctor1
      );

      // Assert
      expect(result.can).toBe(false);
      expect(result.error).toContain("paid");
    });
  });
});
