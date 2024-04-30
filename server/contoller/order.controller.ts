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
import OrderModel, { IOrder } from "../models/order.model";
import { newOrder } from "../services/order.service";
import NotificationModel from "../models/notification.model";

// create order post req.

export const createOrder = CatachAsyncErrors(
  async (req: ExpressRequest, res: Response, next: NextFunction) => {
    try {
      const { courseId, payment_Info } = req.body as IOrder;
      const user = await UserModel.findById(req?.user?._id);
      if (!user) {
        return next(new ErrorHandler("User not Login or found", 404));
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

      // send a mail to user for payment

      const mailData = {
        order: {
          _id: course?._id.toString?.splice(0, 6),
          name: course?.name,
          price: course?.price,
          date: new Date().toLocaleDateString("en-US", {
            year: "numeric",
            month: "numeric",
            day: "numeric",
          }),
        },
      };

      const html = await ejs.renderFile(
        path.join(__dirname, "../mail/order-confirmation.ejs"),
        { order: mailData }
      );

      try {
        if (user) {
          await sendMail({
            email: user?.email,
            subject: "order confirmation",
            template: "order-confirmation.ejs",
            mailData,
            html,
          });
        }
        user?.courses?.push(course?._id);
        await user?.save();
        await NotificationModel.create({
          user: user?._id,
          message: `You have a new order from  ${course?.name}`,
          title: "New order",
        });

        course.purchased ? (course.purchased += 1) : course.purchased;
        await course.save();
        newOrder(orderData, res, next);
      } catch (error: any) {
        return next(new ErrorHandler(error?.message, 500));
      }
    } catch (error: any) {
      return next(new ErrorHandler(error?.message, 500));
    }
  }
);

// get all order
export const getAllOrders = CatachAsyncErrors(
  async (req: ExpressRequest, res: Response, next: NextFunction) => {
    try {
      const orders = await OrderModel.find().sort({ createdAt: -1 });
      res.status(200).json({
        success: true,
        orders,
      });
    } catch (err) {
      next(err);
    }
  }
);
