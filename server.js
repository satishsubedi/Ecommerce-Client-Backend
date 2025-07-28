import express from "express";
import { dbConnect } from "./src/config/dbconfig.js";

const app = express();
const PORT = process.env.PORT || 8001;

//Middlewares
import cors from "cors";
import morgan from "morgan";
import { errorHandler } from "./src/middleware/errorHandler.js";
app.use(cors()); // To enable CORS for all routes
app.use(morgan("dev")); // To log HTTP requests in the console
app.use(express.json()); // To parse incoming JSON requests and put the parsed data in req.body, so that we can access it in our route handlers

import authRoute from "./src/routes/authRoute.js";
import imageRoutes from "./src/routes/imageRoute.js";
import { responseClient } from "./src/middleware/responseClient.js";
import productRouter from "./src/routes/productRoutes.js";
import categoryRouter from "./src/routes/categoryRoutes.js";
import reviewRouter from "./src/routes/reviewRoute.js";
//API endpoints
//Auth Routes
app.use("/api/v1/auth", authRoute);
app.use("/api/v1/product", productRouter);
app.use("/api/v1/category", categoryRouter);
app.use("/api/v1/reviews", reviewRouter);

//end poins for image
app.use("/api/v1/all", imageRoutes);

app.use(errorHandler); // To handle errors globally in the application

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
// To define a route handler for GET requests to the root URL ("/"):
app.get("/", (req, res) => {
  const message = " Welcome to the server, Its LIVE now";
  responseClient({ req, res, message }); // To send a response to the client
});
