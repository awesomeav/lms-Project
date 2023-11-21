import jwt from "jsonwebtoken";
require("dotenv").config();
import { Response } from "express";
import { redis } from "./redis";
import { Iuser } from "../models/user.model";

interface ItokenOptions {
  expires?: Date;
  maxAge?: number;
  httpOnly?: boolean;
  sameSite?: "lax" | "strict" | "none";
  secure?: boolean;
}

export const accessTokenExpires = parseInt(
  process.env.ACCESS_TOKEN_EXPIRE as string,
  10
);
export const refreshTokenExpires = parseInt(
  process.env.REFESH_TOKEN_EXPIRE as string,
  10
);

// upload session to redis

export const accessTokenOptions: ItokenOptions = {
  expires: new Date(Date.now() + accessTokenExpires * 60 * 60 * 1000),
  maxAge: accessTokenExpires * 60 * 60 * 1000,
  httpOnly: true,
  sameSite: "lax",
};
export const refreshTokenOptions: ItokenOptions = {
  expires: new Date(Date.now() + refreshTokenExpires * 24 * 60 * 60 * 1000),
  maxAge: refreshTokenExpires * 24 * 60 * 60 * 1000,
  httpOnly: true,
  sameSite: "lax",
};

export const sendToken = (user: Iuser, statusCode: number, res: Response) => {
  const accessToken = user.signAccessToken();
  const refreshToken = user.signRefreshToken();
  redis.set(user._id.toString(), JSON.stringify(user));

  if (process.env.NODE_ENV == "production") {
    accessTokenOptions.secure = true;
    // refreshTokenOptions.secure = true;
  }
  res.cookie("access_token", accessToken, accessTokenOptions);
  res.cookie("refresh_token", refreshToken, refreshTokenOptions);
  res.status(statusCode).json({
    success: true,
    user,
    accessToken,
  });
};
