import express from "express";

import { authorizedRoles, isAuthencation } from "../Middleware/auth";
import { createCourses } from "../services/course.service";
import {
  addAnswer,
  addQuestion,
  addRepliesToReviews,
  addReview,
  editCourse,
  getAllCourse,
  getCourseByUser,
  getSingleCourse,
  uploadCourse,
} from "../contoller/course.controller";
const courseRouter = express.Router();
courseRouter.post(
  "/create-course",
  isAuthencation,
  authorizedRoles("admin"),
  uploadCourse
);
courseRouter.post(
  "/edit-course/:id",
  isAuthencation,
  authorizedRoles("admin"),
  editCourse
);
courseRouter.get("/get-course/:id", getSingleCourse);
courseRouter.get("/get-course", getAllCourse);
courseRouter.get("/get-course-content/:id", isAuthencation, getCourseByUser);
courseRouter.put("/add-question", isAuthencation, addQuestion);
courseRouter.put("/add-answer", isAuthencation, addAnswer);
courseRouter.put("/add-review/:id", isAuthencation, addReview);
courseRouter.put(
  "/add-review-reply",
  isAuthencation,
  authorizedRoles("admin"),
  addRepliesToReviews
);

export default courseRouter;
