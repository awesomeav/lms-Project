import mongoose from "mongoose";
import { Schema, Model, Document } from "mongoose";
import { Iuser } from "./user.model";

interface IComment extends Document {
  user: Iuser;
  question: string;
  questionReplies?: IComment[];
}

interface IReview extends Document {
  user: Iuser;
  rating: number;
  comment: string;
  commentReplies?: IComment[];
}

interface ILink extends Document {
  title: string;
  url: string;
}

interface IcourseData extends Document {
  title: string;
  description: string;
  videoUrl: string;
  videoThubnail: object;
  videoSection: string;
  videoLength: number;
  videoPlayer: string;
  suggestion: string;
  questions: IComment[];
  reviews: IReview[];
  links: ILink[];
}
interface Icourse extends Document {
  name: string;
  description: string;
  price: number;
  estimatedPrice: number;
  tags: string;
  level: string;
  demoUrl: string;
  benefits: { title: string }[];
  prerequistes: { title: string }[];
  review: IReview[];
  courseData: IcourseData[];
  ratings?: number;
  purchased?: number;
  thumbnail: object;
}

const reviewSchema = new Schema<IReview>({
  user: {
    type: Object,
  },
  rating: {
    type: Number,
    default: 0,
  },
  comment: {
    type: String,
  },
  commentReplies: [Object],
});

const linkSchema = new Schema<ILink>({
  title: String,
  url: String,
});
const commentsSchema = new Schema<IComment>({
  user: {
    type: Object,
    ref: "User",
  },
  question: {
    type: String,
  },
  questionReplies: [Object],
});
const courseDataSchema = new Schema<IcourseData>({
  title: String,
  description: String,
  videoUrl: String,
  videoSection: String,
  videoLength: Number,
  videoPlayer: String,
  suggestion: String,
  questions: [commentsSchema],
  reviews: [reviewSchema],
  links: [linkSchema],
});

const courseSchema = new Schema<Icourse>({
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  estimatedPrice: { type: Number },
  thumbnail: {
    public_id: {
      type: String,
    },
    url: {
      type: String,
    },
  },
  tags: { type: String, required: true },
  level: { type: String, required: true },
  demoUrl: { type: String, required: true },
  benefits: [{ title: String }],
  prerequistes: [{ title: String }],
  review: [reviewSchema],
  courseData: [courseDataSchema],
  ratings: { type: Number, default: 0 },
  purchased: { type: Number, default: 0 },
});

const CourseModel: Model<Icourse> = mongoose.model("Course", courseSchema);
export default CourseModel;
