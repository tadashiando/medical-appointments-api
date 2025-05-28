import { z } from "zod";

export const loginSchema = z.object({
  body: z.object({
    email: z
      .string({ required_error: "Email is required" })
      .email("Invalid email format")
      .toLowerCase()
      .trim(),
    password: z
      .string({ required_error: "Password is required" })
      .min(6, "Password must be at least 6 characters")
      .max(50, "Password cannot exceed 50 characters"),
  }),
});

export const registerSchema = z.object({
  body: z
    .object({
      name: z
        .string({ required_error: "Name is required" })
        .min(2, "Name must be at least 2 characters")
        .max(50, "Name cannot exceed 50 characters")
        .trim(),
      email: z
        .string({ required_error: "Email is required" })
        .email("Invalid email format")
        .toLowerCase()
        .trim(),
      password: z
        .string({ required_error: "Password is required" })
        .min(6, "Password must be at least 6 characters")
        .max(50, "Password cannot exceed 50 characters"),
      phone: z
        .string({ required_error: "Phone is required" })
        .regex(/^\+?[\d\s\-\(\)]+$/, "Invalid phone number format")
        .trim(),
      role: z.enum(["patient", "doctor"], {
        required_error: "Role is required",
      }),
      specialization: z
        .string()
        .min(2, "Specialization must be at least 2 characters")
        .max(100, "Specialization cannot exceed 100 characters")
        .trim()
        .optional(),
      licenseNumber: z
        .string()
        .min(3, "License number must be at least 3 characters")
        .max(20, "License number cannot exceed 20 characters")
        .trim()
        .optional(),
      dateOfBirth: z
        .string()
        .regex(
          /^\d{4}-\d{2}-\d{2}$/,
          "Date of birth must be in YYYY-MM-DD format"
        )
        .optional()
        .refine((date) => {
          if (!date) return true;
          const birthDate = new Date(date);
          const today = new Date();
          const age = today.getFullYear() - birthDate.getFullYear();
          return age >= 0 && age <= 120;
        }, "Invalid date of birth"),
      address: z
        .string()
        .min(10, "Address must be at least 10 characters")
        .max(200, "Address cannot exceed 200 characters")
        .trim()
        .optional(),
    })
    .refine(
      (data) => {
        if (data.role === "doctor") {
          return data.specialization && data.licenseNumber;
        }
        return true;
      },
      {
        message: "Specialization and license number are required for doctors",
        path: ["specialization"],
      }
    )
    .refine(
      (data) => {
        if (data.role === "patient") {
          return data.dateOfBirth && data.address;
        }
        return true;
      },
      {
        message: "Date of birth and address are required for patients",
        path: ["dateOfBirth"],
      }
    ),
});

