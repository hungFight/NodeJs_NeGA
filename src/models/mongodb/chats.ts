import mongoose from 'mongoose';
const Schema = mongoose.Schema;
const rooms = new Schema({
    chatId: { type: mongoose.SchemaTypes.ObjectId, unique: false },
    count: { type: Number, default: 0, maxLength: 6 }, // 2000 records for each room
    full: { type: Boolean, default: false },
    index: { type: Number, required: true, default: 0 },
    filter: [
        {
            count: { type: Number, default: 0, maxLength: 6 },
            full: { type: Boolean, default: false },
            index: { type: Number, required: true, default: 0 },
            data: [
                {
                    _id: { type: String, required: true, maxLength: 50 },
                    userId: { type: String, required: true, maxLength: 50 },
                    text: {
                        t: { type: String, text: String },
                        icon: { type: String, default: '' },
                    },
                    imageOrVideos: [
                        {
                            _id: { type: String, maxLength: 200, index: true },
                            type: { type: String, maxLength: 15 },
                            tail: { type: String, maxLength: 15 },
                            createdAt: { type: Date, default: Date.now() },
                            icon: { type: String, maxLength: 1, default: '' },
                        },
                        { _id: false },
                    ],
                    delete: { type: String, maxLength: 50, default: '' },
                    update: { type: String, maxLength: 50, default: '' },
                    seenBy: { type: [String], maxLength: 50 },
                    createdAt: { type: Date, default: Date.now() },
                    updatedAt: { type: Date, default: '' },
                    secondary: { type: String, maxLength: 50 },
                    reply: {
                        type: {
                            id_reply: { type: String, maxLength: 50 },
                            id_room: { type: String, maxLength: 50, required: true },
                            id_replied: { type: String, maxLength: 50 },
                            text: { type: String, maxLength: 50 },
                            imageOrVideos: [
                                {
                                    _id: { type: String, maxLength: 200, index: true },
                                    type: { type: String, maxLength: 15 },
                                    tail: { type: String, maxLength: 15 },
                                    createdAt: { type: Date, default: Date.now() },
                                    icon: { type: String, maxLength: 1, default: '' },
                                },
                                { _id: false },
                            ],
                            byWhoCreatedAt: { type: Date },
                        },
                        default: null,
                    },
                },
                { _id: false },
            ],
        },
    ],
});

export const Rooms = mongoose.model('Rooms', rooms);
const chats = new Schema(
    {
        id_us: { type: [String] },
        users: { type: [mongoose.Schema.Types.Mixed], require: false },
        user: mongoose.Schema.Types.Mixed,
        deleted: [
            // who has deleted
            {
                id: { type: String, maxLength: 50 },
                createdAt: {
                    // user's deleting time
                    type: Date,
                    default: Date.now(),
                },
                show: { type: Boolean, maxLength: 5, default: true },
            },
        ],
        status: { type: String, maxLength: 11 },
        first: { id: { type: String, maxLength: 50 } },
        rooms: [mongoose.Schema.Types.Mixed],
        background: {
            v: { type: String, maxLength: 50 },
            type: { type: String, maxLength: 20 },
            id: { type: String, maxLength: 50 },
            latestChatId: { type: String, maxLength: 50 },
            userId: { type: String, maxLength: 50 },
        },
        pins: [
            {
                _id: { type: String, required: true, maxLength: 50, index: true },
                chatId: { type: String, maxLength: 50 },
                userId: { type: String, maxLength: 50 },
                createdAt: { type: Date, default: Date.now() },
                updatedAt: { type: Date, default: '' },
                latestChatId: { type: String, maxLength: 50 },
            },
            { _id: false },
        ],
        createdAt: { type: Date, default: Date.now() },
    },
    {
        timestamps: true,
    },
);
export const ConversationRooms = mongoose.model('ConversationRooms', chats);
