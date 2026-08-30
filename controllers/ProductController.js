import tryCatch from "../utils/tryCatch.js";
import bufferGen from "../utils/bufferGen.js";
import cloudnairy from "cloudinary";
import { Product } from "../models/Product.js";

export const createProudct = tryCatch(async (req, res) => {
	if (req.user.role !== "admin") {
		return res.status(403).json({
			message: "Unauthraised",
		});
	}

	const { title, description, category, price, stock } = req.body;

	const files = req.files;

	if (!files || files.length === 0) {
		return res.status(400).json({
			message: "no file to upload",
		});
	}

	const imageUploadPromises = files.map(async (file) => {
		const fileBuffer = bufferGen(file);

		const result = await cloudnairy.v2.uploader.upload(fileBuffer.content);
		return {
			id: result.public_id,
			url: result.secure_url,
		};
	});

	const uploadedImage = await Promise.all(imageUploadPromises);

	const createProduct = await Product.create({
		title,
		description,
		category,
		price,
		stock,
		images: uploadedImage,
	});

	res.status(201).json({
		message: "Product create successfully",
	});
});

export const getAllProduct = tryCatch(async (req, res) => {
	const { search, category, page, sortByPrice } = req.query;

	const filter = {};

	if (search) {
		filter.title = {
			$regex: search,
			$options: "i",
		};
	}

	if (category) {
		filter.category = category;
	}

	const limit = 8;
	const skip = (page - 1) * limit;

	let sortOption = { createdAt: -1 };

	if (sortByPrice) {
		if (sortByPrice === "lowToHigh") {
			sortOption = {
				price: 1,
			};
		} else if (sortByPrice === "highToLow") {
			sortOption = { price: -1 };
		}
	}

	const allProducts = await Product.find(filter)
		.sort(sortOption)
		.limit(limit)
		.skip(skip);

	const categories = await Product.distinct("category");

	const newProduct = await Product.find().sort("-createdAt").limit(4);

	const countProduct = await Product.countDocuments();

	const totalPages = Math.ceil(countProduct / limit);

	res.json({
		allProducts,
		categories,
		totalPages,
		newProduct,
	});
});

export const getSingleProduct = tryCatch(async (req, res) => {
	const product = await Product.findById(req.params.id);

	const relatedProd = await Product.find({
		category: product.category,
		_id: { $ne: product._id },
	}).limit(4);

	res.json({
		product,
		relatedProd,
	});
});

export const updateProduct = tryCatch(async (req, res) => {
	if (req.user.role !== "admin") {
		return res.status(403).json({
			message: "you are not admin",
		});
	}

	const { title, description, stock, price, category } = req.body;

	const updateFiles = {};

	if (title) updateFiles.title = title;
	if (description) updateFiles.description = description;
	if (stock) updateFiles.stock = stock;
	if (category) updateFiles.category = category;
	if (price) updateFiles.price = price;

	const updateProd = await Product.findByIdAndUpdate(
		req.params.id,
		updateFiles,
		{ new: true, runValidators: true },
	);

	if (!updateProd) {
		return res.status(404).json({
			message: "product not found",
		});
	}

	res.json({
		message: "product updated",
		updateProd,
	});
});

export const updateImage = tryCatch(async (req, res) => {
	if (req.user.role !== "admin") {
		return res.status(403).json({
			message: "you are not admin",
		});
	}

	const files = req.files;

	if (!files || files.length === 0) {
		return res.status(400).json({
			message: "no file to upload",
		});
	}

	const product = await Product.findById(req.params.id);
	// console.log(product.stock);

	if (!product) {
		return res.status(404).json({
			message: "product not found",
		});
	}

	const oldimg = product.images || [];

	for (const img of oldimg) {
		if (img.id) {
			await cloudnairy.v2.uploader.destroy(img.id);
		}
	}

	const imageUploadPromises = files.map(async (file) => {
		const fileBuffer = bufferGen(file);

		const result = await cloudnairy.v2.uploader.upload(fileBuffer.content);
		return {
			id: result.public_id,
			url: result.secure_url,
		};
	});

	const uploadImages = await Promise.all(imageUploadPromises);

	product.images = uploadImages;
	await product.save();

	res.status(200).json({
		message: "image upadated",
		product,
	});
});
