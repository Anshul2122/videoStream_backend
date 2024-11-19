import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";


const generateAccessAndRefreshTokens = async (userId)=>{
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken()
    const refreshToken = user.generateRefreshToken()

    user.refreshToken = refreshToken
    await user.save({validateBeforeSave:false});

    return {accessToken, refreshToken}

  } catch (e) {
    throw new ApiError(500, "something went wrong while generating access and refresh tokens.");
  }
}

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

const loginUser = asyncHandler(async (req, res,next) => {
  // get user details from frontend
  const {email, username, password} = req.body;
  // validation - field not empty
  if(!username && !email){
    console.log("this is error")
    throw new ApiError(400, "username or email is required");
  }
  // check your with email or username exists or not
  const user = await User.findOne({$or:[{username},{email}]});
  if(!user){
    console.log("this is error 2");
    throw new ApiError(404, "user does not exists!");
  }
  //password check
  const isPasswordValid = await user.isPasswordCorrect(password);
  if(!isPasswordValid){
    console.log("this is error 3");
    throw new ApiError(401, "incorrect password!");
  }

  // assign token(access and refresh token) to user
  const {accessToken, refreshToken} = await generateAccessAndRefreshTokens(user._id);

  // send token to cookies
  const loggedInUser = await User.findById(user._id).select("-password -refreshToken");
  const options={
    httpOnly: true,
    secure: true,
  }

  // return response
  return res.status(200).cookie("accessToken", accessToken).cookie("refreshToken",refreshToken).json(new ApiResponse(200,{user:loggedInUser,accessToken:accessToken,refreshToken:refreshToken}, "User logged in successfully!! "));
})

const logOutUser = asyncHandler(async (req, res,next) => {
  const user = await User.findByIdAndUpdate(req.user._id,
    {
        $set:{
          refreshToken:undefined
        }
      },
    {
      new : true
    }
    );
  const options={
    httpOnly: true,
    secure: true,
  }
  return res.status(200).clearCookie("accessToken").clearCookie("refreshToken").json(new ApiResponse(200, {}, "User logged out successfully!!"));

})

const refreshAccessToken = asyncHandler(async (req, res,next) => {
  try {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;
    if(!incomingRefreshToken){
      throw new ApiError(401, "Unauthorized request");
    }
    const decodeToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
    console.log(decodeToken);
    const user = await User.findById(decodeToken?._id);
    if(!user){
      throw new ApiError(401, "invalid refresh token");
    }

    if(incomingRefreshToken!==user?.refreshToken){
      throw new ApiError(401, "refresh token is expired! and used");
    }

    const options={
      httpOnly: true,
      secure: true,
    }
    const {accessToken, newRefreshToken} = await generateAccessAndRefreshTokens(user._id);
    return res.status(200).cookie("accessToken", accessToken).cookie("refreshToken", newRefreshToken).json(new ApiResponse(200,{accessToken, newRefreshToken},"access token refreshed"));

  } catch (e) {
    console.log(e);
    throw new ApiError(401, e?.message ||"invalid refresh token");
  }
})

const changeCurrentPassword = asyncHandler(async (req, res,next) => {
  const{oldPassword, newPassword } = req.body;

  const user = await User.findById(req.user?._id).select("-password -refreshToken");
  const isPasswordCorrect = user.isPasswordCorrect(oldPassword);

  if(!isPasswordCorrect){
    throw new ApiError(401, "incorrect old password!");
  }
  user.password = newPassword;
  await user.save({validateBeforeSave:false});

  return res.status(200).json(new ApiResponse(200, "password changed successfully!!"));
})

const getCurrentUser = asyncHandler(async (req, res,next) => {
  return res.status(200).json( new ApiResponse(200, req.user, "user fetched successfully"));
})

const updateAccountDetails = asyncHandler(async (req, res,next) => {
  const {fullName, email} = req.body;
  if(!fullName || !email){
    throw new ApiError(400, "All fields are required");
  }
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set:{
        fullName:fullName,
        email:email,
      }
    },
    {new :true}
  ).select("-password");

  return res.status(200).json(new ApiResponse(200, user, "account details updated successfully!!"));

})

const updateUserAvatar = asyncHandler(async (req, res,next) => {
  const avatarLocalPath = req.file?.path;
  if(!avatarLocalPath){
    throw new ApiError(400, "avatar file is missing");
  }
  const avatar = await uploadOnCloudinary(avatarLocalPath);

  if(!avatar.url){
    throw new ApiError(400, "error while uploading avatar");
  }
  const user = await User.findByIdAndUpdate(req.user?._id, {
    $set:{
      avatar:avatar.url
    }
  }, {new:true}).select("-password");

  return res.status(200).json(new ApiResponse(200, user, "avatar image updated successfully!!"));
});

const updateUserCoverImage = asyncHandler(async (req, res,next) => {
  const coverImageLocalPath = req.file?.path;
  if(!coverImageLocalPath){
    throw new ApiError(400, "avatar file is missing");
  }
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if(!coverImage.url){
    throw new ApiError(400, "error while uploading avatar");
  }
  const user = await User.findByIdAndUpdate(req.user?._id, {
    $set:{
      avatar:coverImage.url
    }
  }, {new:true}).select("-password");

  return res.status(200).json(new ApiResponse(200, user, "cover image updated successfully!!"));
})



export { registerUser, loginUser, logOutUser, refreshAccessToken, changeCurrentPassword, getCurrentUser, updateUserCoverImage, updateUserAvatar, };