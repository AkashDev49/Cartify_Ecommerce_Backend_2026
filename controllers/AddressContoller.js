import { Address } from "../models/Address.js";
import tryCatch from "../utils/tryCatch.js";

export const addAddress = tryCatch(async (req, res) => {
	const { address, phone } = req.body;

	await Address.create({ address, phone, user: req.user._id });

	res.status(201).json({
		message: "Address create successfully",
	});
});

export const getAllAddress = tryCatch(async (req, res) => {
	const allAddress = await Address.find({ user: req.user._id });
	res.json({
		allAddress,
	});
});

export const getSingalAddress = tryCatch(async (req, res) => {
	const { id } = req.params;
	const findAddress = await Address.findById(id);
	res.json(findAddress);
});

export const deleteAddress = tryCatch(async (req, res) => {
	const address = await Address.findOne({
		_id: req.params.id,
		user: req.user._id,
	});

	await Address.deleteOne();

	res.json({
		message: "Address Deleted",
	});
});
