import ApiError from "../../../errors/api_error";
import { ITokenPayload } from "../../../interfaces/token";
import { User } from "../user/user.model";
import httpStatus from "http-status";
import { Reaction } from "./reaction.model";
import { Types } from "mongoose";
import { Post } from "../post/post.model";

const toggleReaction = async (
  postId: string,
  type: string = "like",
  token: ITokenPayload
) => {
  const { email } = token;
  const user = await User.findOne({ email });
  if (!user) {
    throw new ApiError(httpStatus.BAD_REQUEST, "User not found!");
  }
  const post = await Post.findOne({ _id: postId, isDeleted: { $ne: true } });
  if (!post) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Post not found!");
  }

  const existingReaction = await Reaction.findOne({
    postId: new Types.ObjectId(postId),
    userId: user._id,
  });

  let message = "";

  if (existingReaction) {
    if (existingReaction.type === type) {
      await Reaction.deleteOne({ _id: existingReaction._id });
      message = "Reaction removed successfully";
    } else {
      existingReaction.type = type as "like" | "love" | "laugh" | "angry" | "sad";
      await existingReaction.save();
      message = "Reaction updated successfully";
    }
  } else {
    await Reaction.create({
      postId: new Types.ObjectId(postId),
      userId: user._id,
      type: type as "like" | "love" | "laugh" | "angry" | "sad",
    });
    message = "Reaction added successfully";
  }

  const likesCount = await Reaction.countDocuments({
    postId: new Types.ObjectId(postId),
    type: "like",
  });

  return { message, likesCount };
};

export const ReactionService = {
  toggleReaction,
};
