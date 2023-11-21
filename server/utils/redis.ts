import { Redis } from "ioredis";
require("dotenv").config();

const redisClient = () => {
  if (process.env.REDIS_URI) {
    console.log("Redis is enabled");
    return process.env.REDIS_URI;
  }
  throw new Error("Redis is not enabled");
};

export const redis = new Redis(redisClient());
