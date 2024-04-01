import { Request, Response, NextFunction } from "express";
import jwt, { Secret, verify } from "jsonwebtoken";
import ejs from "ejs";
import path from "path";
import sendMail from "../utils/sendMail";
import { CatachAsyncErrors } from "../Middleware/catchAsyncErrors";
import CourseModel from "../models/course.model";

// create courses
export const createCourses = CatachAsyncErrors(
  async (data: any, res: Response) => {
    const courses = await CourseModel.create(data);
    res.status(201).json({
      success: true,
      courses,
    });
  }
);

// get all courses
