import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  DATABASE_URL: Joi.string().uri().required(),
  JWT_SECRET: Joi.string().min(16).required(),
  TREASURY_PRIVATE_KEY: Joi.string().required(),
  STELLAR_RPC_URL: Joi.string().uri().required(),
  BTC_NODE_URL: Joi.string().uri().required(),
  ETH_NODE_URL: Joi.string().uri().required(),
  REDIS_URL: Joi.string().uri().required(),
});
