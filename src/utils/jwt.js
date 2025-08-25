import { createNewSession } from "../models/Session/SessionModel.js";
import { updateUser } from "../models/User/UserModel.js";
import jwt from "jsonwebtoken";

// Generate accessJWT
export const createAccessJWT = async (userId) => {
  // Create
  const token = jwt.sign({ id: userId }, process.env.ACCESSJWT_SECRET, {
    expiresIn: "3h",
  });
  // Store in Session Table
  const obj = {
    token,
    association: userId,
    expire: new Date(Date.now() + 3 * 60 * 60 * 1000), // 3 Hr expiry.
  };
  const newSession = await createNewSession(obj);
  return newSession?._id ? token : null;
};
//Decode accessJWT
export const verifyAccessJWT = (token) => {
  try {
    return jwt.verify(token, process.env.ACCESSJWT_SECRET); // It will return the decoded token if valid
  } catch (error) {
    return error.message;
  }
};

// Generate Refresh JWT
export const createRefreshJWT = async (userId) => {
  // Create
  const refreshJWT = jwt.sign({ id: userId }, process.env.REFRESHJWT_SECRET, {
    expiresIn: "30d",
  });
  // Update in User Table
  const user = await updateUser({ _id: userId }, { refreshJWT });
  return user?._id ? refreshJWT : null;
};

//Decode refreshJWT
export const verifyRefreshJWT = (token) => {
  try {
    jwt.verify(token, process.env.REFRESHJWT_SECRET);
  } catch (error) {
    return error.message;
  }
};
export const getJwts = async (userId) => {
  return {
    accessJWT: await createAccessJWT(userId),
    refreshJWT: await createRefreshJWT(userId),
  };
};
