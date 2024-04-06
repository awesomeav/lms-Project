import express from "express";

import { authorizedRoles, isAuthencation } from "../Middleware/auth";
import { createOrder } from "../contoller/order.controller";

const orderRouter = express.Router();

orderRouter.post("/order", isAuthencation, createOrder);
export default orderRouter;
