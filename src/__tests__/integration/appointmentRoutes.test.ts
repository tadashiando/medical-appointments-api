import request from "supertest";
import express from "express";
import jwt from "jsonwebtoken";
import routes from "../../routes";
import { User } from "../../models/User";
import { Appointment } from "../../models/Appointment";
import { mockIds } from "../utils/testHelpers";

jest.mock("../../models/User");
jest.mock("../../models/Appointment");
jest.mock("jsonwebtoken");

const MockedUser = jest.mocked(User);
const MockedAppointment = jest.mocked(Appointment);
const mockedJwt = jwt as jest.Mocked<typeof jwt>;

const app = express();
app.use(express.json());
app.use("/api/v1", routes);

describe("Appointment Routes Integration", () => {
  const validToken = "Bearer valid-jwt-token";
  const doctorId = mockIds.doctor1;
  const patientId = mockIds.patient1;

  beforeEach(() => {
    jest.clearAllMocks();

    mockedJwt.verify = jest
      .fn()
      .mockImplementation((token, secret, callback) => {
        if (typeof callback === "function") {
          callback(null, { userId: patientId, role: "patient" });
        }
      });
  });

  describe("POST /api/v1/appointments", () => {
    it("should create appointment successfully", async () => {
      const mockDoctor = {
        _id: doctorId,
        role: "doctor",
        isActive: true,
        name: "Dr. Test",
      };
      const mockPatient = {
        _id: patientId,
        role: "patient",
        isActive: true,
      };

      MockedUser.findOne = jest
        .fn()
        .mockResolvedValueOnce(mockDoctor)
        .mockResolvedValueOnce(mockPatient);

      MockedAppointment.findOne = jest.fn().mockResolvedValue(null); // Doctor available

      const mockSavedAppointment = {
        _id: mockIds.appointment1,
        patientId,
        doctorId,
        date: new Date("2025-10-16"),
        time: "09:00",
        reason: "Test consultation",
        status: "pending",
        paymentStatus: "pending",
        save: jest.fn().mockResolvedValue(true),
        populate: jest.fn().mockResolvedValue({
          doctorId: {
            name: "Dr. Test",
            email: "doctor@test.com",
            specialization: "General Medicine",
          },
        }),
      };

      MockedAppointment.mockImplementation(() => mockSavedAppointment as any);

      const response = await request(app)
        .post("/api/v1/appointments")
        .set("Authorization", validToken)
        .send({
          doctorId,
          date: "2025-10-16",
          time: "09:00",
          reason: "Test consultation",
          notes: "Patient needs checkup",
        });

      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        success: true,
        message: "Appointment created successfully",
        data: expect.objectContaining({
          doctorId: expect.objectContaining({
            name: "Dr. Test",
          }),
        }),
      });
    });

    it("should return 401 without authentication", async () => {
      const response = await request(app).post("/api/v1/appointments").send({
        doctorId,
        date: "2025-10-16",
        time: "09:00",
        reason: "Test consultation",
      });

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        message: "Access denied",
      });
    });

    it("should return 400 for weekend appointment", async () => {
      const response = await request(app)
        .post("/api/v1/appointments")
        .set("Authorization", validToken)
        .send({
          doctorId,
          date: "2025-10-18", // Saturday
          time: "09:00",
          reason: "Test consultation",
        });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        success: false,
        message: "Validation failed",
        errors: expect.arrayContaining([expect.stringContaining("weekday")]),
      });
    });

    it("should return 400 for past date", async () => {
      const response = await request(app)
        .post("/api/v1/appointments")
        .set("Authorization", validToken)
        .send({
          doctorId,
          date: "2024-10-14", // Past date
          time: "09:00",
          reason: "Test consultation",
        });

      // Assert
      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        success: false,
        message: "Validation failed",
        errors: expect.arrayContaining([
          expect.stringContaining("future weekday"),
        ]),
      });
    });

    it("should return 400 for invalid working hours", async () => {
      const response = await request(app)
        .post("/api/v1/appointments")
        .set("Authorization", validToken)
        .send({
          doctorId,
          date: "2025-10-16",
          time: "13:00", // Lunch time
          reason: "Test consultation",
        });

      // Assert
      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        success: false,
        message: "Validation failed",
        errors: expect.arrayContaining([
          expect.stringContaining("7:00-12:00 or 14:00-18:00"),
        ]),
      });
    });
  });

  describe("PUT /api/v1/appointments/:appointmentId/confirm", () => {
    beforeEach(() => {
      mockedJwt.verify = jest
        .fn()
        .mockImplementation((token, secret, callback) => {
          if (typeof callback === "function") {
            callback(null, { userId: doctorId, role: "doctor" });
          }
        });
    });

    it("should confirm paid appointment successfully", async () => {
      const appointmentId = mockIds.appointment1;
      const mockAppointment = {
        _id: appointmentId,
        doctorId,
        paymentStatus: "paid",
        status: "pending",
      };

      MockedAppointment.findOne = jest.fn().mockResolvedValue(mockAppointment);
      MockedAppointment.findByIdAndUpdate = jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue({
          ...mockAppointment,
          status: "confirmed",
          patientId: { name: "Patient Test", email: "patient@test.com" },
        }),
      });

      const response = await request(app)
        .put(`/api/v1/appointments/${appointmentId}/confirm`)
        .set("Authorization", validToken)
        .send({
          notes: "Appointment confirmed by doctor",
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        message: "Appointment confirmed successfully",
        data: expect.objectContaining({
          status: "confirmed",
        }),
      });
    });

    it("should return 400 for unpaid appointment", async () => {
      const appointmentId = mockIds.appointment1;
      const mockAppointment = {
        _id: appointmentId,
        doctorId,
        paymentStatus: "pending",
        status: "pending",
      };

      MockedAppointment.findOne = jest.fn().mockResolvedValue(mockAppointment);

      const response = await request(app)
        .put(`/api/v1/appointments/${appointmentId}/confirm`)
        .set("Authorization", validToken)
        .send({
          notes: "Appointment confirmed by doctor",
        });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        success: false,
        message: "Appointment must be paid before confirmation",
      });
    });
  });

  describe("GET /api/v1/appointments/today", () => {
    beforeEach(() => {
      mockedJwt.verify = jest
        .fn()
        .mockImplementation((token, secret, callback) => {
          if (typeof callback === "function") {
            callback(null, { userId: doctorId, role: "doctor" });
          }
        });
    });

    it("should return today appointments for doctor", async () => {
      const mockAppointments = [
        {
          _id: mockIds.appointment1,
          time: "09:00",
          patientId: { name: "Patient 1", email: "patient1@test.com" },
        },
        {
          _id: mockIds.appointment2,
          time: "10:00",
          patientId: { name: "Patient 2", email: "patient2@test.com" },
        },
      ];

      MockedAppointment.find = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockResolvedValue(mockAppointments),
        }),
      });

      const response = await request(app)
        .get("/api/v1/appointments/today")
        .set("Authorization", validToken);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        message: "Today appointments retrieved successfully",
        data: mockAppointments,
      });
    });
  });
});
