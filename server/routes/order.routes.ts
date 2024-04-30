import express from "express";

import { authorizedRoles, isAuthencation } from "../Middleware/auth";
import { createOrder, getAllOrders } from "../contoller/order.controller";

const orderRouter = express.Router();

orderRouter.post("/order", isAuthencation, createOrder);
orderRouter.post(
  "/get-all-order",
  isAuthencation,
  authorizedRoles("admin"),
  getAllOrders
);
export default orderRouter;
