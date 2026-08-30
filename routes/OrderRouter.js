import express from "express";
import { isAuth } from "../middleware/isAuth.js";
import {
	getAllOrdersAdmin,
	getMyOrder,
	getOrders,
	getStats,
	newOrderCod,
	newOrderOnline,
	updateStatus,
	verifyPayment,
} from "../controllers/OrderContoller.js";
const router = express.Router();

router.post("/order/new/cod", isAuth, newOrderCod);
router.get("/order/all", isAuth, getOrders);
router.get("/order/admin", isAuth, getAllOrdersAdmin);
router.get("/order/stats", isAuth, getStats);
router.get("/order/:id", isAuth, getMyOrder);
router.post("/order/:id", isAuth, updateStatus);
router.post("/order/new/online", isAuth, newOrderOnline);
router.post("/order/verify/payment", isAuth, verifyPayment);

export default router;
