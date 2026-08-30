import { Cart } from "../models/Cart.js";
import { Product } from "../models/Product.js";
import tryCatch from "../utils/tryCatch.js";

export const addToCart = tryCatch(async (req, res) => {
	const { product } = req.body;

	const cart = await Cart.findOne({
		product: product,
		user: req.user._id,
	}).populate("product");
	// console.log(cart);

	if (cart) {
		if (cart.product.stock === cart.quantity) {
			return res.status(400).json({
				message: "Out of stock",
			});
		}
		cart.quantity = cart.quantity + 1;
		await cart.save();

		return res.json({
			message: "Added to cart",
		});
	}

	const cartProduct = await Product.findById(product);

	if (cartProduct.stock === 0)
		return res.status(400).json({
			message: "Out of stock",
		});

	await Cart.create({
		quantity: 1,
		product: product,
		user: req.user._id,
	});

	res.json({
		message: "Added to cart",
	});
});

export const removeFromCart = tryCatch(async (req, res) => {
	const cart = await Cart.findById(req.params.id);
	await Cart.deleteOne();

	res.json({
		message: "remove from cart",
	});
});

export const updateCart = tryCatch(async (req, res) => {
	const { action } = req.query;

	if (action === "inc") {
		const { id } = req.body;
		const cart = await Cart.findById(id).populate("product");

		if (cart.quantity < cart.product.stock) {
			cart.quantity++;
			await cart.save();
		} else {
			return res.status(400).json({
				message: "Out of stock",
			});
		}

		res.json({
			message: "cart update",
		});
	}
	if (action === "dec") {
		const { id } = req.body;
		const cart = await Cart.findById(id).populate("product");

		if (cart.quantity > 1) {
			cart.quantity--;
			await cart.save();
		} else {
			return res.status(400).json({
				message: "You have only one item in cart",
			});
		}

		res.json({
			message: "cart update",
		});
	}
});

export const fetchCart = tryCatch(async (req, res) => {
	const cart = await Cart.find({ user: req.user._id }).populate("product");

	const sumofQuantity = cart.reduce((total, item) => {
		return total + item.quantity;
	}, 0);

	let subTotal = 0;

	cart.forEach((i) => {
		const itemsubTotal = i.product.price * i.quantity;
		subTotal += itemsubTotal;
	});

	// console.log(cart);
	// console.log(subTotal);
	// console.log(sumofQuantity);

	res.json({
		cart,
		subTotal,
		sumofQuantity,
	});
});
