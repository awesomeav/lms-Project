require("dotenv").config();
import { Request, Response, NextFunction } from "express";
import jwt, { Secret, verify } from "jsonwebtoken";
import ejs from "ejs";
import path from "path";
import sendMail from "../utils/sendMail";
import { CatachAsyncErrors } from "../Middleware/catchAsyncErrors";
import ErrorHandler from "../utils/ErrorHandlers";
import UserModel, { Iuser } from "../models/user.model";
import bcrypt from "bcryptjs";
import cloudinary from "cloudinary";
import { createCourses } from "../services/course.service";
import CourseModel from "../models/course.model";
import { redis } from "../utils/redis";
import { ExpressRequest } from "./user.controller";
import mongoose from "mongoose";
import OrderModel, { IOrder } from "../models/order.model";
import { newOrder } from "../services/order.service";

// create order post req.

export const createOrder = CatachAsyncErrors(
  async (req: ExpressRequest, res: Response, next: NextFunction) => {
    try {
      const { courseId, payment_Info } = req.body as IOrder;
      const user = await UserModel.findById(req?.user?._id);
      if (!user) {
        return next(new ErrorHandler("User not found", 404));
      }
      const alreadyPurchased = user?.courses.map(
        (items: any) => items._id.toString() == courseId
      );

      if (alreadyPurchased) {
        return next(
          new ErrorHandler("You have already purchased this course", 400)
        );
      }
      const course = await CourseModel.findById(courseId);

      if (!course) {
        return next(new ErrorHandler("Course not found", 404));
      }

      const orderData: any = {
        user: user?._id,
        course: courseId,
        payment_Info,
      };
      newOrder(orderData, res, next);
    } catch (error: any) {
      return next(new ErrorHandler(error?.message, 500));
    }
  }
);
