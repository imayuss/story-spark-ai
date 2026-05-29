import { Types } from "mongoose";
import { CommentService } from "../comment.service";
import { Comment } from "../comment.model";
import { Post } from "../../post/post.model";
import { User } from "../../user/user.model";
import { ITokenPayload } from "../../../../interfaces/token";

jest.mock("../comment.model", () => ({
  Comment: {
    create: jest.fn(),
    findOne: jest.fn(),
  },
}));

jest.mock("../../post/post.model", () => ({
  Post: {
    findOne: jest.fn(),
  },
}));

jest.mock("../../user/user.model", () => ({
  User: {
    findById: jest.fn(),
    findOne: jest.fn(),
  },
}));

const mockedComment = Comment as jest.Mocked<typeof Comment>;
const mockedPost = Post as jest.Mocked<typeof Post>;
const mockedUser = User as jest.Mocked<typeof User>;

const userId = new Types.ObjectId("507f1f77bcf86cd799439011");
const postId = new Types.ObjectId("507f1f77bcf86cd799439021");
const parentCommentId = new Types.ObjectId("507f1f77bcf86cd799439031");

const token = {
  _id: userId.toString(),
  email: "reader@example.com",
  role: "user",
} as ITokenPayload;

const buildPost = (commentsCount = 0) => ({
  _id: postId,
  commentsCount,
  save: jest.fn().mockResolvedValue(undefined),
});

describe("CommentService.createComment", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUser.findById.mockResolvedValue({
      _id: userId,
      email: "reader@example.com",
    } as never);
  });

  it("creates a reply when the parent comment belongs to the same post", async () => {
    const post = buildPost(2);
    const createdComment = {
      _id: new Types.ObjectId("507f1f77bcf86cd799439041"),
      postId,
      userId,
      parentCommentId,
      comment: "Same-post reply",
    };

    mockedPost.findOne.mockResolvedValue(post as never);
    mockedComment.findOne.mockResolvedValue({
      _id: parentCommentId,
      postId,
      parentCommentId: null,
    } as never);
    mockedComment.create.mockResolvedValue(createdComment as never);

    const result = await CommentService.createComment(
      {
        postId: postId.toString(),
        parentCommentId: parentCommentId.toString(),
        comment: "Same-post reply",
      },
      token,
    );

    expect(result).toBe(createdComment);
    expect(mockedComment.findOne).toHaveBeenCalledWith({
      _id: parentCommentId.toString(),
      postId: postId.toString(),
    });
    expect(mockedComment.create).toHaveBeenCalledWith(
      expect.objectContaining({
        postId,
        userId,
        comment: "Same-post reply",
        parentCommentId,
      }),
    );
    expect(post.commentsCount).toBe(3);
    expect(post.save).toHaveBeenCalledTimes(1);
  });

  it("rejects replies when the parent comment is not on the target post", async () => {
    const post = buildPost(4);

    mockedPost.findOne.mockResolvedValue(post as never);
    mockedComment.findOne.mockResolvedValue(null);

    await expect(
      CommentService.createComment(
        {
          postId: postId.toString(),
          parentCommentId: parentCommentId.toString(),
          comment: "Cross-post reply",
        },
        token,
      ),
    ).rejects.toThrow("Parent comment not found for this post!");

    expect(mockedComment.create).not.toHaveBeenCalled();
    expect(post.commentsCount).toBe(4);
    expect(post.save).not.toHaveBeenCalled();
  });

  it("rejects replies to replies so nested replies do not become invisible", async () => {
    const post = buildPost(1);

    mockedPost.findOne.mockResolvedValue(post as never);
    mockedComment.findOne.mockResolvedValue({
      _id: parentCommentId,
      postId,
      parentCommentId: new Types.ObjectId("507f1f77bcf86cd799439032"),
    } as never);

    await expect(
      CommentService.createComment(
        {
          postId: postId.toString(),
          parentCommentId: parentCommentId.toString(),
          comment: "Nested reply",
        },
        token,
      ),
    ).rejects.toThrow("Replies can only be added to top-level comments!");

    expect(mockedComment.create).not.toHaveBeenCalled();
    expect(post.commentsCount).toBe(1);
    expect(post.save).not.toHaveBeenCalled();
  });
});