export const createAppointmentSchema = z.object({
  body: z.object({
    doctorId: z
      .string({ required_error: "Doctor ID is required" })
      .regex(/^[0-9a-fA-F]{24}$/, "Invalid doctor ID format"),
    date: z
      .string({ required_error: "Date is required" })
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format")
      .refine((date) => {
        const appointmentDate = new Date(date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return appointmentDate >= today;
      }, "Cannot schedule appointments in the past")
      .refine((date) => {
        const appointmentDate = new Date(date);
        const dayOfWeek = appointmentDate.getDay();
        return dayOfWeek !== 0 && dayOfWeek !== 6; // No weekends
      }, "Appointments cannot be scheduled on weekends"),
    time: z
      .string({ required_error: "Time is required" })
      .regex(
        /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
        "Time must be in HH:MM format"
      )
      .refine((time) => {
        const timeParts = time.split(":");
        if (timeParts.length !== 2) {
          throw new Error("Invalid time format. Use HH:MM");
        }

        const hours = parseInt(timeParts[0]!);
        const minutes = parseInt(timeParts[1]!);

        if (isNaN(hours) || isNaN(minutes)) {
          throw new Error("Invalid time format. Use HH:MM");
        }
        const totalMinutes = hours * 60 + minutes;
        const morningStart = 7 * 60;
        const morningEnd = 12 * 60;
        const afternoonStart = 14 * 60;
        const afternoonEnd = 18 * 60;
        return (
          (totalMinutes >= morningStart && totalMinutes < morningEnd) ||
          (totalMinutes >= afternoonStart && totalMinutes < afternoonEnd)
        );
      }, "Appointments must be between 7:00-12:00 or 14:00-18:00"),
    reason: z
      .string({ required_error: "Reason is required" })
      .min(10, "Reason must be at least 10 characters")
      .max(500, "Reason cannot exceed 500 characters")
      .trim(),
    notes: z
      .string()
      .max(1000, "Notes cannot exceed 1000 characters")
      .trim()
      .optional(),
  }),
});

export const confirmAppointmentSchema = z.object({
  params: z.object({
    appointmentId: z
      .string({ required_error: "Appointment ID is required" })
      .regex(/^[0-9a-fA-F]{24}$/, "Invalid appointment ID format"),
  }),
  body: z.object({
    notes: z
      .string()
      .max(1000, "Notes cannot exceed 1000 characters")
      .trim()
      .optional(),
  }),
});

export const appointmentParamsSchema = z.object({
  params: z.object({
    appointmentId: z
      .string({ required_error: "Appointment ID is required" })
      .regex(/^[0-9a-fA-F]{24}$/, "Invalid appointment ID format"),
  }),
});

export const processPaymentSchema = z.object({
  body: z.object({
    appointmentId: z
      .string({ required_error: "Appointment ID is required" })
      .regex(/^[0-9a-fA-F]{24}$/, "Invalid appointment ID format"),
    amount: z
      .number({ required_error: "Amount is required" })
      .positive("Amount must be greater than 0")
      .max(10000, "Amount cannot exceed $10,000")
      .refine((amount) => {
        // Verificar máximo 2 decimales
        return Number.isInteger(amount * 100);
      }, "Amount can have maximum 2 decimal places"),
    paymentMethod: z.enum(["credit_card", "debit_card", "paypal", "stripe"], {
      required_error: "Payment method is required",
    }),
    cardNumber: z
      .string({ required_error: "Card number is required" })
      .regex(/^\d{16}$/, "Card number must be 16 digits")
      .transform((val) => val.replace(/\s/g, "")), // Remove spaces
    cardHolder: z
      .string({ required_error: "Card holder name is required" })
      .min(2, "Card holder name must be at least 2 characters")
      .max(50, "Card holder name cannot exceed 50 characters")
      .trim(),
    expiryDate: z
      .string({ required_error: "Expiry date is required" })
      .regex(/^(0[1-9]|1[0-2])\/\d{2}$/, "Expiry date must be in MM/YY format")
      .refine((date) => {
        const [month, year] = date.split("/");
        const expiryDate = new Date(
          2000 + parseInt(year!),
          parseInt(month!) - 1
        );
        const currentDate = new Date();
        currentDate.setDate(1);
        return expiryDate >= currentDate;
      }, "Card has expired"),
    cvv: z
      .string({ required_error: "CVV is required" })
      .regex(/^\d{3,4}$/, "CVV must be 3 or 4 digits"),
  }),
});

export const dateRangeQuerySchema = z.object({
  query: z.object({
    startDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Start date must be in YYYY-MM-DD format")
      .optional(),
    endDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "End date must be in YYYY-MM-DD format")
      .optional(),
    limit: z
      .string()
      .regex(/^\d+$/, "Limit must be a number")
      .transform((val) => parseInt(val))
      .refine((val) => val > 0 && val <= 100, "Limit must be between 1 and 100")
      .optional(),
  }),
});

export const doctorQuerySchema = z.object({
  params: z.object({
    doctorId: z
      .string({ required_error: "Doctor ID is required" })
      .regex(/^[0-9a-fA-F]{24}$/, "Invalid doctor ID format"),
  }),
  query: z.object({
    date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format")
      .optional(),
  }),
});

export const availableSlotsSchema = z.object({
  params: z.object({
    doctorId: z
      .string({ required_error: "Doctor ID is required" })
      .regex(/^[0-9a-fA-F]{24}$/, "Invalid doctor ID format"),
  }),
  query: z.object({
    date: z
      .string({ required_error: "Date is required" })
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  }),
});

export const weeklyScheduleSchema = z.object({
  params: z.object({
    doctorId: z
      .string({ required_error: "Doctor ID is required" })
      .regex(/^[0-9a-fA-F]{24}$/, "Invalid doctor ID format"),
  }),
  query: z.object({
    startDate: z
      .string({ required_error: "Start date is required" })
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Start date must be in YYYY-MM-DD format"),
  }),
});

export type LoginRequest = z.infer<typeof loginSchema>["body"];
export type RegisterRequest = z.infer<typeof registerSchema>["body"];
export type CreateAppointmentRequest = z.infer<
  typeof createAppointmentSchema
>["body"];
export type ProcessPaymentRequest = z.infer<
  typeof processPaymentSchema
>["body"];
