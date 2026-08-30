import express from "express";
import { isAuth } from "../middleware/isAuth.js";
import {
	createProudct,
	getAllProduct,
	getSingleProduct,
	updateImage,
	updateProduct,
} from "../controllers/ProductController.js";
import uplaodFiles from "../middleware/multer.js";

const router = express.Router();

router.post("/product/new", isAuth, uplaodFiles, createProudct);
router.get("/product/items", getAllProduct);
router.get("/product/:id", getSingleProduct);
router.patch("/product/:id", isAuth, updateProduct);
router.post("/product/:id", isAuth, uplaodFiles, updateImage);

export default router;
