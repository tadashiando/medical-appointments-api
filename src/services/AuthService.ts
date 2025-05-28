import { User } from "../models/User";
import { IUserResponse } from "../interfaces/IUser";

export class AuthService {
  /**
   * Gets user information by ID if active
   * @param userId - User's unique identifier
   * @returns User information or null if not found/inactive
   */
  async getUserById(userId: string): Promise<IUserResponse | null> {
    const user = await User.findById(userId);

    if (!user || !user.isActive) {
      return null;
    }

    return user.toJSON() as IUserResponse;
  }

  /**
   * Gets all active doctors for appointment booking
   * @returns Array of active doctors with basic information
   */
  async getActiveDoctors(): Promise<IUserResponse[]> {
    const doctors = await User.find({
      role: "doctor",
      isActive: true,
    }).select("name email specialization licenseNumber");

    return doctors.map((doctor) => doctor.toJSON() as IUserResponse);
  }
}
