import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";
import { User } from "../models/user.model.js";

const defaultUsers = [
    { username: "admin", password: "Admin@123", role: "admin" },
    { username: "receptionist", password: "Recept@123", role: "receptionist" },
];

const seedDefaultUsers = async () => {
    for (const userData of defaultUsers) {
        const exists = await User.findOne({ username: userData.username });
        if (!exists) {
            const user = new User(userData);
            await user.save();
            console.log(`✅ Default user created: ${user.username} (${user.role})`);
        }
    }
};

const connectDB = async () => {
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
        console.log(`\n MongoDB connected !! DB HOST: ${connectionInstance.connection.host}`);
        console.log('Mongoose defaultDB:', mongoose.connection.name);

        await seedDefaultUsers();
    } catch (error) {
        console.log("MONGODB connection FAILED ", error);
        return Promise.reject(error);
    }
};

export default connectDB;