import { Request, Response, NextFunction } from "express";

import { CatachAsyncErrors } from "../Middleware/catchAsyncErrors";
import OrderModel from "../models/order.model";

// create courses
export const newOrder = CatachAsyncErrors(
  async (data: any, next: NextFunction, res: Response) => {
    const order: any = await OrderModel.create(data);
    res.status(200).json({
      success: true,
      order,
    });
    // res.status(200).send({
    //   success: true,
    //   message: "Order created successfully",
    //   order,
    // });
  }
);

// get all courses
