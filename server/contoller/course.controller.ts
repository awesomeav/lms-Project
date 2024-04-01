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

// upload course

export const uploadCourse = CatachAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = req?.body;
      const thumbnail = data;
      if (thumbnail) {
        const myCloud = await cloudinary.v2.uploader.upload(thumbnail, {
          folder: "courses",
        });
        data.thumbnail = {
          public_id: myCloud.public_id,
          url: myCloud.secure_url,
        };
      }
      createCourses(data, res, next);
    } catch (error) {
      return next(error);
    }
  }
);

// edit course
export const editCourse = CatachAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = req.body;
      const thumbnail = data;
      if (thumbnail) {
        await cloudinary.v2.uploader.destroy(thumbnail.public_id);
        const myCloud = await cloudinary.v2.uploader.upload(thumbnail, {
          folder: "courses",
        });
        data.thumbnail = {
          public_id: myCloud.public_id,
          url: myCloud.secure_url,
        };
      }
      const courseId = req.params.Id;
      const course = await CourseModel.findById(
        courseId,
        {
          $set: data,
        },
        { new: true }
      );
      res.status(200).json({
        success: true,
        course,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error?.message, 500));
    }
  }
);

// get single course  == without purchase

export const getSingleCourse = CatachAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      let courseId = req.params.id;
      const isCachedExist: any = redis.get(courseId);

      if (!isCachedExist) {
        const course = await CourseModel.find({}).select(
          "-courseData.videoUrl,-courseData.suggestion,-courseData.question ,-courseData.links"
        );
        await redis.set(courseId, JSON.stringify(course));
        res.status(200).json({
          success: true,
          course,
        });
      }
      const course = JSON.parse(isCachedExist);

      res.status(200).json({
        success: true,
        course,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error?.message, 500));
    }
  }
);
// get all courses -- without purchasing
export const getAllCourse = CatachAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const isCachedExist = await redis.get("allCourse");
      if (isCachedExist) {
        const course = JSON.parse(isCachedExist);
        return res.status(200).json({
          success: true,
          course,
        });
      }
      const course = await CourseModel.find({}).select(
        "-courseData.videoUrl,-courseData.suggestion,-courseData.question ,-courseData.links"
      );
      await redis.set("allCourse", JSON.stringify(course));
      res.status(200).json({
        success: true,
        course,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error?.message, 500));
    }
  }
);

// get course for valid user .

export const getCourseByUser = CatachAsyncErrors(
  async (req: ExpressRequest, res: Response, next: NextFunction) => {
    try {
      const userCourseList = req?.user?.courses;
      const courseID = req?.params.ID;
      const courseExist = userCourseList?.find(
        (courses: any) => courses?._id.toString() == courseID
      );
      if (!courseExist) {
        return next(
          new ErrorHandler("Course not found , You are not eligible", 404)
        );
      }
      const course = await CourseModel.findById(courseID);

      const content = course?.courseData;

      res.status(200).json({
        success: true,
        content,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error?.message, 500));
    }
  }
);
// add question to the courses ;

interface IAddQuestion {
  question: string;
  courseId: string;
  contentId: string;
}

export const addQuestion = CatachAsyncErrors(
  async (req: ExpressRequest, res: Response, next: NextFunction) => {
    try {
      const { question, courseId, contentId }: IAddQuestion = req.body;
      const course = await CourseModel.findById(courseId);
      if (!mongoose.Types.ObjectId.isValid(contentId)) {
        return next(new ErrorHandler("Invalid Course Id", 404));
      }
      const courseContent = course?.courseData?.find((content: any) =>
        content?._id.equals(contentId)
      ); // just filter the content if it is present or not
      if (!courseContent) {
        return next(new ErrorHandler("invalid content id ", 404));
      }

      // creates a new question object
      const questionObject: any = {
        question: question,
        user: req.user,
        questionReplies: [],
      };
      //add this to course content
      courseContent?.questions?.push(questionObject);
      // save the updated

      await course?.save();
      res.status(200).json({
        success: true,
        course,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error?.message, 500));
    }
  }
);

