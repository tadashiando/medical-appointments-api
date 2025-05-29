import { authorizeRole } from "../../middleware/authorization";
import type { Request, Response, NextFunction } from "express";

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
    // Arrange
    mockRequest.user = {
      userId: "test-id",
      role: "doctor",
      email: "test@test.com",
      name: "Test",
    };
    const middleware = authorizeRole(["doctor"]);

    // Act
    middleware(mockRequest as Request, mockResponse as Response, mockNext);

    // Assert
    expect(mockNext).toHaveBeenCalled();
    expect(mockResponse.status).not.toHaveBeenCalled();
  });

  it("should reject user with incorrect role", () => {
    // Arrange
    mockRequest.user = {
      userId: "test-id",
      role: "patient",
      email: "test@test.com",
      name: "Test",
    };
    const middleware = authorizeRole(["doctor"]);

    // Act
    middleware(mockRequest as Request, mockResponse as Response, mockNext);

    // Assert
    expect(mockResponse.status).toHaveBeenCalledWith(403);
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: "Access forbidden: insufficient role",
    });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it("should reject request without user", () => {
    // Arrange
    mockRequest.user = undefined;
    const middleware = authorizeRole(["doctor"]);

    // Act
    middleware(mockRequest as Request, mockResponse as Response, mockNext);

    // Assert
    expect(mockResponse.status).toHaveBeenCalledWith(403);
    expect(mockNext).not.toHaveBeenCalled();
  });

  it("should allow multiple roles", () => {
    // Arrange
    mockRequest.user = {
      userId: "test-id",
      role: "patient",
      email: "test@test.com",
      name: "Test",
    };
    const middleware = authorizeRole(["doctor", "patient"]);

    // Act
    middleware(mockRequest as Request, mockResponse as Response, mockNext);

    // Assert
    expect(mockNext).toHaveBeenCalled();
  });
});
