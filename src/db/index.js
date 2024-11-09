import mongoose from "mongoose";

import {DB_NAME} from "../constanst.js";


const connectDB = async ()=>{
  try {
    const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URL}`);
    console.log(`\n MongoDB connected successfully.`);
    // console.log(connectionInstance);
  } catch (e) {
    console.log("error: ",e);
    process.exit(1);
  }
}

export default connectDB;