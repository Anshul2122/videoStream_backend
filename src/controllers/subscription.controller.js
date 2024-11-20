import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
  const {channelId} = req.params
  // TODO: toggle subscription
  if(!isValidObjectId(channelId)) {
    throw new ApiError(404, "invalid channel id");
  }
    const subscribed = await Subscription.findOne({
      $and:[{channel:channelId}, {subscribed:req.user._id}],
    });
  if(!subscribed){
    const subscribe = await Subscription.create({
      subscriber:req.user._id,
      channel:channelId,
    });

    if(!subscribe){
      throw new ApiError(404, "erro while subscribing  channel");
    }
    return res.status(200).json(new ApiResponse(200, subscribe, "subscribed successfully!!"));
  }
})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  const {channelId} = req.params
  if(!isValidObjectId(channelId)) {
    throw new ApiError(404, "invalid channel id");
  }
  const subscriberList = await Subscription.aggregate([
    {
      $match: {
        channel: new mongoose.Types.ObjectId(subscriberId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "subscriber",
        foreignField: "_id",
        as: "subscriber",
        pipeline: [
          {
            $project: {
              username: 1,
              fullName: 1,
              avatar: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        subscriber: {
          $first: "$subscriber",
        },
      },
    },
    {
      $project: {
        subscriber: 1,
        createdAt: 1,
      },
    },
  ]);

  if(!subscriberList){
    throw new ApiError(404, "error while fetching subscriber list");
  }
  return res.status(200).json(new ApiResponse(200, subscriberList, "subscribers list fetched successfully!!"));
})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
  const { subscriberId } = req.params
  if(!isValidObjectId(channelId)) {
    throw new ApiError(404, "invalid channel id");
  }

  const channelList = await Subscription.aggregate([
    {
      $match: {
        subscriber: channelId,
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "channel",
        foreignField: "_id",
        as: "channel",
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
        channel: {
          $first: "$channel",
        },
      },
    },
    {
      $project: {
        channel: 1,
        createdAt: 1,
      },
    },
  ]);

  if(!channelList){
    throw new ApiError(404, "error while fetching channel list");
  }

  return res.status(200).json(new ApiResponse(200, channelList, "subscribed channel list fetched successfully!!"));
})

export {
  toggleSubscription,
  getUserChannelSubscribers,
  getSubscribedChannels
}