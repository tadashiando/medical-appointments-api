export const mockIds = {
  doctor1: "507f1f77bcf86cd799439011",
  doctor2: "507f1f77bcf86cd799439012",
  patient1: "507f1f77bcf86cd799439013",
  patient2: "507f1f77bcf86cd799439014",
  appointment1: "507f1f77bcf86cd799439015",
  appointment2: "507f1f77bcf86cd799439016",
  payment1: "507f1f77bcf86cd799439017",
};

export const mockUsers = {
  doctor: {
    _id: mockIds.doctor1,
    name: "Dr. Test",
    email: "doctor@test.com",
    role: "doctor",
    isActive: true,
    specialization: "General Medicine",
    licenseNumber: "MED001",
  },
  patient: {
    _id: mockIds.patient1,
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
    _id: mockIds.appointment1,
    patientId: mockIds.patient1,
    doctorId: mockIds.doctor1,
    date: new Date("2025-10-15"),
    time: "09:00",
    status: "pending",
    paymentStatus: "pending",
    reason: "Test consultation",
  },
  paid: {
    _id: mockIds.appointment2,
    patientId: mockIds.patient1,
    doctorId: mockIds.doctor1,
    date: new Date("2025-10-16"),
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
    expiryDate: "12/28",
    cvv: "123",
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
