import express from "express";

import { authorizedRoles, isAuthencation } from "../Middleware/auth";
import {
  getNotification,
  updateNotification,
} from "../contoller/notification.controller";

const notificationRoute = express.Router();

notificationRoute.get(
  "/get-all-notification",
  isAuthencation,
  authorizedRoles("admin"),
  getNotification
);
notificationRoute.put(
  "/update-notification:id",
  isAuthencation,
  authorizedRoles("admin"),
  updateNotification
);
export default notificationRoute;
