import express from "express";
import {
	loginUser,
	myProfile,
	verifyUser,
} from "../controllers/UserController.js";
import { isAuth } from "../middleware/isAuth.js";

const router = express.Router();

router.post("/user/login", loginUser);
router.post("/user/verify", verifyUser);
router.get("/user/me", isAuth, myProfile);

export default router;
