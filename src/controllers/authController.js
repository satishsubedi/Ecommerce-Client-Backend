import { createNewUser } from "../models/User/UserModel.js";
import { hashpassword } from "../utils/bcrypt.js";

export const insertNewUser = async (req, res, next) => {
  try {
    // TODO SignUp process

    //Receive the user Data
    const { password } = req.body;
    //Encrypt the password
    req.body.password = hashpassword(password);
    //Create and send unique activation link to the user for email verification

    //Insert the user in the database
    const user = await createNewUser(req.body);
    if (user?._id) {
      return res.status(201).json({
        message: "User created successfully",
        user, // This will return the user object with all the fields
      });
    }
    throw new Error("Unable to create an account. Try again later..");
  } catch (error) {
    next(error);
  }
};
