import mongoose from 'mongoose';

class Database {
    socket = (io: any) => {
        const online = new Set();
    };

    ConnectMongoDB = async () => {
        try {
            mongoose.set('strictQuery', false);
            const URL = 'mongodb+srv://Spaceship:hung0507200301645615023@cluster0.chumwfw.mongodb.net/spaceship';
            await mongoose.connect(URL, { serverSelectionTimeoutMS: 10000 });
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
