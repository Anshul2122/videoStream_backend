import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
  const {videoId} = req.params
  //TODO: toggle like on video
  if(!isValidObjectId(videoId)) {
    throw new ApiError(400, "invalid video id");
  }
  const user = req.user._id;
  const likedVideo = await Like.findOne({
    $and:[{video:videoId}, {likedBy:user}],
  });
  if(!likedVideo){
    const like = await Like.create({
      video:videoId,
      likedBy:user,
    });
    if(!like){
      throw new ApiError(500, "error while liking video");
    }

    return res.status(200).json(new ApiResponse(200,like, "liked video"));
  }

  const unlikeVideo = await Like.findByIdAndDelete(likedVideo._id);
  if(!unlikeVideo){
    throw new ApiError(500, "error while unliking video");
  }
  return res.status(200).json(new ApiResponse(200, unlikeVideo, "video unliked"));
})

const toggleCommentLike = asyncHandler(async (req, res) => {
  const {commentId} = req.params
  //TODO: toggle like on comment
  if(!isValidObjectId(commentId)) {
    throw new ApiError(400, "invalid commemt id");
  }
  const user = req.user._id;
  const likeComment = await Like.findOne({
    $and:[{video:commentId}, {likedBy:user}],
  });
  if(!likeComment){
    const like = await Like.create({
      video:commentId,
      likedBy:user,
    });
    if(!like){
      throw new ApiError(500, "error while liking comment");
    }

    return res.status(200).json(new ApiResponse(200,like, "liked comment"));
  }

  const unlikeComment = await Like.findByIdAndDelete(likeComment._id);
  if(!unlikeComment){
    throw new ApiError(500, "error while unliking comment");
  }
  return res.status(200).json(new ApiResponse(200, unlikeComment, "comment unliked"));

})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    //TODO: toggle like on tweet
  if(!isValidObjectId(tweetId)) {
    throw new ApiError(400, "invalid tweet id");
  }
  const user = req.user._id;
  const likeTweet = await Like.findOne({
    $and:[{video:tweetId}, {likedBy:user}],
  });
  if(!likeTweet){
    const like = await Like.create({
      video:tweetId,
      likedBy:user,
    });
    if(!like){
      throw new ApiError(500, "error while liking tweet");
    }

    return res.status(200).json(new ApiResponse(200,like, "liked tweet"));
  }

  const unlikeTweet = await Like.findByIdAndDelete(likeTweet._id);
  if(!unlikeTweet){
    throw new ApiError(500, "error while unliking tweet");
  }
  return res.status(200).json(new ApiResponse(200, unlikeTweet, "tweet unliked"));
  })

const getLikedVideos = asyncHandler(async (req, res) => {
  //TODO: get all liked videos
  const likedVideos = await Like.aggregate([
    {
      $match: {
        likedBy: new mongoose.Types.ObjectId(req.user._id),
        video:{ $exists: true, $ne:null },
      }
    },
    {
      $lookup:{
        from:"videos",
        localField:"video",
        foreignField:"_id",
        as:"video",
        pipeline:[
          {
            $lookup:{
              from:"users",
              localField:"owner",
              foreignField:"_id",
              as:"owner",
              pipeline:[
                {
                  $project:{
                    avatar:1,
                    username:1,
                    fullName:1,
                  }
                }
              ]
            }
          },
          {
            $addFields:{
              owner:{
                $first:"$owner",
              }
            }
          },
          {
            $project:{
              videoFile:1,
              thumbnail:1,
              title:1,
              duration:1,
              views:1,
              owner:1
            }
          }
        ]
      }
    },
    {
      $unwind:"$video",
    },
    {
      $project:{
        video:1,
        likedBy:1,
      }
    }
  ]);
  return res.status(200).json(new ApiResponse(200, likedVideos, "fetched liked videos"));
})

export {
  toggleCommentLike,
  toggleTweetLike,
  toggleVideoLike,
  getLikedVideos
}