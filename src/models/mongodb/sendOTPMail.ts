import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const verifyMail = new Schema(
    {
        email: { type: String, required: true },
        otp: { type: String, required: true },
        createdAt: { type: Date, index: { expires: 120 } },
    },
    {
        timestamps: true,
    },
);
export const VerifyMail = mongoose.model('verifyMail', verifyMail);

const prohibited = new Schema(
    {
        email: { type: String, required: true, primaryKey: true },
        sended: { type: Number, required: true },
        createdAt: { type: Date, index: { expires: 2629743 } },
    },
    {
        timestamps: true,
    },
);
export const Prohibit = mongoose.model('prohibit', prohibited);