interface IAddAnswer {
  questionId: string;
  answer: string;
  courseId: string;
  contentId: string;
}

// add answer in question
export const addAnswer = CatachAsyncErrors(
  async (req: ExpressRequest, res: Response, next: NextFunction) => {
    try {
      const { questionId, answer, courseId, contentId }: IAddAnswer = req.body;
      const course = await CourseModel.findById(courseId);
      if (!mongoose.Types.ObjectId.isValid(contentId)) {
        return next(new ErrorHandler("Invalid Course Id", 404));
      }
      const courseContent = course?.courseData?.find((content: any) =>
        content?._id.equals(contentId)
      ); // just filter the content if it is present or not
      if (!courseContent) {
        return next(new ErrorHandler("invalid content id ", 404));
      }
      const question = courseContent?.questions?.find((question: any) =>
        question?._id.equals(questionId)
      );
      if (!question) {
        return next(new ErrorHandler("invalid question id ", 404));
      }
      const answerObject: any = {
        answer,
        user: req.user,
      };
      question?.questionReplies?.push(answerObject);
      // save the updated
      if (req?.user?._id == question?.user?._id) {
        // send notification in dashboard for replies to admin
        // someone repl
      } else {
        const data: any = {
          name: question?.user?.name,
          title: courseContent?.title,
        };
        const html = await ejs.renderFile(
          path.join(__dirname, "../mails/question-reply.ejs")
        );
        try {
          await sendMail({
            email: question?.user?.email,
            subject: "Reply to your question",
            template: "question-reply.ejs",
            data,
            html,
          });
        } catch (err) {}
      }

      await course?.save();
      res.status(200).json({
        success: true,
        course,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error?.message, 500));
    }
  }
);

// add review in a course

interface IAddReview {
  rating: number;
  review: string;
  userId: string;
}
export const addReview = CatachAsyncErrors(
  async (req: ExpressRequest, res: Response, next: NextFunction) => {
    try {
      const userCourseList = req.user?.courses;
      const courseId = req.params.courseId;

      const cousreExists = userCourseList?.find((course: any) =>
        course?._id.equals(courseId)
      );

      if (!cousreExists) {
        return next(new ErrorHandler("Course not found", 404));
      }

      const course = await CourseModel.findById(courseId);
      const { rating, review }: IAddReview = req.body;
      const reviewObject: any = {
        user: req.user,
        rating,
        Comment: review,
      };
      // add this reviews to course
      course?.review?.push(reviewObject);

      let avg = 0;
      // calculate avg rating of a course by adding all rating of user and divide by total users who rate it
      course?.review?.forEach((review: any) => {
        avg += review?.rating;
      });
      if (course) {
        course.ratings = avg / course?.review?.length;
      }
      // save the course
      await course?.save();
      // now the notification is also send to admin.
      const notification: any = {
        title: "New Review",
        message: `${req.user?.name} has given a review in ${course?.name}`,
      };
      // send notification .
      res.status(200).json({
        success: true,
        course,
      });
    } catch (err: any) {
      return next(new ErrorHandler(err?.message, 500));
    }
  }
);

//  add relpies in review in a course
interface IAddReviewData {
  comment: string;
  courseId: string;
  reviewId: string;
}
export const addRepliesToReviews = CatachAsyncErrors(
  async (req: ExpressRequest, res: Response, next: NextFunction) => {
    try {
      const { courseId, comment, reviewId }: IAddReviewData = req.body;

      const course = await CourseModel.findById(courseId);
      const review = course?.review?.find(
        (review: any) => review?._id == reviewId
      );
      // we got the review now add the replies to review comment replies

      if (!review) {
        return next(
          new ErrorHandler("Review not found or wrong reviewId", 404)
        );
      }
      const reviewObject: any = {
        user: req.user,
        comment,
      };

      if (!review?.commentReplies) {
        review.commentReplies = [];
      }
      review?.commentReplies?.push(reviewObject);
      await course?.save();

      res.status(200).json({
        success: true,
        course,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error?.message, 500));
    }
  }
);
