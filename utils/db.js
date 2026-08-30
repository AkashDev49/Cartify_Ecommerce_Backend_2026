import mongoose from "mongoose";

const connectDB = async () => {
	try {
		await mongoose.connect(process.env.MONGO_URL, {
			dbName: "Ecommerce2026",
		});
		console.log("Mongodb connected");
	} catch (error) {
		console.log(error);
	}
};

export default connectDB;
