import mongoose, { Schema, Model, Document } from "mongoose";
import bcrypt from "bcryptjs";
const emailRegexPattern = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,4}$/;
require("dotenv").config();
import jwt from "jsonwebtoken";
export interface Iuser extends Document {
  name: string;
  email: string;
  password: string;
  avatar: {
    public_id: string;
    url: string;
  };
  role: string;
  isverified: boolean;
  courses: Array<{ courseId: string }>;
  active: boolean;
  comparePassword: (password: string) => Promise<boolean>;
  signAccessToken?: any;
  signRefreshToken?: any;
}

const userSchema: Schema<Iuser> = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "please enter name "],
    },
    email: {
      type: String,
      required: [true, "please enter email"],
      validate: {
        validator: function (value: string) {
          return emailRegexPattern.test(value);
        },
        message: "Please enter a valid email",
      },
      unique: true,
    },

    password: {
      type: String,
      minLength: 5,
    },
    avatar: {
      public_id: String,
      url: String,
    },
    role: {
      type: String,
      default: "user",
    },
    isverified: {
      type: Boolean,
      default: false,
    },
    courses: [
      {
        courseId: String,
      },
    ],
  },
  { timestamps: true }
);

// hash password berfore saving
userSchema.pre<Iuser>("save", async function (next) {
  if (!this.isModified("password")) {
    next();
  }

  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.signAccessToken = function () {
  return jwt.sign({ id: this._id }, process.env.ACCESS_TOKEN_SECRET as string, {
    expiresIn: process.env.ACCESS_TOKEN_EXPIRE || "5m",
  });
};
userSchema.methods.signRefreshToken = function () {
  return jwt.sign(
    { id: this._id },
    process.env.REFRESH_TOKEN_SECRET as string,
    {
      expiresIn: process.env.REFESH_TOKEN_EXPIRE || "3d",
    }
  );
};
userSchema.methods.comparePassword = async function (
  enterpassword: string
): Promise<boolean> {
  return await bcrypt.compare(enterpassword, this.password);
};
const UserModel: Model<Iuser> = mongoose.model<Iuser>("User", userSchema);

export default UserModel;
