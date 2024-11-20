import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary, deleteFromCloudinary} from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
  //TODO: get all videos based on query, sort, pagination
  const videos = await Video.aggregate([
    {
      $match: {
        $or: [
          {
            title: { $regex: query, $options: "i" },
          },
          {
            description: { $regex: query, $options: "i" },
          },
        ],
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "createdBy",
      },
    },
    {
      $unwind: "$createdBy",
    },
    {
      $project: {
        thumbnail: 1,
        videoFile: 1,
        title: 1,
        description: 1,
        createdBy: {
          fullName: 1,
          username: 1,
          avatar: 1,
        },
      },
    },
    {
      $sort: {
        [sortBy]: sortType === "asc" ? 1 : -1,
      },
    },
    {
      $skip: (page - 1) * limit,
    },
    {
      $limit: parseInt(limit),
    },
  ]);

  return res
    .status(200)
    .json(new ApiResponse(200, videos, "Fetched All Videos"));
})

const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description} = req.body
  // TODO: get video, upload to cloudinary, create video
  if(!title || !description) {
    throw new ApiError(400, "All Fields are required");
  }

  const videoFileLocalPath = req.files?.videoFile[0]?.path;
  if(!videoFileLocalPath){
    throw new ApiError(400, "no Video file found");
  }

  const videoFile = await uploadOnCloudinary(videoFileLocalPath);
  if(!videoFile.url){
    throw new ApiError(500, "Error while uploading video file");
  }

  const thumbnailLocalPath = req.files?.thumbnail[0]?.path;
  if(!thumbnailLocalPath){
    throw new ApiError(400, "no thumbnail image found");
  }

  const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);
  if(!thumbnail.url){
    throw new ApiError(500, "Error while uploading thumbnail");
  }

  const video = await Video.create({
    videoFile: videoFile.url,
    thumbnail: thumbnail.url,
    title,
    description,
    duration:videoFile.duration,
    owner:req.user?._id
  })
  if(!video){
    throw new ApiError(500, "error while uploading video");
  }

  return res.status(200).json(new ApiResponse(200,video, "video published successfully!!"));

})

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params
  //TODO: get video by id
  if(!isValidObjectId(videoId)){
    throw new ApiError(400, "Invalid Video ID");
  }
  const video = await Video.findById(videoId);
  if(!video){
    throw new ApiError(404, "Video not found");
  }
  return res.status(200).json(new ApiResponse(200, video, "Video Fetched"));
})

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params
  //TODO: update video details like title, description, thumbnail
  const {title, description} = req.body;
  const newThumbnailLocalPath = req.file?.path;
  if(!isValidObjectId(videoId)){
    throw new ApiError(400, "Invalid Video ID");
  }
  if(!title || !description){
    throw new ApiError(400, "Provide updated Title and Description")
  }
  if(!newThumbnailLocalPath){
    throw new ApiError(400, "Provide Thumbnail file");
  }
  const video = await Video.findById(videoId);
  if(!video){
    throw new ApiError(404, "Video not found");
  }
  if(video.owner!== req.user._id){
    throw new ApiError(403, "You are not allowed to update this video");
  }

  const deleteThumbnail = await Video.deleteFromCloudinary(video.thumbnail);
  if(!deleteThumbnail.result !== "ok"){
    throw new ApiError(500, "Error while deleting old thumbnail from cloudinary");
  }

  const newThumbnail = await uploadOnCloudinary(newThumbnailLocalPath);
  if(!newThumbnail){
    throw new ApiError(500, "Error while uploading new thumbnail");
  }

  const updatedVideo = await Video.findByIdAndUpdate(videoId, {
    $set:{
      title:title,
      description:description,
      thumbnail:newThumbnail.url,
    }
  }, {new : true})

  return res.status(200).json(new ApiResponse(200, updatedVideo, "video details updated!!"));
})

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params
  //TODO: delete video
  if(!isValidObjectId(videoId)){
    throw new ApiError(400, "Invalid Video ID");
  }
  const video = await Video.findById(videoId);
  if(!video){
    throw new ApiError(404, "Video not found");
  }
  if(video.owner!==req.user._id){
    throw new ApiError(403, "You are not allowed to update this video");
  }
  const cloudinaryDeleteVideoResponse = await deleteFromCloudinary(video.videoFile);

  if(!cloudinaryDeleteVideoResponse.result !== "ok"){
    throw new ApiError(500, "Error while deleting old video");
  }

  const deleteVideo = await Video.findByIdAndDelete(videoId);
  if(!deleteVideo){
    throw new ApiError(500, "Error while deleting old video");
  }
  return res.status(200).json(new ApiResponse(200, {}, "video deleted successfully!!"));
})

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params
  if(!isValidObjectId(videoId)){
    throw new ApiError(400, "Invalid Video ID");
  }
  const video = await Video.findById(videoId);
  if(!video){
    throw new ApiError(404, "Video not found");
  }
  if(video.owner!==req.user._id){
    throw new ApiError(403, "You are not allowed to update this video");
  }
  const modifyVideoPublishStatus = await Video.findByIdAndUpdate(videoId,{
    $set:{
      isPublished:!video.isPublished,
    }
  },{new : true});

  return res.status(200).json(new ApiResponse(200, modifyVideoPublishStatus, "video publish status modified!!"));
})

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus
}