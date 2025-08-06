import productCollection from "./ProductSchema.js";

export const getProductsByCategoryId = async (filter) =>
  await productCollection.find(filter);
export const getProductById = async (filter) => {
  return await productCollection.findById(filter);
};
export const getProductBySlug = async (filter) => {
  return await productCollection.findOne(filter);
};
export const getAllProducts = async () => await productCollection.find();
export const getAllProductsByPath = async (filter) => {
  return await productCollection.find(filter);
};
export const updateProductsRating = async (filter, update) => {
  return await productCollection.findByIdAndUpdate(filter, update, {
    new: true,
  });
};
