import { responseClient } from "../middleware/responseClient.js";
import {
  getReviewById,
  postReview,
  updateReview,
} from "../models/Reviews/ReviewsModel.js";

export const postReviewController = async (req, res, next) => {
  console.log(req.body);

  try {
    const review = await postReview(req.body);

    review?._id
      ? responseClient({
          req,
          res,
          message: "Thank you,your review has submitted succefully😊 ",
        })
      : responseClient({
          req,
          res,
          statusCode: 400,
          message:
            "something went wrong, review could not be created.Try again later!",
        });
  } catch (error) {
    next(error);
  }
};
export const getProductReviewController = async (req, res, next) => {
  try {
    const productReviewList = await getReviewById(req.params);
    console.log(productReviewList);
  } catch (error) {
    next(error);
  }
};
