
import dotenv from "dotenv";
import connectDB from "./db/index.js";
dotenv.config({path: ""});
import { app } from "./app.js";

connectDB()
  .then(()=>{
    app.listen(process.env.PORT || 3000, ()=>{
      console.log(`server is running on port ${process.env.PORT}`);
  });
}).catch((err) => {
  console.log(err)
})



/*
(async ()=>{
  try {
    await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`, {})
    app.on("error",()=>{
      console.log("Error connecting to MongoDB", error);
      throw  error;
    })
    app.listen((process.env.PORT, ()=>{
      console.log(`App is listening on port ${process.env.PORT}`);
    }))
  } catch (e){
    console.error("error: ",e);
    throw err;
  }
})()
*/