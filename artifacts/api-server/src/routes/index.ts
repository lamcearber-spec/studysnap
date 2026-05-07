import { Router, type IRouter } from "express";
import exercisesRouter from "./exercises";
import healthRouter from "./health";
import usageRouter from "./usage";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/exercises", exercisesRouter);
router.use(usageRouter);

export default router;
