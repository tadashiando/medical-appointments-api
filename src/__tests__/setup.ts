// Mock environment variables
process.env.JWT_SECRET = "test-jwt-secret";
process.env.NODE_ENV = "test";
process.env.MONGO_URI = "mongodb://localhost:27017/test";
process.env.DB_NAME = "test_db";

// Mock console methods
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Mock bcryptjs
jest.mock("bcryptjs", () => ({
  hash: jest.fn().mockResolvedValue("hashed-password"),
  compare: jest.fn().mockResolvedValue(true),
  genSalt: jest.fn().mockResolvedValue("salt"),
}));

// Mock JWT
jest.mock("jsonwebtoken", () => ({
  sign: jest.fn().mockReturnValue("mock-jwt-token"),
  verify: jest.fn().mockImplementation((token, secret, callback) => {
    if (typeof callback === "function") {
      callback(null, { userId: "mock-user-id", role: "patient" });
    }
    return { userId: "mock-user-id", role: "patient" };
  }),
}));
