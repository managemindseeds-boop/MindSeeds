import { Router } from "express";
import { testScheduleReminder } from "../controllers/notification.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();
router.use(verifyJWT);

// POST /api/v1/notifications/test-schedule
// → Test: N minutes baad schedule karo — { phone, name, minutesFromNow }
router.post("/test-schedule", testScheduleReminder);

export default router;
