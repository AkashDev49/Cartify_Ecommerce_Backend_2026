import tryCatch from "../utils/tryCatch.js";
import { Otp } from "../models/Otp.js";
import User from "../models/User.js";
import sendOtp from "../utils/otpSend.js";
import jwt from "jsonwebtoken";

export const loginUser = tryCatch(async (req, res) => {
	const { email } = req.body;
	const subject = "Ecommerce App";

	const otp = Math.floor(Math.random() * 1000000);
	const prevOtp = await Otp.findOne({ email });

	if (prevOtp) {
		await prevOtp.deleteOne();
	}

	await sendOtp({ email, subject, otp });
	await Otp.create({ email, otp });

	res.json({
		message: "OTP send to your mail",
	});
});

export const verifyUser = tryCatch(async (req, res) => {
	const { email, otp } = req.body;
	const haveOtp = await Otp.findOne({ email, otp });

	if (!haveOtp) {
		return res.status(400).json({
			message: "Wrong otp",
		});
	}

	let user = await User.findOne({ email });
	if (user) {
		const token = jwt.sign({ _id: user._id }, process.env.SECERT, {
			expiresIn: "15d",
		});
		await haveOtp.deleteOne();

		res.json({
			message: "User login successfully",
			token,
			user,
		});
	} else {
		user = await User.create({
			email,
		});

		const token = jwt.sign({ _id: user._id }, process.env.SECERT, {
			expiresIn: "15d",
		});
		await haveOtp.deleteOne();

		res.json({
			message: "User login successfully",
			token,
			user,
		});
	}
});

export const myProfile = tryCatch(async (req, res) => {
	const user = await User.findById(req.user._id);
	res.json(user);
});
