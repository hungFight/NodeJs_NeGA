import mongoose from 'mongoose';
const Schema = mongoose.Schema;
const feel = {
    onlyEmo: [{ id: { type: Number, maxLength: 1 }, icon: { type: String, maxLength: 10 }, id_user: [String] }], // display icons will be chosen
    act: { type: Number, maxLength: 1, defaultValue: 1 },
};
const comments = [
    {
        id_user: {
            type: String,
            required: true,
            maxLength: 50,
        },
        user: {
            id: { type: String, maxLength: 50 },
            fullName: { type: String, maxLength: 30 },
            avatar: { type: Buffer },
            gender: { type: Number, maxLength: 1 },
        },
        content: {
            text: { type: String, text: String },
            imageOrVideos: [{ id: { type: Number, maxLength: 3 }, file: { type: String, maxLength: 50 }, feel }],
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
    id_user: { type: String, maxLength: 50, required: true, index: true },
    user: [
        {
            id: { type: String, maxLength: 50, required: true },
            fullName: { type: String, maxLength: 30, required: true },
            avatar: { type: String, required: false, maxLength: 50 },
            gender: { type: Number, maxLength: 1, required: true },
        },
    ],
    category: { type: Number, maxLength: 1 },
    hashTag: [{ value: String }, { _id: true }],
    background: { type: String, maxLength: 20 },
    Tags: [{ id_user: { type: String, maxLength: 50 } }],
    content: {
        text: { type: String, text: String },
        fontFamily: { type: String, maxLength: 20 },
        options: {
            default: [
                //0
                {
                    file: { link: { type: String, maxLength: 50 }, type: { type: String, maxLength: 15 } },
                    title: { type: String, maxLength: 100 },
                    love: { act: { type: Number, maxLength: 11, defaultValue: 0 }, id_user: [String] },
                    comments,
                    required: false,
                },
            ],
            swiper: {
                //1
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
                required: false,
            },
            grid: {
                //2
                file: [{ type: String, maxLength: 50 }],
                BgColor: { type: String, maxLength: 10 },
                column: { type: Number, maxLength: 2 },
                required: false,
            },
            onlyImage: [{ type: String, maxLength: 50 }], //3
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
    deletedAt: { type: Date, default: null },
    repository: { type: Date, default: null },
});
export const NewPost = mongoose.model('NewPost', Posts);
