import mongoose from 'mongoose';
import ServerError from '../utils/errors/ServerError';

class Database {
    ConnectMongoDB = async () => {
        const MONGODB_TIMEOUT = Number(process.env.MONGODB_CONNECT_TIMEOUT);
        let timeout: NodeJS.Timeout;
        const handleConnectTimeout = () => {
            (timeout = setTimeout(() => {
                throw new ServerError('Connect to mongodb', { code: -100, message: 'Connect to mongodb failed' });
            })),
                MONGODB_TIMEOUT;
        };
        mongoose.set('strictQuery', false);
        const URL = `${process.env.DATABASE_URL_MONGODB}`;
        const con = await mongoose.createConnection(URL, { serverSelectionTimeoutMS: MONGODB_TIMEOUT }).asPromise();

        con.on('connecting', function () {
            console.log('connecting to Mongocon...');
        });
        con.on('error', function (error) {
            console.error('Error in MongoDb connection: ' + error);
            handleConnectTimeout();
        });
        con.on('connected', function () {
            console.log('MongoDB connected!');
            clearTimeout(timeout);
        });
        con.on('reconnected', function () {
            console.log('MongoDB reconnected!');
            clearTimeout(timeout);
        });
        con.on('disconnected', function () {
            console.log('MongoDB disconnected!');
            handleConnectTimeout();
        });
    };
    connect = () => {
        this.ConnectMongoDB();
    };
}

export default new Database();
