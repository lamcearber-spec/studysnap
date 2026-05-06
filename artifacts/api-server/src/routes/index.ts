import { Router, type IRouter } from "express";
import exercisesRouter from "./exercises";
import healthRouter from "./health";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/exercises", exercisesRouter);

export default router;
