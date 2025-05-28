export interface IUser {
  name: string;
  email: string;
  password: string;
  phone: string;
  isActive: boolean;
  role: 'doctor' | 'patient';
  specialization?: string;
  licenseNumber?: string;
  dateOfBirth?: Date;
  address?: string;
}

export interface IUserResponse extends Omit<IUser, 'password'> {}