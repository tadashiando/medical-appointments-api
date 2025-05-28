import { IWorkingHours } from "../interfaces/ISchedule";

export const DEFAULT_WORKING_HOURS: IWorkingHours = {
  morning: { start: "07:00", end: "12:00" },
  afternoon: { start: "14:00", end: "18:00" },
};

export const DEFAULT_APPOINTMENT_DURATION = 30;
export const DEFAULT_BREAK_TIME = 5;
