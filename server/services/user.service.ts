// get user by id

import { Response } from "express";
import { CatachAsyncErrors } from "../Middleware/catchAsyncErrors";
import UserModel from "../models/user.model";
import ErrorHandler from "../utils/ErrorHandlers";
import { redis } from "../utils/redis";

// get user by id
export const getUserById = async (id: string, res: Response) => {
  // const user = await UserModel.findById(id);
  const userJson = await redis.get(id);
  if (userJson) {
    const user = JSON.stringify(userJson);
    res.status(200).json({
      success: true,
      user,
    });
  }
};

// get all users

export const getAllUsers = async (req: any, res: Response) => {
  const users = await UserModel.find().sort({ createdAt: -1 });
  res.status(200).json({
    success: true,
    users,
  });
};
