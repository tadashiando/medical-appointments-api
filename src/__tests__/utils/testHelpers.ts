import { Types } from "mongoose";

export const mockUsers = {
  doctor: {
    _id: new Types.ObjectId("507f1f77bcf86cd799439011"),
    name: "Dr. Test",
    email: "doctor@test.com",
    role: "doctor",
    isActive: true,
    specialization: "General Medicine",
    licenseNumber: "MED001",
  },
  patient: {
    _id: new Types.ObjectId("507f1f77bcf86cd799439012"),
    name: "Patient Test",
    email: "patient@test.com",
    role: "patient",
    isActive: true,
    dateOfBirth: new Date("1990-01-01"),
    address: "Test Address 123",
  },
};

export const mockAppointments = {
  pending: {
    _id: new Types.ObjectId("507f1f77bcf86cd799439013"),
    patientId: mockUsers.patient._id,
    doctorId: mockUsers.doctor._id,
    date: new Date("2024-03-15"),
    time: "09:00",
    status: "pending",
    paymentStatus: "pending",
    reason: "Test consultation",
  },
  paid: {
    _id: new Types.ObjectId("507f1f77bcf86cd799439014"),
    patientId: mockUsers.patient._id,
    doctorId: mockUsers.doctor._id,
    date: new Date("2024-03-16"),
    time: "10:00",
    status: "pending",
    paymentStatus: "paid",
    reason: "Test consultation 2",
  },
};

export const mockCardData = {
  valid: {
    cardNumber: "1234567890123456",
    cardHolder: "Test User",
    expiryDate: "12/25",
    cvv: "123",
  },
  invalid: {
    cardNumber: "123",
    cardHolder: "",
    expiryDate: "00/00",
    cvv: "1",
  },
  expired: {
    cardNumber: "1234567890123456",
    cardHolder: "Test User",
    expiryDate: "01/20",
    cvv: "123",
  },
};

export const createMockDate = (dateString: string) => {
  return new Date(dateString);
};

export const getWorkingHours = () => ({
  morning: { start: 7, end: 12 },
  afternoon: { start: 14, end: 18 },
});
