import { Order } from "../models/Order.js";
import { Cart } from "../models/Cart.js";
import tryCatch from "../utils/tryCatch.js";
import { Product } from "../models/Product.js";
import sendOrderMail from "../utils/sendOrderConfirmation.js";
import Stripe from "stripe";
import dotenv from "dotenv";
dotenv.config();

export const newOrderCod = tryCatch(async (req, res) => {
	const { method, phone, address } = req.body;

	const cart = await Cart.find({ user: req.user._id }).populate({
		path: "product",
		select: "title price",
	});

	if (!cart.length) {
		return res.status(400).json({
			message: "Cart is empty",
		});
	}

	let subTotal = 0;

	const items = cart.map((val) => {
		const itemsSubTotal = val.product.price * val.quantity;

		subTotal += itemsSubTotal;
		return {
			product: val.product._id,
			name: val.product.title,
			price: val.product.price,
			quantity: val.quantity,
		};
	});

	const order = await Order.create({
		items,
		method,
		user: req.user._id,
		phone,
		address,
		subTotal,
	});

	for (const item of order.items) {
		const product = await Product.findById(item.product);

		if (product) {
			product.stock -= item.quantity;
			product.sold += item.quantity;

			await product.save();
		}
	}

	await Cart.deleteMany({ user: req.user._id });
	await sendOrderMail({
		email: req.user.email,
		subject: "Order confirmation",
		orderId: order._id,
		products: items,
		totalAmt: subTotal,
	});

	res.json({
		message: "order created success",
		order,
	});
});

export const getOrders = tryCatch(async (req, res) => {
	const orders = await Order.find({ user: req.user._id });

	res.json({
		orders: orders.reverse(),
	});
});

export const getAllOrdersAdmin = tryCatch(async (req, res) => {
	if (req.user.role !== "admin") {
		return res.status(403).json({
			message: "You are not admin",
		});
	}

	const orders = await Order.find().populate("user").sort({ createdAt: -1 });
	res.json({
		orders,
	});
});

export const getMyOrder = tryCatch(async (req, res) => {
	const order = await Order.findById(req.params.id)
		.populate("items.product")
		.populate("user");

	res.json({
		order,
	});
});

export const updateStatus = tryCatch(async (req, res) => {
	if (req.user.role !== "admin") {
		return res.status(403).json({
			message: "You are not admin",
		});
	}

	const order = await Order.findById(req.params.id);
	const { status } = req.body;

	order.status = status;

	await order.save();
	res.json({
		message: "Order status updated",
		order,
	});
});

export const getStats = tryCatch(async (req, res) => {
	if (req.user.role !== "admin") {
		return res.status(403).json({
			message: "You are not admin",
		});
	}
	const cod = await Order.find({ method: "cod" }).countDocuments();
	const onlineOrder = await Order.find({ method: "online" }).countDocuments();

	const products = await Product.find();
	const data = products.map((val) => ({
		name: val.title,
		sold: val.sold,
	}));

	res.json({
		cod,
		onlineOrder,
		data,
	});
});

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const newOrderOnline = tryCatch(async (req, res) => {
	try {
		const { method, phone, address } = req.body;
		const cart = await Cart.find({ user: req.user._id }).populate("product");

		if (!cart.length) {
			return res.status(400).json({
				message: "Cart is empty",
			});
		}

		const subTotal = cart.reduce((total, item) => {
			return total + item.product.price * item.quantity;
		}, 0);

		const lineItems = cart.map((item) => ({
			price_data: {
				currency: "inr",
				product_data: {
					name: item.product.title,
					images: [item.product.images[0].url],
				},

				unit_amount: Math.round(item.product.price * 100),
			},
			quantity: item.quantity,
		}));

		const session = await stripe.checkout.sessions.create({
			// PaymentMethodChangeEvent: ["card"],
			payment_method_types: ["card"],
			line_items: lineItems,
			mode: "payment",
			success_url: `${process.env.Frontend_URL}/ordersuccess?session_id={CHECKOUT_SESSION_ID}`,
			cancel_url: `${process.env.Frontend_URL}/cart`,
			metadata: {
				userId: req.user._id.toString(),
				method,
				phone,
				address,
				subTotal,
			},
		});

		res.json({
			url: session.url,
		});
	} catch (error) {
		console.log("Error Stripe: ", error.message);
		res.status(500).json({
			message: "Failed to create payment session",
		});
	}
});

export const verifyPayment = async (req, res) => {
	const { sessionId } = req.body;
	try {
		const session = await stripe.checkout.sessions.retrieve(sessionId);

		if (session.payment_status !== "paid") {
			return res.status(400).json({
				message: "Payment not completed",
			});
		}

		const { userId, method, phone, address, subTotal } = session.metadata;
		const cart = await Cart.find({ user: userId }).populate("product");

		const items = cart.map((item) => {
			return {
				product: item.product._id,
				name: item.product.title,
				price: item.product.price,
				quantity: item.quantity,
			};
		});

		if (cart.length === 0) {
			return res.status(400).json({
				message: "Cart is empty",
			});
		}

		const existingOrder = await Order.findOne({ paymentInfo: sessionId });

		if (!existingOrder) {
			const order = await Order.create({
				items: cart.map((i) => ({
					product: i.product._id,
					quantity: i.quantity,
				})),

				method,
				user: userId,
				phone,
				address,
				subTotal,
				paidAt: new Date(),
				paymentInfo: sessionId,
			});

			for (const item of order.items) {
				const product = await Product.findById(item.product);

				if (product) {
					product.stock -= item.quantity;
					product.sold += item.quantity;

					await product.save();
				}
			}

			await Cart.deleteMany({ user: userId });
			await sendOrderMail({
				email: req.user.email,
				subject: "Order confirmation",
				orderId: order._id,
				products: items,
				totalAmt: subTotal,
			});

			return res.status(200).json({
				success: true,
				message: "Order Created Successfully",
				order,
			});
		}
	} catch (error) {
		console.log("error find in payment", error.message);
		res.status(500).json({
			message: error.message,
		});
	}
};
