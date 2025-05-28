import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import IJwtPayload from "../interfaces/IJwtPayload";

/**
 * Middleware to authenticate JWT tokens from request headers
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
export const authenticateToken = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Extract token from Authorization header (Bearer token)
  const token = req.header("Authorization")?.split(" ")[1];
  if (!token) {
    res.status(401).json({ message: "Access denied" });
    return;
  }

  // Verify JWT token and attach user info to request
  jwt.verify(token, process.env.JWT_SECRET as string, (err, user) => {
    if (err) {
      res.status(403).json({ message: "Invalid token" });
      return;
    }
    req.user = user as IJwtPayload;
    next();
  });
};
