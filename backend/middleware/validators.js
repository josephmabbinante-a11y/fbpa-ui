import { body, validationResult } from "express-validator";

export const invoiceValidators = [
  body("invoiceNumber").trim().notEmpty().withMessage("invoiceNumber is required"),
  body("amount").exists().withMessage("amount is required").isNumeric().withMessage("amount must be a number").custom(v => v > 0).withMessage("amount must be greater than 0"),
  body("status").optional().isIn(["pending", "paid", "overdue", "cancelled"]).withMessage("invalid status"),
  body("date").optional().isISO8601().withMessage("date must be ISO8601")
];

export const auditValidators = [
  body("userId").trim().notEmpty().withMessage("userId is required"),
  body("action").trim().notEmpty().withMessage("action is required"),
  body("resource").trim().notEmpty().withMessage("resource is required")
];

export const exceptionValidators = [
  body("code").trim().notEmpty().withMessage("code is required"),
  body("message").trim().notEmpty().withMessage("message is required"),
  body("severity").optional().isIn(["low","medium","high","critical"]).withMessage("invalid severity")
];

export const loginValidators = [
  body("email").trim().notEmpty().withMessage("email is required").isEmail().withMessage("email must be valid"),
  body("password").notEmpty().withMessage("password is required")
];

export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};
