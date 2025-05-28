import { Request, Response, NextFunction } from "express";
import { z, ZodError } from "zod";
import { IApiResponse } from "../interfaces/IResponse";

/**
 * Generic middleware for validating requests with Zod schemas
 * @param schema - Zod schema to validate against
 * @returns Express middleware function for request validation
 */
export const validate = (schema: z.ZodSchema<any>) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      // Validate complete request structure
      const validated = schema.parse({
        body: req.body,
        params: req.params,
        query: req.query,
      });

      // Update request with validated data (except query which is read-only)
      req.body = validated.body || req.body;
      req.params = validated.params || req.params;

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        // Format Zod validation errors for client response
        const errors = error.errors.map((err) => {
          const path = err.path.join(".");
          return `${path}: ${err.message}`;
        });

        const response: IApiResponse = {
          success: false,
          message: "Validation failed",
          errors: errors,
        };

        res.status(400).json(response);
        return;
      }

      // Handle unexpected validation errors
      const response: IApiResponse = {
        success: false,
        message: `Validation error: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        errors: ["An unexpected validation error occurred"],
      };

      res.status(500).json(response);
    }
  };
};
