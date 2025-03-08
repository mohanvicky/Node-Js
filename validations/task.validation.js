const Joi = require("joi");

// Define Task Schema Validation (userId removed from request body)
const taskSchema = Joi.object({
  title: Joi.string().min(3).max(100).required().messages({
    "string.empty": "Title is required.",
    "string.min": "Title should have at least 3 characters.",
    "string.max": "Title should not exceed 100 characters.",
  }),
  description: Joi.string().max(500).optional(),
  startDate: Joi.date().iso().optional(),
  dueDate: Joi.alternatives().conditional("startDate", {
    is: Joi.exist(),
    then: Joi.date().iso().min(Joi.ref("startDate")).required().messages({
      "date.base": "Invalid date format.",
      "date.min": "Due date cannot be before start date.",
      "any.required": "Due date is required.",
    }),
    otherwise: Joi.date().iso().required().messages({
      "date.base": "Invalid date format.",
      "any.required": "Due date is required.",
    }),
  }),
  priority: Joi.string()
    .valid("Low", "Medium", "High")
    .required()
    .messages({
      "any.only": "Priority must be one of Low, Medium, or High.",
    }),
  status: Joi.string()
    .valid("Not Started", "In Progress", "Completed", "Cancelled")
    .default("Not Started"),
  category: Joi.string().optional(),
  tags: Joi.array().items(Joi.string()).optional(),
  isRecurring: Joi.boolean().default(false),
  recurrencePattern: Joi.alternatives().conditional("isRecurring", {
    is: true,
    then: Joi.object({
      type: Joi.string()
        .valid("daily", "weekly", "monthly", "custom")
        .required(),
      interval: Joi.number().min(1).default(1),
      daysOfWeek: Joi.array()
        .items(Joi.number().min(0).max(6))
        .optional(),
      endDate: Joi.date().iso().optional(),
      occurrences: Joi.number().optional(),
    }).required(),
    otherwise: Joi.forbidden(),
  }),
  reminders: Joi.array()
    .items(
      Joi.object({
        time: Joi.date().iso().required(),
        sent: Joi.boolean().default(false),
        snoozeCount: Joi.number().default(0),
      })
    )
    .optional(),
  timeTracking: Joi.object({
    estimatedTime: Joi.number().optional(),
    actualTime: Joi.number().default(0),
    logs: Joi.array().items(
      Joi.object({
        startTime: Joi.date().iso().required(),
        endTime: Joi.date().iso().required(),
        duration: Joi.number().required(),
      })
    ),
  }).optional(),
  priorityMatrix: Joi.object({
    important: Joi.boolean().default(false),
    urgent: Joi.boolean().default(false),
  }).optional(),
}).unknown(false); // Prevent extra fields

// Middleware function for validation (userId taken from auth)
const validateTask = (req, res, next) => {
  const { error } = taskSchema.validate(req.body, { abortEarly: false });

  if (error) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: error.details.map((err) => err.message),
    });
  }

  next();
};

module.exports = validateTask;