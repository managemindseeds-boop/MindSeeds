import { Router } from "express";
import { addStudent, getAllStudents } from "../controllers/student.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// All student routes require authentication
router.use(verifyJWT);

router.post("/add", addStudent);
router.get("/", getAllStudents);

export default router;
