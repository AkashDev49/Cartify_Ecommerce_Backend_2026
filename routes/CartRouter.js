import express from "express";
import {
	addToCart,
	fetchCart,
	removeFromCart,
	updateCart,
} from "../controllers/CartController.js";
import { isAuth } from "../middleware/isAuth.js";
const router = express.Router();

router.post("/cart/add", isAuth, addToCart);
router.get("/cart/remove/:id", isAuth, removeFromCart);
router.post("/cart/update", isAuth, updateCart);
router.get("/cart/all", isAuth, fetchCart);

export default router;
