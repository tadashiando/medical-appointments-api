// Interfaces para manejar horarios y validaciones
export interface ITimeSlot {
  start: string;
  end: string;
}

export interface IWorkingHours {
  morning: ITimeSlot;
  afternoon: ITimeSlot;
}
