import { getRecomendationModel } from "../models/recommendation/RecomendationModel.js";

export const createRecomendationController = async (req, res, next) => {
  try {
    const { userId, interactionId, productId, type } = req.body;

    if (userId) {
      // check if same interation is already in db
      const recomendation = await getRecomendationModel({
        interactionId,
        productId,
        type,
        userId,
      });
      console.log(recomendation);
    }
  } catch (error) {
    next(error);
  }
};
