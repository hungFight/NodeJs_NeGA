import mongoose from 'mongoose';
const Schema = mongoose.Schema;
const feel = {
    like: { act: { type: Number, maxLength: 10, defaultValue: 0 }, id_user: [String] },
    love: { act: { type: Number, maxLength: 10, defaultValue: 0 }, id_user: [String] },
    smile: { act: { type: Number, maxLength: 10, defaultValue: 0 }, id_user: [String] },
    sad: { act: { type: Number, maxLength: 10, defaultValue: 0 }, id_user: [String] },
    angry: { act: { type: Number, maxLength: 10, defaultValue: 0 }, id_user: [String] },
    only: [{ id: { type: Number, maxLength: 1 }, icon: { type: String, maxLength: 10 } }],
    amount: { type: Number, maxLength: 20, defaultValue: 0 },
    act: { type: Number, maxLength: 1, defaultValue: 1 },
};
const comments = [
    {
        id_user: {
            type: String,
            required: true,
            maxLength: 50,
        },
        user: [],
        content: {
            text: { type: String, text: String },
            imageOrVideos: [{ file: { type: String, maxLength: 50 }, feel }],
        },
        feel,
        reply: [
            {
                id_user: { type: String, maxLength: 50, required: true },
                user: [],
                content: { text: { type: String, text: String }, imageOrVideos: [String] },
                feel,
                anonymous: { type: Boolean, defaultValue: false },
            },
        ],
    },
];
const Posts = new Schema({
    id_user: { type: String, maxLength: 50, required: true },
    user: [],
    category: { type: Number, maxLength: 1 },
    content: {
        text: { type: String, text: String },
        fontFamily: { type: String, maxLength: 20 },
        options: {
            default: [
                {
                    file: { type: String, maxLength: 50 },
                    title: { type: String, maxLength: 100 },
                    love: { act: { type: Number, maxLength: 11, defaultValue: 0 }, id_user: [String] },
                    comments,
                },
            ],
            swiper: {
                id: { type: Number, maxLength: 1 },
                name: { type: String, maxLength: 20 },
                // raw: { type: Number, maxLength: 1 },
                // column: { type: Number, maxLength: 1 },
                data: {
                    file: [{ type: String, maxLength: 50 }],
                    centered: [
                        {
                            id: { type: Number, maxLength: 1 },
                            columns: { type: Number, maxLength: 1 },
                            data: [String],
                        },
                    ],
                },
            },
            grid: {
                file: [{ type: String, maxLength: 50 }],
                BgColor: { type: String, maxLength: 10 },
                column: { type: Number, maxLength: 2 },
            },
            onlyImage: [{ type: String, maxLength: 50 }],
        },
    },
    feel,
    amountComments: { type: Number, maxLength: 11, default: 0 },
    commentsOne: comments,
    commentsTwo: comments,
    commentsThree: comments,
    whoCanSeePost: {
        id: { type: Number, maxLength: 1 },
        name: { type: String, maxLength: 20 },
    },
    anonymous: { type: Boolean, defaultValue: false }, // comments
    private: [{ id: { type: Number, maxLength: 1 }, name: { type: String, maxLength: 20 } }],
    createdAt: { type: Date, required: true, default: Date.now() },
});
export const NewPost = mongoose.model('NewPost', Posts);
