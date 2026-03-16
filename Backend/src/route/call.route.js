import { Router } from "express";
import {
    getCalls,
    getPendingCallsCount,
    markCallDone,
    reopenCall,
} from "../controllers/call.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();
router.use(verifyJWT);

router.get("/", getCalls);                      // GET ?status=pending|done|all
router.get("/count", getPendingCallsCount);     // GET pending count for badge
router.patch("/:id/done", markCallDone);        // PATCH mark as done
router.patch("/:id/reopen", reopenCall);        // PATCH reopen

export default router;
