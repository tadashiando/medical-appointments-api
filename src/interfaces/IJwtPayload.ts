export default interface IJwtPayload {
  userId: string;
  email: string;
  role: 'patient' | 'doctor';
  name: string;
  iat?: number;
  exp?: number;
}