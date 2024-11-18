import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js";
import ApiError from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";


const registerUser = asyncHandler(async (req, res,next) => {

  //    get user details from frontend
  const {fullName, email, username, password} = req.body;
  //    validation - field not empty
  //       if(fullName ===""){
  //        throw new apiError(400, "full name is required");
  //       }
  //       if(email ===""){
  //         throw new apiError(400, "full name is required");;
  //       }
  //       if(username ==="") {
  //         throw new apiError(400, "full name is required");
  //       }
  //       if(password ==="") {
  //        throw new apiError(400, "full name is required");
  //       }
  if([fullName, email, username, password].some((field)=>field?.trim()==="")){
    throw new ApiError(400, "all fields are required");
  }
  //    check of user already exits: username, email
  const exitedUser = await User.findOne({$or:[{username},{email}]});
  if(exitedUser){
    throw new ApiError(409, "User with email or username exists");
  }
  //    check for images, check for avatar
  const avatarLocalPath = req.files?.avatar[0].path;

  let coverImageLocalPath;
  let coverImage;
  if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
    coverImageLocalPath = req.files.coverImage[0].path;
    coverImage = await uploadOnCloudinary(coverImageLocalPath);
  }
  //    upload them to cloudinary, avatar
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  // let avatarImage =  req.files.avatar;
  // console.log("avatar: ", avatarImage);



  if(!avatar){
    throw new ApiError(400, "avatar is required");
  }

  //    create user object
  const user =  await User.create({
    fullName,
    email,
    username:username.toLowerCase(),
    password,
    avatar:avatar.url,
    coverImage:coverImage?.url || "",
  });
  //    remove password and refresh token field from response
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  //    check for user creation

  if(!createdUser){
    throw new ApiError(500, "something went worng while registering the user");
  }
  //    return response
  return res.status(201).json(
    new ApiResponse(200, createdUser, "user registered successfully!!")
  )


})


export { registerUser };