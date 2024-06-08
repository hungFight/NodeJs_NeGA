import mongoose from 'mongoose';
import ServerError from '../utils/errors/ServerError';
import { MongoClient, ServerApiVersion } from 'mongodb';
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
        const client = new MongoClient(URL, {
            serverApi: {
                version: ServerApiVersion.v1,
                strict: true,
                deprecationErrors: true,
            },
        });
        async function run() {
            try {
                // Connect the client to the server	(optional starting in v4.7)
                await client.connect();
                // Send a ping to confirm a successful connection
                console.log('Pinged your deployment. You successfully connected to MongoDB!');
            } finally {
                // Ensures that the client will close when you finish/error
                await client.close();
            }
        }
        run().catch(console.dir);
    };
    connect = () => {
        this.ConnectMongoDB();
    };
}

export default new Database();
