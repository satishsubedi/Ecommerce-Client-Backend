import { getSession } from "../models/Session/SessionModel.js";
import { getOneUser, getUserByEmail } from "../models/User/UserModel.js";
import {
  createAccessJWT,
  verifyAccessJWT,
  verifyRefreshJWT,
} from "../utils/jwt.js";
import { responseClient } from "./responseClient.js";

export const userAuthMiddleware = async (req, res, next) => {
  const { authorization } = req.headers;
  let message = "Unauthorized";

  try {
    if (authorization) {
      const token = authorization.startsWith("Bearer")
        ? authorization.split(" ")[1]
        : authorization;

      const decoded = await verifyAccessJWT(token);

      if (decoded.id) {
        const tokenSession = await getSession({ token });

        if (tokenSession?._id) {
          const user = await getOneUser({ _id: decoded.id }); // Look up by id

          if (user?._id && user.status === "active") {
            req.userInfo = user;
            return next();
          }
        }
      }

      message = decoded === "jwt expired" ? decoded : "Unauthorized";
    }
  } catch {
    message = "Server error";
  }

  responseClient({ req, res, message, statusCode: 401 });
};

export const renewAccessJWTMiddleware = async (req, res) => {
  const { authorization } = req.headers;
  let message = "Unauthorized";

  if (authorization) {
    const token = authorization.startsWith("Bearer ")
      ? authorization.split(" ")[1]
      : authorization;

    const decoded = await verifyRefreshJWT(token);
    if (decoded.id) {
      //Use id instead of email
      const user = await getOneUser({
        _id: decoded.id,
        refreshJWT: token,
      });
      if (user?._id) {
        const newToken = await createAccessJWT(decoded.id);
        return responseClient({
          req,
          res,
          message: "Here is the accessJWT",
          payload: newToken,
        });
      }
    }
  }

  responseClient({ req, res, message, statusCode: 401 });
};
