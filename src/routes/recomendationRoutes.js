import express from "express";
import { createRecomendationController } from "../controllers/recomendationController.js";

const recomendationRouter = express.Router();
recomendationRouter.post("/", createRecomendationController);

export default recomendationRouter;
