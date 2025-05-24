import UserSchema from "./UserSchema.js";

//Insert new user
export const createNewUser = (userObj) => {
  return UserSchema(userObj).save();
};
