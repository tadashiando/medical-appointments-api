import { Request, Response, NextFunction } from "express";

/**
 * Middleware to authorize users based on their roles
 * @param roles - Array of allowed roles for the endpoint
 * @returns Express middleware function for role-based authorization
 */
export const authorizeRole =
  (roles: string[]) =>
  (req: Request, res: Response, next: NextFunction): void => {
    // Check if user exists and has required role
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ message: "Access forbidden: insufficient role" });
      return;
    }
    next();
  };
