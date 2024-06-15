import mongoose from 'mongoose';
import ServerError from '../utils/errors/ServerError';
import { MongoClient, ServerApiVersion } from 'mongodb';
class Database {
    ConnectMongoDB = async () => {
        try {
            const MONGODB_TIMEOUT = Number(process.env.MONGODB_CONNECT_TIMEOUT);
            let timeout: NodeJS.Timeout | null = null;
            const handleConnectTimeout = () => {
                (timeout = setTimeout(() => {
                    throw new ServerError('Connect to mongodb', { code: -100, message: 'Connect to mongodb failed' });
                })),
                    MONGODB_TIMEOUT;
            };
            mongoose.set('strictQuery', false);
            const URL = `${process.env.DATABASE_URL_MONGODB}`;
            await mongoose
                .connect(URL, { serverSelectionTimeoutMS: 10000 })
                .then((conn) => {
                    console.log('You successfully connected to MongoDB!', URL);
                    if (timeout) clearTimeout(timeout);
                })
                .catch((err) => {
                    console.log('Connect to mongoose - status: reconnecting ');
                    handleConnectTimeout();
                })
                .finally(() => {
                    // Ensures that the client will close when you finish/error
                    // await mongoose.close();
                });
            console.log('Connected to MongoDB Successful!');
        } catch (error) {
            return error;
        }
    };
    connect = () => {
        this.ConnectMongoDB();
    };
}

export default new Database();
