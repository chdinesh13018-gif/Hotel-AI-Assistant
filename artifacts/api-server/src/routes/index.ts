import { Router, type IRouter } from "express";
import healthRouter from "./health";
import hotelRouter from "./hotel";
import bookingsRouter from "./bookings";
import geminiRouter from "./gemini";

const router: IRouter = Router();

router.use(healthRouter);
router.use(hotelRouter);
router.use(bookingsRouter);
router.use(geminiRouter);

export default router;
