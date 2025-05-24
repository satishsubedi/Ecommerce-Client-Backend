import {
  ADDRESS_REQUIRED,
  EMAIL_REQUIRED,
  FNAME_REQUIRED,
  LNAME_REQUIRED,
  PASSWORD_REQUIRED,
  PHONE_REQUIRED,
} from "./joiConst.js";
import { validateData } from "./joiValidation.js";

export const newUserDataValidation = (req, res, next) => {
  const obj = {
    fName: FNAME_REQUIRED,
    lName: LNAME_REQUIRED,
    email: EMAIL_REQUIRED,
    password: PASSWORD_REQUIRED,
    phone: PHONE_REQUIRED,
    address: ADDRESS_REQUIRED,
  };
  validateData({ req, res, next, obj });
};
