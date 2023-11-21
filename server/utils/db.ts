import mongoose from "mongoose";
require("dotenv").config();

const MONGO_URI: string = process.env.MONGODB_URI || "";
const connectDB = async () => {
  try {
    const conn: any = await mongoose.connect(MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error: any) {
    console.error(`Error: ${error.message}`);
    setTimeout(connectDB, 5000);
    process.exit(1);
  }
};

export default connectDB;
