import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  PORT: Joi.number().default(3000),
  SERPAPI_KEY: Joi.string().required(),
  SERPAPI_BASE_URL: Joi.string().uri().required(),
  SERPAPI_TIMEOUT_MS: Joi.number().integer().min(1000).default(10000),
  PAGE_FETCH_TIMEOUT_MS: Joi.number().integer().min(1000).default(10000),
  APP_USER_AGENT: Joi.string().required(),
});
