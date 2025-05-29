import type { Request, Response, NextFunction } from "express";
import { authorizeRole } from "../../middleware/authorization";

describe("Authorization Middleware", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {};
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
  });

  it("should authorize user with correct role", () => {
    mockRequest.user = {
      userId: "test-id",
      role: "doctor",
      email: "test@test.com",
      name: "Test",
    };
    const middleware = authorizeRole(["doctor"]);

    middleware(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect(mockResponse.status).not.toHaveBeenCalled();
  });

  it("should reject user with incorrect role", () => {
    mockRequest.user = {
      userId: "test-id",
      role: "patient",
      email: "test@test.com",
      name: "Test",
    };
    const middleware = authorizeRole(["doctor"]);

    middleware(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockResponse.status).toHaveBeenCalledWith(403);
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: "Access forbidden: insufficient role",
    });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it("should reject request without user", () => {
    mockRequest.user = undefined;
    const middleware = authorizeRole(["doctor"]);

    middleware(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockResponse.status).toHaveBeenCalledWith(403);
    expect(mockNext).not.toHaveBeenCalled();
  });

  it("should allow multiple roles", () => {
    mockRequest.user = {
      userId: "test-id",
      role: "patient",
      email: "test@test.com",
      name: "Test",
    };
    const middleware = authorizeRole(["doctor", "patient"]);

    middleware(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockNext).toHaveBeenCalled();
  });
});
