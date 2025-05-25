import { createNewUser, updateUser } from "../models/User/UserModel.js";
import { hashpassword } from "../utils/bcrypt.js";
import { v4 as uuidv4 } from "uuid";
import { responseClient } from "../middleware/responseClient.js";
import {
  createNewSession,
  deleteSession,
} from "../models/Session/SessionModel.js";
import {
  userActivatedNotificationEmail,
  userActivationUrlEmail,
} from "../services/email/emailService.js";

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
    // Create and send unique activation link to the user for email verification
    if (user?._id) {
      const session = await createNewSession({
        token: uuidv4(),
        association: user.email,
      });
      if (session?._id) {
        const url = `${process.env.ROOT_URL}/activate-user?sessionId=/${session._id}&t=${session.token}`;
        // Send this url to their email
        const emailId = await userActivationUrlEmail({
          email: user.email,
          url,
          name: user.fName,
        });

        if (emailId) {
          const message =
            " We have sent an activation link to your email. Please check your inbox and activate your account.";
          return responseClient({ req, res, message });
        }
      }
    }
    throw new Error("Unable to create an account. Try again later..");
  } catch (error) {
    if (error.message.includes("duplicate key error")) {
      error.message =
        "Email already exists. Please try with a different email.";
      error.statusCode = 409; // Conflict
    }
    next(error);
  }
};
export const activateUser = async (req, res, next) => {
  try {
    const { sessionId, t } = req.body;
    const session = await deleteSession({
      _id: sessionId,
      token: t,
    });
    if (session?._id) {
      //Update the user status to active
      const user = await updateUser(
        { email: session.association },
        { status: "active" }
      );
      if (user?._id) {
        //Send email notification to the user
        userActivatedNotificationEmail({ email: user.email, name: user.fName });
        const message =
          "Your account has been activated successfully. You may login now.";
        return responseClient({ req, res, message });
      }
    }
    const message =
      "Invalid activation link or token expired. Please try again.";
    const statusCode = 400; // Bad Request
    responseClient({ req, res, message, statusCode });
  } catch (error) {
    next(error);
  }
};
