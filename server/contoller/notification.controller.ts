// notification controller later introduced the bull mq workers.
require("dotenv").config();
import { Request, Response, NextFunction } from "express";
import jwt, { Secret, verify } from "jsonwebtoken";

import sendMail from "../utils/sendMail";
import { CatachAsyncErrors } from "../Middleware/catchAsyncErrors";
import ErrorHandler from "../utils/ErrorHandlers";

import { ExpressRequest } from "./user.controller";
import cron from "node-cron";
import NotificationModel from "../models/notification.model";
// get all notifications -- only admins
export const getNotification = CatachAsyncErrors(
  async (req: ExpressRequest, res: Response, next: NextFunction) => {
    try {
      const notifications = await NotificationModel.find().sort({
        createdAt: -1,
      });

      res.status(200).json({
        success: true,
        notifications,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error?.message, 500));
    }
  }
);
// update notifications -- only admins put
export const updateNotification = CatachAsyncErrors(
  async (req: ExpressRequest, res: Response, next: NextFunction) => {
    try {
      const notifications = await NotificationModel.findById(req.params.id);

      if (!notifications) {
        return next(new ErrorHandler("Notification not found", 404));
      } else {
        notifications.status = "read";
      }

      await notifications.save();
      const notification = await NotificationModel.find().sort({
        createdAt: -1,
      });
      res.status(200).json({
        success: true,
        notification,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error?.message, 500));
    }
  }
);

// delete past 30 days notification running a cron job ,
// code changes will implement mq worker for this to schedula a job.
cron.schedule("0 0 0 * * *", async () => {
  try {
    const notifications = await NotificationModel.find({
      createdAt: {
        $lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      },
    });
    notifications.forEach(async (notification: any) => {
      await notification.remove();
    });

    console.log("deleted read notifications");
  } catch (error: any) {
    console.log("error :", error);
  }
});
