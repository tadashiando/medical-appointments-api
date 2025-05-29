// src/__tests__/services/PaymentService.test.ts
import { PaymentService } from "../../services/PaymentService";
import { Appointment } from "../../models/Appointment";
import { mockCardData, mockAppointments, mockIds } from "../utils/testHelpers";

// Mock the models
jest.mock("../../models/Appointment");

const MockedAppointment = Appointment as jest.Mocked<typeof Appointment>;

describe("PaymentService", () => {
  let paymentService: PaymentService;

  beforeEach(() => {
    paymentService = new PaymentService();
    jest.clearAllMocks();
  });

  describe("canPayAppointment", () => {
    it("should return true when appointment can be paid", async () => {
      // Arrange
      MockedAppointment.findOne = jest
        .fn()
        .mockResolvedValue(mockAppointments.pending);

      // Act
      const result = await paymentService.canPayAppointment(
        mockIds.appointment1,
        mockIds.patient1
      );

      // Assert
      expect(result.can).toBe(true);
      expect(MockedAppointment.findOne).toHaveBeenCalledWith({
        _id: mockIds.appointment1,
        patientId: expect.any(Object),
      });
    });

    it("should return false when appointment not found", async () => {
      // Arrange
      MockedAppointment.findOne = jest.fn().mockResolvedValue(null);

      // Act
      const result = await paymentService.canPayAppointment(
        mockIds.appointment1,
        mockIds.patient1
      );

      // Assert
      expect(result.can).toBe(false);
      expect(result.error).toContain("not found");
    });

    it("should return false when appointment is cancelled", async () => {
      // Arrange
      const cancelledAppointment = {
        ...mockAppointments.pending,
        status: "cancelled",
      };
      MockedAppointment.findOne = jest
        .fn()
        .mockResolvedValue(cancelledAppointment);

      // Act
      const result = await paymentService.canPayAppointment(
        mockIds.appointment1,
        mockIds.patient1
      );

      // Assert
      expect(result.can).toBe(false);
      expect(result.error).toContain("cancelled");
    });

    it("should return false when appointment is already paid", async () => {
      // Arrange
      MockedAppointment.findOne = jest
        .fn()
        .mockResolvedValue(mockAppointments.paid);

      // Act
      const result = await paymentService.canPayAppointment(
        mockIds.appointment1,
        mockIds.patient1
      );

      // Assert
      expect(result.can).toBe(false);
      expect(result.error).toContain("already paid");
    });
  });

  describe("validateCardData", () => {
    it("should return valid for correct card data", () => {
      // Act
      const result = paymentService.validateCardData(mockCardData.valid);

      // Assert
      expect(result.valid).toBe(true);
    });

    it("should return invalid for incorrect card number", () => {
      // Act
      const result = paymentService.validateCardData({
        ...mockCardData.valid,
        cardNumber: "123", // Invalid length
      });

      // Assert
      expect(result.valid).toBe(false);
      expect(result.error).toContain("16 digits");
    });

    it("should return invalid for empty card holder", () => {
      // Act
      const result = paymentService.validateCardData({
        ...mockCardData.valid,
        cardHolder: "", // Empty name
      });

      // Assert
      expect(result.valid).toBe(false);
      expect(result.error).toContain("required");
    });

    it("should return invalid for incorrect expiry date format", () => {
      // Act
      const result = paymentService.validateCardData({
        ...mockCardData.valid,
        expiryDate: "13/25", // Invalid month
      });

      // Assert
      expect(result.valid).toBe(false);
      expect(result.error).toContain("MM/YY format");
    });

    it("should return invalid for expired card", () => {
      // Act
      const result = paymentService.validateCardData(mockCardData.expired);

      // Assert
      expect(result.valid).toBe(false);
      expect(result.error).toContain("expired");

      // Restore
      jest.restoreAllMocks();
    });

    it("should return invalid for incorrect CVV", () => {
      // Act
      const result = paymentService.validateCardData({
        ...mockCardData.valid,
        cvv: "12", // Too short
      });

      // Assert
      expect(result.valid).toBe(false);
      expect(result.error).toContain("3 or 4 digits");
    });
  });

  describe("simulatePayment", () => {
    afterEach(() => {
      jest.restoreAllMocks();
    });

    it("should return success for cards not ending in 0", () => {
      jest.spyOn(Math, "random").mockReturnValue(0.5); // Always success (> 0.1)
      // Act
      const result = paymentService.simulatePayment("1234567890123456");

      // Assert
      expect(result.success).toBe(true);
      expect(result.transactionId).toBeTruthy();
      expect(result.message).toContain("successfully");
    });

    it("should return failure for cards ending in 0", () => {
      // Act
      const result = paymentService.simulatePayment("1234567890123450");

      // Assert
      expect(result.success).toBe(false);
      expect(result.transactionId).toBe("");
      expect(result.message).toContain("failed");
    });

    it("should return failure when random is low (10% failure rate)", () => {
      // Arrange - Mock Math.random to return low value
      jest.spyOn(Math, "random").mockReturnValue(0.05); // < 0.1 = failure

      // Act
      const result = paymentService.simulatePayment("1234567890123456");

      // Assert
      expect(result.success).toBe(false);
      expect(result.transactionId).toBe("");
      expect(result.message).toContain("failed");
    });

    it("should generate unique transaction IDs", () => {
      jest.spyOn(Math, "random").mockReturnValue(0.4); // > 0.1 = success

      // ✅ Mock Date.now with different timestamps
      let callCount = 0;
      jest.spyOn(Date, "now").mockImplementation(() => {
        callCount++;
        return 1000000000000 + callCount * 1000;
      });

      // Act
      const result1 = paymentService.simulatePayment("1234567890123456");
      const result2 = paymentService.simulatePayment("1234567890123457");

      // Assert
      expect(result1.transactionId).not.toBe(result2.transactionId);
      expect(result1.transactionId).toMatch(/^TXN_\d+_[a-z0-9]+$/);
      expect(result2.transactionId).toMatch(/^TXN_\d+_[a-z0-9]+$/);
    });
  });
});
