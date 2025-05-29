import jwt from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";
import { authenticateToken } from "../../middleware/authentication";

jest.mock("jsonwebtoken");
const mockedJWT = jwt as jest.Mocked<typeof jwt>;

describe("Authentication Middleware", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {
      header: jest.fn(),
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  it("should authenticate valid token", () => {
    const mockUser = { userId: "test-id", role: "patient" };
    (mockRequest.header as jest.Mock).mockReturnValue("Bearer valid-token");
    mockedJWT.verify = jest
      .fn()
      .mockImplementation((token, secret, callback) => {
        callback(null, mockUser);
      });

    authenticateToken(
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    expect(mockRequest.user).toEqual(mockUser);
    expect(mockNext).toHaveBeenCalled();
  });

  it("should reject request without token", () => {
    (mockRequest.header as jest.Mock).mockReturnValue(undefined);

    authenticateToken(
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: "Access denied",
    });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it("should reject invalid token", () => {
    (mockRequest.header as jest.Mock).mockReturnValue("Bearer invalid-token");
    mockedJWT.verify = jest
      .fn()
      .mockImplementation((token, secret, callback) => {
        callback(new Error("Invalid token"), null);
      });

    authenticateToken(
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    expect(mockResponse.status).toHaveBeenCalledWith(403);
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: "Invalid token",
    });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it("should extract token from Bearer authorization header", () => {
    const mockUser = { userId: "test-id", role: "doctor" };
    (mockRequest.header as jest.Mock).mockReturnValue("Bearer test-jwt-token");
    mockedJWT.verify = jest
      .fn()
      .mockImplementation((token, secret, callback) => {
        expect(token).toBe("test-jwt-token");
        callback(null, mockUser);
      });

    authenticateToken(
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    expect(mockedJWT.verify).toHaveBeenCalledWith(
      "test-jwt-token",
      process.env.JWT_SECRET,
      expect.any(Function)
    );
  });
});
