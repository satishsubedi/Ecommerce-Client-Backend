import {
  checkRecomendationModel,
  createRecomendationModel,
  getRecomendationModel,
  updatetRecomendationModel,
} from "../models/recommendation/RecomendationModel.js";
import { responseClient } from "../middleware/responseClient.js";
import mongoose from "mongoose";
export const createRecomendationController = async (req, res, next) => {
  try {
    const { userId, interactionId, productId, type } = req.body;

    if (userId) {
      // check if same interation is already in db
      const recomendation = await checkRecomendationModel({
        interactionId,
        productId,
        type,
        userId,
      });
      if (recomendation) {
        console.log(recomendation);
        //  update recomendation
        await updatetRecomendationModel(req.body, {
          $set: { updatedAt: Date.now() },
        });
        return responseClient({
          message: " updated",
          req,
          res,
        });
      } else {
        // add
        await createRecomendationModel(req.body);
        return responseClient({
          message: " added",
          req,
          res,
        });
      }
    }
  } catch (error) {
    next(error);
  }
};

// get reccomedation controller start here

const LAMBDA = 0.05;

const INTERACTION_WEIGHTS = { view: 1, cart: 2, purchase: 3, rating: 2.5 };

export const getRecomendationController = async (req, res, next) => {
  try {
    // 1. fetch the user interaction
    const userId = new mongoose.Types.ObjectId(req.params.userId);

    const match = { $match: { userId } }; //get all the interactions of the user with  userId
    const joinProductWithReccomendation = {
      //joining product and recomdation with matching record from step 1
      $lookup: {
        from: "products",
        localField: "productId",
        foreignField: "_id",
        as: "product",
      },
    };
    const destructureProduct = { $unwind: "$product" }; //destructure the product array
    // now apply the time decay
    const daysAgo = {
      $addFields: {
        daysAgo: {
          $divide: [
            { $subtract: [new Date(), "$updatedAt"] },
            1000 * 60 * 60 * 24,
          ],
        },
      },
    };
    // assign the weight based on type of interaction like view,purchase or add to cart
    const weight = {
      $addFields: {
        weight: {
          $switch: {
            branches: [
              {
                case: { $eq: ["$type", "view"] },
                then: INTERACTION_WEIGHTS.view,
              },
              {
                case: { $eq: ["$type", "cart"] },
                then: INTERACTION_WEIGHTS.cart,
              },
              {
                case: { $eq: ["$type", "purchase"] },
                then: INTERACTION_WEIGHTS.purchase,
              },
              {
                case: { $eq: ["$type", "rating"] },
                then: INTERACTION_WEIGHTS.rating,
              },
            ],
            default: 1,
          },
        },
      },
    };
    const timeDecayScore = {
      $addFields: {
        timeDecayScore: {
          $multiply: [
            "$weight",
            { $exp: { $multiply: [-LAMBDA, "$daysAgo"] } },
          ],
        },
      },
    };
    // now group the product category
    const groupProductCategory = {
      $group: {
        _id: "$product.categoryId", // group by product category
        totalScore: { $sum: "$timeDecayScore" }, // sum of scores
        productIds: { $addToSet: "$productId" }, // unique product IDs
        categoryId: { $addToSet: "$product.categoryId" }, // unique product IDs
        // unique product IDs
      },
    };
    const sortWithScore = { $sort: { totalScore: -1 } };
    const groupCategoriesAndinteractedProductIds = {
      $group: {
        _id: null,
        categories: { $push: { category: "$_id", score: "$totalScore" } },
        iteractedProducts: { $first: "$productIds" },
      },
    };
    const similarUserProducts = {
      $lookup: {
        from: "recomendations",
        let: { interacted: "$iteractedProducts" },
        pipeline: [
          { $match: { $expr: { $in: ["$productId", "$$interacted"] } } },
          { $group: { _id: "$userId", common: { $sum: 1 } } },
          { $sort: { common: -1 } },
          // { $limit: 10 },
        ],
        as: "similarUsers",
      },
    };

    const pipeline = [
      match,
      joinProductWithReccomendation,
      destructureProduct,
      daysAgo,
      weight,
      timeDecayScore,
      groupProductCategory,
      sortWithScore,
      groupCategoriesAndinteractedProductIds,
      similarUserProducts,
      {
        $set: {
          similarUserIds: {
            $map: { input: "$similarUsers", as: "u", in: "$$u._id" },
          },
        },
      },
      {
        $lookup: {
          from: "recommendations",

          let: {
            simUsers: "$similarUserIds",
            interacted: "$interactedProducts",
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $in: ["$userId", "$$simUsers"] },
                    { $not: [{ $in: ["$productId", "$$interacted"] }] },
                  ],
                },
              },
            },
            { $group: { _id: "$productId", cfScore: { $sum: 2 } } },
          ],
          as: "cfCandidates",
        },
      },
    ];

    const reult = await getRecomendationModel(pipeline);

    console.log(JSON.stringify(reult, null, 2));
  } catch (error) {
    next(error);
  }
};
// get reccomedation controller ends here
