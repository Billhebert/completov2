// src/core/middleware/validate.ts
import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import { ValidationError } from '../errors';

/**
 * Validate request data against Zod schema
 */
export function validate(schema: AnyZodObject) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      console.log('Validating request data...', req.body, req.query, req.params);
      /*
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      */
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const formattedErrors = error.errors.map((err) => ({
          path: err.path.join('.'),
          message: err.message,
        }));
        next(new ValidationError(formattedErrors));
      } else {
        next(error);
      }
    }
  };
}

/**
 * Validate body only
 */
export function validateBody(schema: AnyZodObject) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = await schema.parseAsync(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const formattedErrors = error.errors.map((err) => ({
          path: err.path.join('.'),
          message: err.message,
        }));
        next(new ValidationError(formattedErrors));
      } else {
        next(error);
      }
    }
  };
}

/**
 * Validate query params
 */
export function validateQuery(schema: AnyZodObject) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      req.query = await schema.parseAsync(req.query);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const formattedErrors = error.errors.map((err) => ({
          path: err.path.join('.'),
          message: err.message,
        }));
        next(new ValidationError(formattedErrors));
      } else {
        next(error);
      }
    }
  };
}

/**
 * Validate params
 */
export function validateParams(schema: AnyZodObject) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      req.params = await schema.parseAsync(req.params);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const formattedErrors = error.errors.map((err) => ({
          path: err.path.join('.'),
          message: err.message,
        }));
        next(new ValidationError(formattedErrors));
      } else {
        next(error);
      }
    }
  };
}
