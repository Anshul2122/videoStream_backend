import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import userRouter from "./routes/user.route.js"

const app = express();


app.use(cors({
  origin: process.env.CORS_ORIGIN,
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(express.static("public"));
app.use(cookieParser());


app.use((req, res, next) => {
  console.log(
    "----------------------------------------------------------------------------------"
  );
  console.log(`Route being hit: ${req.method} ${req.path}`);
  console.log("Req Body", req.body);
  console.log("Req Params", req.params);
  console.log("Req Query", req.query);
  console.log(
    "----------------------------------------------------------------------------------"
  );
  next();
});

//routes import


// routes declaration
app.use("/api/v1/users", userRouter)

export {app};