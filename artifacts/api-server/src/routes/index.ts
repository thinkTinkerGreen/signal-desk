import { Router, type IRouter } from "express";
import healthRouter from "./health";
import signalsRouter from "./signals";
import portfolioRouter from "./portfolio";
import positionsRouter from "./positions";
import assetsRouter from "./assets";
import keysRouter from "./keys";
import ingestionRulesRouter from "./ingestionRules";
import ingestionLogRouter from "./ingestionLog";
import webhooksRouter from "./webhooks";
import marketRouter from "./market";

const router: IRouter = Router();

router.use(healthRouter);
router.use(signalsRouter);
router.use(portfolioRouter);
router.use(positionsRouter);
router.use(assetsRouter);
router.use(keysRouter);
router.use(ingestionRulesRouter);
router.use(ingestionLogRouter);
router.use(webhooksRouter);
router.use(marketRouter);

export default router;
