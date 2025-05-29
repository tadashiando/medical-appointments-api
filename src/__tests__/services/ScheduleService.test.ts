import { ScheduleService } from "../../services/ScheduleService";
import { Appointment } from "../../models/Appointment";
import { mockIds } from "../utils/testHelpers";
import { parse } from "date-fns";
import { Types } from "mongoose";

// Mock the models
jest.mock("../../models/Appointment");

const MockedAppointment = Appointment as jest.Mocked<typeof Appointment>;

describe("ScheduleService", () => {
  let scheduleService: ScheduleService;

  beforeEach(() => {
    scheduleService = new ScheduleService();
    jest.clearAllMocks();
  });

  describe("generateTimeSlots", () => {
    it("should generate correct morning slots", () => {
      // Act
      const slots = scheduleService.generateTimeSlots();

      // Assert - Check morning slots (7:00-11:30)
      const morningSlots = slots.filter((slot) => {
        const hour = parseInt(slot.split(":")[0]!);
        return hour >= 7 && hour < 12;
      });

      expect(morningSlots).toContain("07:00");
      expect(morningSlots).toContain("07:30");
      expect(morningSlots).toContain("11:00");
      expect(morningSlots).toContain("11:30");
      expect(morningSlots).not.toContain("12:00"); // Should not include 12:00
    });

    it("should generate correct afternoon slots", () => {
      // Act
      const slots = scheduleService.generateTimeSlots();

      // Assert - Check afternoon slots (14:00-17:30)
      const afternoonSlots = slots.filter((slot) => {
        const hour = parseInt(slot.split(":")[0]!);
        return hour >= 14 && hour < 18;
      });

      expect(afternoonSlots).toContain("14:00");
      expect(afternoonSlots).toContain("14:30");
      expect(afternoonSlots).toContain("17:00");
      expect(afternoonSlots).toContain("17:30");
      expect(afternoonSlots).not.toContain("18:00"); // Should not include 18:00
    });

    it("should not generate lunch break slots", () => {
      // Act
      const slots = scheduleService.generateTimeSlots();

      // Assert - No slots between 12:00-14:00
      const lunchSlots = slots.filter((slot) => {
        const hour = parseInt(slot.split(":")[0]!);
        return hour >= 12 && hour < 14;
      });

      expect(lunchSlots).toHaveLength(0);
    });

    it("should generate slots in 30-minute intervals", () => {
      // Act
      const slots = scheduleService.generateTimeSlots();

      // Assert
      const hasCorrectIntervals = slots.every((slot) => {
        const minutes = parseInt(slot.split(":")[1]!);
        return minutes === 0 || minutes === 30;
      });

      expect(hasCorrectIntervals).toBe(true);
    });

    it("should generate expected total number of slots", () => {
      // Act
      const slots = scheduleService.generateTimeSlots();

      // Assert
      // Morning: 5 hours * 2 slots = 10 slots (7:00-11:30)
      // Afternoon: 4 hours * 2 slots = 8 slots (14:00-17:30)
      // Total: 18 slots
      expect(slots).toHaveLength(18);
    });
  });

  describe("getAvailableSlots", () => {
    it("should return empty array for weekends", async () => {
      // Act - Saturday
      const saturdaySlots = await scheduleService.getAvailableSlots(
        mockIds.doctor1,
        "2025-10-18"
      );
      // Act - Sunday
      const sundaySlots = await scheduleService.getAvailableSlots(
        mockIds.doctor1,
        "2025-10-19"
      );

      // Assert
      expect(saturdaySlots).toEqual([]);
      expect(sundaySlots).toEqual([]);
    });

    it("should return empty array for past dates", async () => {
      // Act
      const slots = await scheduleService.getAvailableSlots(
        mockIds.doctor1,
        "2024-03-19"
      );

      // Assert
      expect(slots).toEqual([]);

      // Restore
      jest.restoreAllMocks();
    });

    it("should return all slots when no appointments exist", async () => {
      // Arrange
      MockedAppointment.find = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue([]),
      });

      // Act
      const slots = await scheduleService.getAvailableSlots(
        mockIds.doctor1,
        "2025-10-15"
      );

      // Assert
      expect(slots).toHaveLength(18); // All time slots available
      expect(slots).toContain("07:00");
      expect(slots).toContain("17:30");
    });

    it("should exclude booked appointment times", async () => {
      // Arrange
      const bookedAppointments = [{ time: "09:00" }, { time: "15:30" }];

      MockedAppointment.find = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue(bookedAppointments),
      });

      // Act
      const slots = await scheduleService.getAvailableSlots(
        mockIds.doctor1,
        "2025-10-15"
      );

      // Assert
      expect(slots).not.toContain("09:00");
      expect(slots).not.toContain("15:30");
      expect(slots).toContain("09:30"); // Adjacent slot should be available
      expect(slots).toContain("15:00"); // Adjacent slot should be available
      expect(slots).toHaveLength(16); // 18 total - 2 booked = 16
    });

    it("should query appointments with correct parameters", async () => {
      // Arrange
      MockedAppointment.find = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue([]),
      });

      // Act
      await scheduleService.getAvailableSlots(mockIds.doctor2, "2025-10-15");

      // Assert
      expect(MockedAppointment.find).toHaveBeenCalledWith({
        doctorId: expect.any(Types.ObjectId),
        date: parse("2025-10-15", 'yyyy-MM-dd', new Date()),
        status: { $in: ["pending", "confirmed"] },
      });
    });

    it("should handle multiple booked appointments correctly", async () => {
      // Arrange
      const manyBookedAppointments = [
        { time: "07:00" },
        { time: "07:30" },
        { time: "08:00" },
        { time: "14:00" },
        { time: "16:30" },
      ];

      MockedAppointment.find = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue(manyBookedAppointments),
      });

      // Act
      const slots = await scheduleService.getAvailableSlots(
        mockIds.doctor1,
        "2025-10-15"
      );

      // Assert
      expect(slots).toHaveLength(13); // 18 - 5 = 13
      manyBookedAppointments.forEach((apt) => {
        expect(slots).not.toContain(apt.time);
      });
    });
  });
});
