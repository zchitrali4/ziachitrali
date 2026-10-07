import { validationResult } from 'express-validator';
import { ApiError } from '../utils/http.js';

export function validate(req, res, next) {
  const result = validationResult(req);
  if (result.isEmpty()) return next();
  return next(new ApiError(422, 'Validation failed.', result.array().map((item) => ({
    field: item.path,
    message: item.msg,
  }))));
}
