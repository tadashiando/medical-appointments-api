import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { validate } from "../../middleware/validation";

describe("Validation Middleware", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {
      body: {},
      params: {},
      query: {},
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
  });

  it("should pass validation with valid data", () => {
    const schema = z.object({
      body: z.object({
        name: z.string(),
        age: z.number(),
      }),
    });

    mockRequest.body = { name: "Test", age: 25 };
    const middleware = validate(schema);

    middleware(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect(mockResponse.status).not.toHaveBeenCalled();
  });

  it("should return 400 with validation errors for invalid data", () => {
    const schema = z.object({
      body: z.object({
        name: z.string(),
        age: z.number(),
      }),
    });

    mockRequest.body = { name: 123, age: "invalid" }; // Invalid types
    const middleware = validate(schema);

    middleware(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      message: "Validation failed",
      errors: expect.arrayContaining([
        expect.stringContaining("name"),
        expect.stringContaining("age"),
      ]),
    });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it("should handle validation with params and query", () => {
    const schema = z.object({
      params: z.object({
        id: z.string(),
      }),
      query: z.object({
        limit: z.string(),
      }),
    });

    mockRequest.params = { id: "test-id" };
    mockRequest.query = { limit: "10" };
    const middleware = validate(schema);

    middleware(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockNext).toHaveBeenCalled();
  });
});
