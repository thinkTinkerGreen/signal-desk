import { Router, type IRouter } from "express";
import healthRouter from "./health";
import signalsRouter from "./signals";
import portfolioRouter from "./portfolio";
import positionsRouter from "./positions";
import assetsRouter from "./assets";

const router: IRouter = Router();

router.use(healthRouter);
router.use(signalsRouter);
router.use(portfolioRouter);
router.use(positionsRouter);
router.use(assetsRouter);

export default router;
