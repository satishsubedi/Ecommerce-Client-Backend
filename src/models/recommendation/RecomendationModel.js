import recomendationCollection from "./RecomendationSchema.js";

export const createRecomendationModel =async (obj)=>await recomendationCollection(obj).save()
 export const getRecomendationModel = async (obj)=>await recomendationCollection.findOne(obj)








