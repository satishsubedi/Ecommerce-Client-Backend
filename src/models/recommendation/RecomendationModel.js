import recomendationCollection from "./RecomendationSchema.js";

export const createRecomendationModel = async (obj) =>
  await recomendationCollection(obj).save();
export const getRecomendationModel = async (p) =>
  await recomendationCollection.aggregate(p).exec();
export const checkRecomendationModel = async (obj) => 
await recomendationCollection.findOne(obj);

export const updatetRecomendationModel = async (filter, update) =>
  await recomendationCollection.findOneAndUpdate(filter, update, { new: true });
