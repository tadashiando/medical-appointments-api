// Mock MongoDB connection
jest.mock("mongoose", () => ({
  connect: jest.fn(),
  model: jest.fn(),
  Schema: jest.fn(),
  Types: {
    ObjectId: jest.fn().mockImplementation((id) => ({
      toString: () => id || "mock-object-id",
      valueOf: () => id || "mock-object-id",
      _id: id || "mock-object-id",
    })),
  },
}));

// Mock bcryptjs
jest.mock("bcryptjs", () => ({
  hash: jest.fn().mockImplementation(() => Promise.resolve("hashed-password")),
  compare: jest.fn().mockImplementation(() => Promise.resolve(true)),
  genSalt: jest.fn().mockImplementation(() => Promise.resolve("salt")),
}));

// Mock JWT
jest.mock("jsonwebtoken", () => ({
  sign: jest.fn().mockReturnValue("mock-jwt-token"),
  verify: jest
    .fn()
    .mockReturnValue({ userId: "mock-user-id", role: "patient" }),
}));

global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

process.env.JWT_SECRET = "test-jwt-secret";
process.env.NODE_ENV = "test";
