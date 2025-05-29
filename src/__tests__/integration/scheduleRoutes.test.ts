import request from "supertest";
import express from "express";
import routes from "../../routes";
import { User } from "../../models/User";
import { mockIds } from "../utils/testHelpers";

jest.mock("../../models/User");
jest.mock("../../models/Appointment");

const MockedUser = jest.mocked(User);

const app = express();
app.use(express.json());
app.use("/api/v1", routes);

describe("Schedule Routes Integration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /api/v1/schedule/available/:doctorId", () => {
    const validDoctorId = mockIds.doctor1;
    const validDate = "2025-10-15";

    it("should return available slots for valid doctor and date", async () => {
      MockedUser.findOne = jest.fn().mockResolvedValue({
        _id: validDoctorId,
        name: "Dr. Test",
        role: "doctor",
        isActive: true,
        specialization: "General Medicine",
      });

      const mockAppointment = require("../../models/Appointment").Appointment;
      mockAppointment.find = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue([]),
      });

      const response = await request(app)
        .get(`/api/v1/schedule/available/${validDoctorId}`)
        .query({ date: validDate });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        message: "Available slots retrieved successfully",
        data: {
          doctorId: validDoctorId,
          doctorName: "Dr. Test",
          date: validDate,
          availableSlots: expect.arrayContaining([
            "07:00",
            "07:30",
            "08:00",
            "08:30",
            "09:00",
            "09:30",
            "10:00",
            "10:30",
            "11:00",
            "11:30",
            "14:00",
            "14:30",
            "15:00",
            "15:30",
            "16:00",
            "16:30",
            "17:00",
            "17:30",
          ]),
          totalSlots: 18,
        },
      });
    });

    it("should return 404 when doctor not found", async () => {
      MockedUser.findOne = jest.fn().mockResolvedValue(null);

      const response = await request(app)
        .get(`/api/v1/schedule/available/${validDoctorId}`)
        .query({ date: validDate });

      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        success: false,
        message: "Doctor not found or inactive",
      });
    });

    it("should return 400 when doctor ID is invalid", async () => {
      const response = await request(app)
        .get("/api/v1/schedule/available/invalid-id")
        .query({ date: validDate });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        success: false,
        message: "Validation failed",
        errors: expect.arrayContaining([expect.stringContaining("doctorId")]),
      });
    });

    it("should return 400 when date is missing", async () => {
      const response = await request(app).get(
        `/api/v1/schedule/available/${validDoctorId}`
      );

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        success: false,
        message: "Validation failed",
        errors: expect.arrayContaining([expect.stringContaining("date")]),
      });
    });

    it("should return 400 when date format is invalid", async () => {
      const response = await request(app)
        .get(`/api/v1/schedule/available/${validDoctorId}`)
        .query({ date: "invalid-date" });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        success: false,
        message: "Validation failed",
        errors: expect.arrayContaining([expect.stringContaining("date")]),
      });
    });

    it("should return empty slots for weekends", async () => {
      MockedUser.findOne = jest.fn().mockResolvedValue({
        _id: validDoctorId,
        name: "Dr. Test",
        role: "doctor",
        isActive: true,
      });

      const response = await request(app)
        .get(`/api/v1/schedule/available/${validDoctorId}`)
        .query({ date: "2025-10-18" }); // Saturday

      expect(response.status).toBe(200);
      expect(response.body.data.availableSlots).toEqual([]);
      expect(response.body.data.totalSlots).toBe(0);
    });

    it("should exclude booked appointment times", async () => {
      MockedUser.findOne = jest.fn().mockResolvedValue({
        _id: validDoctorId,
        name: "Dr. Test",
        role: "doctor",
        isActive: true,
      });

      const mockAppointment = require("../../models/Appointment").Appointment;
      mockAppointment.find = jest.fn().mockReturnValue({
        select: jest
          .fn()
          .mockResolvedValue([{ time: "09:00" }, { time: "15:30" }]),
      });

      const response = await request(app)
        .get(`/api/v1/schedule/available/${validDoctorId}`)
        .query({ date: validDate });

      expect(response.status).toBe(200);
      expect(response.body.data.availableSlots).not.toContain("09:00");
      expect(response.body.data.availableSlots).not.toContain("15:30");
      expect(response.body.data.availableSlots).toContain("09:30"); // Adjacent should be available
      expect(response.body.data.totalSlots).toBe(16); // 18 - 2 booked
    });

    it("should return 500 on database error", async () => {
      MockedUser.findOne = jest
        .fn()
        .mockRejectedValue(new Error("Database error"));

      const response = await request(app)
        .get(`/api/v1/schedule/available/${validDoctorId}`)
        .query({ date: validDate });

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        success: false,
        message: "Error retrieving available slots",
        error: "Database error",
      });
    });
  });
});
