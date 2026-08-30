import express from "express";

const router = express.Router();

import { isAuth } from "../middleware/isAuth.js";

import {
	addAddress,
	deleteAddress,
	getAllAddress,
	getSingalAddress,
} from "../controllers/AddressContoller.js";

router.post("/address/new", isAuth, addAddress);
router.get("/address/all", isAuth, getAllAddress);
router.get("/address/:id", isAuth, getSingalAddress);
router.delete("/address/:id", isAuth, deleteAddress);

export default router;
