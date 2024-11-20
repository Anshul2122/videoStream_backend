import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { Video } from "../models/video.model.js";


const createPlaylist = asyncHandler(async (req, res) => {
  const {name, description} = req.body
  //TODO: create playlist
  if(!name || !description){
    throw new ApiError(400,"name and description is required");
  }
  const existingPlaylist = await Playlist.findOne({
    $and:[{name:name}, {owner:req.user._id}],
  });
  if(existingPlaylist){
    throw new ApiError(400,"playlist already exists");
  }
  const playlist = await Playlist.create({
    name:name,
    owner:req.user._id,
    description:description,
  });

  if(!existingPlaylist){
    throw new ApiError(500,"error while creating playlist");
  }

  return res.status(201).json(new ApiResponse(200, playlist, "playlist created successfully!!"));

})

const getUserPlaylists = asyncHandler(async (req, res) => {
  const {userId} = req.params
  //TODO: get user playlists
  if(!isValidObjectId(userId)){
    throw new ApiError(400, "Invalid user id");
  }
  const userPlaylist = await Playlist.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(userId),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "videos",
        foreignField: "_id",
        as: "videos",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                {
                  $project: {
                    fullName: 1,
                    username: 1,
                    avatar: 1,
                  },
                },
              ],
            },
          },
          {
            $addFields: {
              owner: {
                $first: "$owner",
              },
            },
          },
          {
            $project: {
              title: 1,
              thumbnail: 1,
              description: 1,
              owner: 1,
            },
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
        pipeline: [
          {
            $project: {
              avatar: 1,
              fullName: 1,
              username: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        createdBy: {
          $first: "$createdBy",
        },
      },
    },
    {
      $project: {
        videos: 1,
        createdBy: 1,
        name: 1,
        description: 1,
      },
    },
  ]).toArray();
  if(userPlaylist.length ===  0){
    throw new ApiError(404, "no playlist found")
  }
  return res.status(200).json(200, userPlaylist, "playlist fetched successfully!!");
});

const getPlaylistById = asyncHandler(async (req, res) => {
  const {playlistId} = req.params
  //TODO: get playlist by id
  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, "Invalid playlist ID");
  }

  const playlist = await Playlist.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(playlistId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "createdBy",
        pipeline: [
          {
            $project: {
              fullName: 1,
              username: 1,
              avatar: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        createdBy: {
          $first: "$createdBy",
        },
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "videos",
        foreignField: "_id",
        as: "videos",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                {
                  $project: {
                    fullName: 1,
                    username: 1,
                    avatar: 1,
                  },
                },
              ],
            },
          },
          {
            $addFields: {
              owner: {
                $first: "$owner",
              },
            },
          },
          {
            $project: {
              thumbnail: 1,
              title: 1,
              duration: 1,
              views: 1,
              owner: 1,
              createdAt: 1,
              updatedAt: 1,
            },
          },
        ],
      },
    },
    {
      $project: {
        videos: 1,
        description: 1,
        name: 1,
        createdBy: 1,
      },
    },
  ]);

  if (!playlist) {
    throw new ApiError(500, "Error fetching playlist");
  }

  return res.status(200).json(new ApiResponse(200, playlist, "playlist found!!"));
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
  const {playlistId, videoId} = req.params
  if(!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid playlist ID");
  }
  const playlist = await Playlist.findById(playlistId);
  if(!playlist){
    throw new ApiError(404, "playlist not found");
  }
  if(playlist.owner!== req.user._id){
    throw new ApiError(403, "You are not allowed to update this video");
  }

  const videoExists = playlist.videos.filter((video)=> video.toString()===videoId);

  if(videoExists){
    throw new ApiError(403, "Video already exists in playlist");
  }
  const addVideo = await Playlist.findByIdAndUpdate(
    playlistId,
    {
      $set: {
        videos:[...playlist.videos, videoId],
      }
    },{
      new : true
    }
  );
  if(!addVideo){
    throw new ApiError(403,  "Error while adding video to playlist");
  }

  return res.status(200).json(new ApiResponse(200, playlist, "video added to playlist and playlist updated!!"));

})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  const {playlistId, videoId} = req.params
  // TODO: remove video from playlist
  if(!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
    throw new ApiError(403, "Invalid playlist or video ID");
  }
  const playlist = await Playlist.findById(playlistId);
  if(!playlist){
    throw new ApiError(403, "playlist not found");
  }
  if(playlist.owner!==req.user._id){
    throw new ApiError(403, "You are not allowed to update this video");
  }
  const videoExists = playlist.video.find((video)=>video.toString()===videoId);
  if(!videoExists){
    throw new ApiError(403, " no Video found in the playlist");
  }

  const modifyPlaylistVideos = playlist.videos.filter((video)=> video.toString()===videoId);
  const removeVideo = await Playlist.findByIdAndUpdate(
    playlistId,
    {
      $set:{
        videos:modifyPlaylistVideos,
      }
    },
    {new :true}
  );


  if(!removeVideo){
    throw new ApiError(500, "error while removing video");
  }
  return res.status(200).json(new ApiResponse(200, playlist, "video removed successfully"));
})

const deletePlaylist = asyncHandler(async (req, res) => {
  const {playlistId} = req.params
  // TODO: delete playlist
  if(!isValidObjectId(playlistId)){
    throw new ApiError(400, "Invalid playlist ID");
  }
  const playlist = await Playlist.findById(playlistId);
  if(!playlist){
    throw new ApiError(403, "Playlist not found");
  }

  const owner = req.user._id;
  if(playlist.owner !== owner){
    throw new ApiError(403, "You are not allowed to update this video");
  }
  const deletePlaylist = await Playlist.findByIdAndDelete(playlist._id);

  if(!deletePlaylist){
    throw new ApiError(403, "Error while deleting playlist");
  }
  return res.status(200).json(new ApiResponse(200, {}, "playlist removed!!"));
})

const updatePlaylist = asyncHandler(async (req, res) => {
  const {playlistId} = req.params
  const {name, description} = req.body
  //TODO: update playlist
  if(!name || !description){
    throw new ApiError(403, "name and description is missing");
  }
  if(!isValidObjectId(playlistId)){
    throw new ApiError(403, "Invalid playlist ID");
  }
  const playlist = await Playlist.findById(playlistId);
  if(!playlist){
    throw new ApiError(403, "Playlist not found");
  }
  const owner = req.user._id;
  if(playlist.owner!== owner){
    throw new ApiError(403, "You are not allowed to update this video");
  }
  const updatePlaylist = await Playlist.findByIdAndUpdate(playlistId,
    {
      $set: {
        name,
        description,
      },
    }, {new : true}
  );
  if(!updatePlaylist){
    throw new ApiError(500, "error while updating playlist");
  }
  return res.status(200).json(new ApiResponse(200, playlist, "playlist updated!!"));
})

export {
  createPlaylist,
  getUserPlaylists,
  getPlaylistById,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  deletePlaylist,
  updatePlaylist
}