import request from "supertest";
import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import routes from "../../routes";
import { User } from "../../models/User";

jest.mock("../../models/User");
jest.mock("bcryptjs");
jest.mock("jsonwebtoken");

const MockedUser = jest.mocked(User);
const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;
const mockedJwt = jwt as jest.Mocked<typeof jwt>;

const app = express();
app.use(express.json());
app.use("/api/v1", routes);

describe("Auth Routes Integration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("POST /api/v1/auth/login", () => {
    it("should login successfully with valid credentials", async () => {
      const mockUser = {
        _id: "507f1f77bcf86cd799439011",
        name: "Dr. Test",
        email: "doctor@test.com",
        password: "hashed-password",
        role: "doctor",
      };

      MockedUser.findOne = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser),
      });
      mockedBcrypt.compare = jest.fn().mockResolvedValue(true);
      mockedJwt.sign = jest.fn().mockReturnValue("mock-jwt-token");

      const response = await request(app).post("/api/v1/auth/login").send({
        email: "doctor@test.com",
        password: "123456",
      });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        user: mockUser,
        token: "mock-jwt-token",
      });
    });

    it("should return 401 for invalid email", async () => {
      MockedUser.findOne = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue(null),
      });

      const response = await request(app).post("/api/v1/auth/login").send({
        email: "nonexistent@test.com",
        password: "123456",
      });

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        message: "Invalid credentials",
      });
    });

    it("should return 401 for invalid password", async () => {
      const mockUser = {
        _id: "507f1f77bcf86cd799439011",
        email: "doctor@test.com",
        password: "hashed-password",
      };

      MockedUser.findOne = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser),
      });
      mockedBcrypt.compare = jest.fn().mockResolvedValue(false);

      const response = await request(app).post("/api/v1/auth/login").send({
        email: "doctor@test.com",
        password: "wrong-password",
      });

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        message: "Invalid credentials",
      });
    });

    it("should return 500 on database error", async () => {
      MockedUser.findOne = jest.fn().mockReturnValue({
        select: jest.fn().mockRejectedValue(new Error("Database error")),
      });

      const response = await request(app).post("/api/v1/auth/login").send({
        email: "doctor@test.com",
        password: "123456",
      });

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        message: "Error logging in",
        error: expect.any(Object),
      });
    });
  });
});
