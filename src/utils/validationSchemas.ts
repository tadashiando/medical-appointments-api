// src/utils/validationSchemas.ts - SOLUÇÃO RECOMENDADA
import { z } from "zod";
import { parse, isValid, isWeekend, isBefore, startOfDay } from "date-fns";
import { WORKING_HOURS_CONFIG } from "./constants";

const isWorkingHour = (time: string): boolean => {
  const date = parse(time, "HH:mm", new Date());
  if (!isValid(date)) return false;

  const h = date.getHours();
  return (
    (h >= WORKING_HOURS_CONFIG.MORNING_START &&
      h < WORKING_HOURS_CONFIG.MORNING_END) ||
    (h >= WORKING_HOURS_CONFIG.AFTERNOON_START &&
      h < WORKING_HOURS_CONFIG.AFTERNOON_END)
  );
};

const isFutureWorkday = (dateStr: string): boolean => {
  const date = parse(dateStr, "yyyy-MM-dd", new Date());
  return (
    isValid(date) && !isBefore(date, startOfDay(new Date())) && !isWeekend(date)
  );
};

export const createAppointmentSchema = z.object({
  body: z.object({
    doctorId: z.string().length(24, "Invalid doctor ID"),
    date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD")
      .refine(isFutureWorkday, "Date must be future weekday"),
    time: z
      .string()
      .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Time must be HH:MM")
      .refine(isWorkingHour, "Time must be 7:00-12:00 or 14:00-18:00"),
    reason: z.string().min(10).max(500).trim(),
    notes: z.string().max(1000).trim().optional(),
  }),
});

export const processPaymentSchema = z.object({
  body: z.object({
    appointmentId: z.string().length(24),
    amount: z.number().positive().max(10000),
    paymentMethod: z.enum(["credit_card", "debit_card", "paypal", "stripe"]),
    cardNumber: z
      .string()
      .transform((s) => s.replace(/\D/g, ""))
      .pipe(z.string().length(16, "Card must have 16 digits")),
    cardHolder: z.string().min(2).max(50).trim(),
    expiryDate: z
      .string()
      .regex(/^(0[1-9]|1[0-2])\/\d{2}$/)
      .refine((exp) => {
        const [month, year] = exp.split("/").map(Number);
        return new Date(2000 + year!, month! - 1) >= new Date();
      }, "Card expired"),
    cvv: z.string().regex(/^\d{3,4}$/),
  }),
});

export const confirmAppointmentSchema = z.object({
  params: z.object({ appointmentId: z.string().length(24) }),
  body: z.object({ notes: z.string().max(1000).trim().optional() }),
});

export const appointmentParamsSchema = z.object({
  params: z.object({ appointmentId: z.string().length(24) }),
});

export const availableSlotsSchema = z.object({
  params: z.object({ doctorId: z.string().length(24) }),
  query: z.object({
    date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .refine(
        (d) => isValid(parse(d, "yyyy-MM-dd", new Date())),
        "Invalid date"
      ),
  }),
});

export type CreateAppointmentRequest = z.infer<
  typeof createAppointmentSchema
>["body"];
export type ProcessPaymentRequest = z.infer<
  typeof processPaymentSchema
>["body"];
