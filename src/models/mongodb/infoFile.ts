import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const info = new Schema({
    id: { type: String, maxLength: 50, index: true },
    type: { type: String, maxLength: 15 },
    name: { type: String, maxLength: 100 },
    title: { type: String },
    createdAt: { type: Date, default: Date.now() },
});
export const InfoFile = mongoose.model('infoFile', info);
