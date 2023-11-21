import jwt from "jsonwebtoken";
import { CatachAsyncErrors } from "./catchAsyncErrors";
import ErrorHandler from "../utils/ErrorHandlers";
import { redis } from "../utils/redis";
import { Request, Response } from "express";
interface ExpressRequest extends Request {
  user?: { role: string; _id: string; id: string }; // Add the user property to Request
}
export const isAuthencation = CatachAsyncErrors(
  async (req: ExpressRequest, res: Response, next: any) => {
    try {
      const access_token = await req.cookies.access_token;
      if (!access_token) {
        return next(new ErrorHandler("Please login first", 400));
      }
      const decoded: any = jwt.verify(
        access_token,
        process.env.ACCESS_TOKEN_SECRET as string
      );
      if (!decoded) {
        return next(new ErrorHandler("Token is not valid", 400));
      }
      const user = await redis.get(decoded.id);

      if (!user) {
        return next(new ErrorHandler("user not found", 400));
      }
      req.user = JSON.parse(user);
      // await redis.del(userID?._id);
      next();
    } catch (err) {
      console.error(err);
    }
  }
);
// validate user role
export const authorizedRoles = (...roles: any) => {
  return (req: ExpressRequest, res: Response, next: any) => {
    if (!roles.includes(req.user?.role || "")) {
      return next(
        new ErrorHandler("you do not have permission to access this route", 403)
      );
    }
    next();
  };
};
