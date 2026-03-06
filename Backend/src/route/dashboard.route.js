import { Router } from "express";
import { getDashboardData } from "../controllers/dashboard.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// GET /api/v1/dashboard  — dashboard ka sara data ek saath
router.get("/", verifyJWT, getDashboardData);

export default router;
