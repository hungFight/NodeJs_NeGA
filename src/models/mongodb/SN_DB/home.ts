import mongoose from 'mongoose';
const Schema = mongoose.Schema;
const feel = {
    onlyEmo: [
        { id: { type: Number, maxLength: 1 }, icon: { type: String, maxLength: 10 }, id_user: { type: [String], maxLength: 50, unique: true } },
    ], // display icons will be chosen
    act: { type: Number, maxLength: 1, default: 1 },
};

const Comments = new Schema(
    {
        _id: { type: String, maxLength: 50, index: true },
        id_user: {
            type: String,
            required: true,
            maxLength: 50,
        },
        user: {
            type: {
                id: { type: String, maxLength: 50 },
                fullName: { type: String, maxLength: 30 },
                avatar: { type: String, maxLength: 50 },
                gender: { type: Number, maxLength: 1 },
            },
            default: null,
        },
        content: {
            text: { type: String },
            imageOrVideos: [{ id: { type: String, maxLength: 50 } }],
        },
        feel,
        reply: [
            {
                type: {
                    _id: { type: String, maxLength: 50, index: true },
                    id_user: {
                        type: String,
                        required: true,
                        maxLength: 50,
                    },
                    user: {
                        type: {
                            id: { type: String, maxLength: 50 },
                            fullName: { type: String, maxLength: 30 },
                            avatar: { type: String, maxLength: 50 },
                            gender: { type: Number, maxLength: 1 },
                        },
                        default: null,
                    },
                    content: {
                        text: { type: String },
                        imageOrVideos: [{ id: { type: String, maxLength: 50 } }],
                    },
                    feel,
                    anonymous: { type: Boolean, default: false },
                    createdAt: { type: Date, required: true, default: Date.now() },
                },
                default: [],
            },
            { _id: false },
        ],
        anonymous: { type: Boolean, default: false },
        createdAt: { type: Date, required: true, default: Date.now() },
    },
    { _id: false },
);
const themeDefault = new Schema(
    {
        _id: { type: String, maxLength: 50 },
        text: { type: String, text: String },
        fontFamily: { type: String, maxLength: 20 },
        data: [
            {
                id_sort: { type: Number, maxLength: 2 },
                file: { link: { type: String, maxLength: 50 }, type: { type: String, maxLength: 15 } },
                title: { type: String, maxLength: 100 },
                love: { act: { type: Number, maxLength: 11, defaultValue: 0 }, id_user: [String] },
                required: false,
            },
        ],
    },
    { _id: false },
);
export const ThemeDefault = mongoose.model('ThemeDefault', themeDefault);
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
    postId: { type: String, maxLength: 50, unique: true },
    content: {
        _id: { type: String, maxLength: 50 },
        text: { type: String, text: String },
        fontFamily: { type: String, maxLength: 20 },
        data: [
            {
                id_sort: { type: Number, maxLength: 2 },
                file: { link: { type: String, maxLength: 50 }, type: { type: String, maxLength: 15 } },
                title: { type: String, maxLength: 100 },
                love: { act: { type: Number, maxLength: 11, defaultValue: 0 }, id_user: [String] },
                required: false,
            },
        ],
    },
    // content: {
    //     // default: [
    //     //     //0
    //     // ],
    //     // swiper: {
    //     //     //1
    //     //     id: { type: Number, maxLength: 1 },
    //     //     name: { type: String, maxLength: 20 },
    //     //     // raw: { type: Number, maxLength: 1 },
    //     //     // column: { type: Number, maxLength: 1 },
    //     //     data: {
    //     //         file: [{ type: String, maxLength: 50 }],
    //     //         centered: [
    //     //             {
    //     //                 id: { type: Number, maxLength: 1 },
    //     //                 columns: { type: Number, maxLength: 1 },
    //     //                 data: [String],
    //     //             },
    //     //         ],
    //     //     },
    //     //     required: false,
    //     // },
    //     // grid: {
    //     //     //2
    //     //     file: [{ type: String, maxLength: 50 }],
    //     //     BgColor: { type: String, maxLength: 10 },
    //     //     column: { type: Number, maxLength: 2 },
    //     //     required: false,
    //     // },
    //     // onlyImage: [{ type: String, maxLength: 50 }], //3
    // },
    feel,
    amountComments: { type: Number, maxLength: 11, default: 0 },
    whoCanSeePost: {
        id: { type: String, maxLength: 50 },
        name: { type: String, maxLength: 20 },
    },
    anonymous: { type: Boolean, defaultValue: false }, // comments
    private: [{ id: { type: String, maxLength: 50 }, name: { type: String, maxLength: 20 } }],
    createdAt: { type: Date, required: true, default: Date.now() },
    deletedAt: { type: Date, default: null },
    repository: { type: Date, default: null },
});
export const NewPost = mongoose.model('NewPost', Posts);
