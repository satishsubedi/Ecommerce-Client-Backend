import {
  createNewUser,
  getUserByEmail,
  updateUser,
} from "../models/User/UserModel.js";
import { comparePassword, hashpassword } from "../utils/bcrypt.js";
import { v4 as uuidv4 } from "uuid";
import { responseClient } from "../middleware/responseClient.js";
import {
  createNewSession,
  deleteSession,
} from "../models/Session/SessionModel.js";
import {
  userActivatedNotificationEmail,
  userActivationUrlEmail,
  userResetPasswordEmail,
} from "../services/email/emailService.js";
import { getJwts } from "../utils/jwt.js";

// Register(SignUp) of new user.
export const insertNewUser = async (req, res, next) => {
  try {
    console.log(req.body, "aaa");
    //Receive the user Data
    const { password } = req.body;
    //Encrypt the password using bcrypt, before inserting into the database
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
        //Create url to send to client email for activation.
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

// Login User
export const loginUser = async (req, res, next) => {
  try {
    //Destructure email and password from req.body
    const { email, password } = req.body;

    //Get user by email
    const user = await getUserByEmail(email);

    if (user?._id) {
      //Compare the password
      const isPassMatch = comparePassword(password, user.password);

      if (isPassMatch) {
        console.log("User authenticated succesfully...!");

        // Create JWTs, so that server can validate through these tokens, instead of asking for username and password
        const jwts = await getJwts(email);

        // Response jwts
        return responseClient({
          req,
          res,
          message: "Login successful...!",
          payload: jwts,
        });
      }
    }
    const message = " Invalid Login details !!";
    const statusCode = 401;
    responseClient({ req, res, message, statusCode });
  } catch (error) {
    next(error);
  }
};

//Get the user info
export const getUser = async (req, res) => {
  console.log(req, "134");
  try {
    responseClient({
      req,
      res,
      message: "User info fetched successfully",
      payload: req.userInfo, // req.userInfo is set by userAuthMiddleware
    });
  } catch (error) {
    responseClient({
      req,
      res,
      message: error.message || "Unable to get user info",
      statusCode: error.statusCode || 500,
    });
  }
};

//Forgot password
export const forgotPassword = async (req, res) => {
  try {
    //Check if user exists
    const user = await getUserByEmail(req.body.email);
    // If user is not found
    if (!user?._id) {
      return responseClient({
        req,
        res,
        message: "User not found",
        statusCode: 404,
      });
    }
    // If user exist
    if (user?._id) {
      // If user found, send  verification email
      const secureId = uuidv4();

      //Store this secureId in session storage for that user
      const newUserSession = await createNewSession({
        token: secureId,
        association: user.email,
        expiry: new Date(Date.now() + 3 * 60 * 60 * 1000), // Session expires in 3 hrs
      });
      if (newUserSession?._id) {
        const resetPasswordUrl = `${process.env.ROOT_URL}/change-password?e=${user.email}&id=${secureId}`;

        //Send mail to user
        userResetPasswordEmail({
          name: user.fName,
          email: user.email,
          resetPasswordUrl,
        });
      }
      responseClient({
        req,
        res,
        payload: {},
        message: "Check your inbox/spam to reset your password",
      });
    }
  } catch (error) {
    console.log(error.message);
    responseClient({ req, res, message: error.message, statusCode: 500 });
  }
};

// Reset password
export const resetPassword = async (req, res) => {
  try {
    const { formData, token, email } = req.body;
    console.log("req.body : ", req.body);

    const user = await getUserByEmail(email);

    //Delete token from session table after password reset, for one time click.
    const sessionToken = await deleteSession({ token, association: email });
    console.log("session token : ", sessionToken);
    if (user && sessionToken) {
      const { password } = formData;
      const encryptedPassword = hashpassword(password);
      const updatedUser = await updateUser(
        { email },
        { password: encryptedPassword }
      );
      responseClient({
        req,
        res,
        message: "Password reset successfully. You can login now.",
        payload: updatedUser,
      });
    } else {
      responseClient({
        req,
        res,
        message: "Invalid request or token expired. Please try again.",
        statusCode: 400,
      });
    }
  } catch (error) {
    responseClient({ req, res, message: error.message, statusCode: 500 });
  }
};

// Logout user
export const logoutUser = async (req, res) => {
  try {
    const { email } = req.body;
    const { authorization } = req.headers;

    if (!authorization) {
      return responseClient({
        req,
        res,
        message: "Authorization token missing",
        statusCode: 401,
      });
    }

    const token = authorization.split(" ")[1];
    //Remove session for the user
    const result = await deleteSession({
      token,
      association: email,
    });

    //Use ternary operator to hanle succes or failure
    result
      ? responseClient({ req, res, message: "User logged out successfuly..!" })
      : responseClient({
          req,
          res,
          message: "Session not found or already deleted..",
          statusCode: 500,
        });
  } catch (error) {
    responseClient({ req, res, message: error.message, statusCode: 500 });
  }
};
