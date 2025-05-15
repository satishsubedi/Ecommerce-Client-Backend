import express from "express";
import { dbConnect } from "./src/config/dbconfig.js";

const app = express();
const PORT = process.env.PORT || 8001;

//DB Connection and Server status
dbConnect()
  .then(() => {
    /** ready to use. The `mongoose.connect()` promise resolves to mongoose
    instance. */
    app.listen(PORT, (error) => {
      return !error
        ? console.log(`server is running at http://localhost:${PORT}`)
        : console.log(error);
    });
  })
  .catch((error) => console.log(error));
app.get("/", (req, res) => res.send("<h2>Client Api is up</h2>")); // To define a route handler for GET requests to the root URL ("/").
