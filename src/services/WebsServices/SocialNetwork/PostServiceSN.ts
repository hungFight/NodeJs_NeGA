import { v4 as primaryKey } from 'uuid';
import { file } from 'googleapis/build/src/apis/file';
import DateTime from '../../../DateTimeCurrent/DateTimeCurrent';
import { NewPost } from '../../../models/mongodb/SN_DB/home';
import { prisma } from '../../..';
import { PropsInfoFile } from '../SendChatServiceSN';
import { PropsComments, PropsDataPosts } from '../../../../socailType';
// const Sequelize = require('sequelize');
// const Op = Sequelize.Op;
const { ObjectId } = require('mongodb');
// const db = require('../../../models');

class PostServiceSN {
    setPost = (
        id: string,
        value: string,
        category: number,
        fontFamily: string,
        privates: { id: number; name: string }[], // lists of privacies
        whoCanSeePost: { id: number; name: string },
        imotions: { id: number; name: string }[],
        categoryOfSwiper: { id: number; name: string },
        Centered1: {
            id: number;
            columns: number;
            data: string[];
        },
        Centered2: {
            id: number;
            columns: number;
            data: string[];
        },
        Centered3: {
            id: number;
            columns: number;
            data: string[];
        },
        BgColor: string,
        columnGrid: number,
        act: number,
        hashTags: {
            _id: string;
            value: string;
        }[],
        tags: string[],
        bg_default: string,
        data_file: PropsInfoFile[],
    ) => {
        return new Promise(async (resolve, reject) => {
            try {
                const id_c = data_file?.map((f) => f.id);
                let options = {};
                const imageOrVideosD = data_file?.map((f) => f.id);
                switch (category) {
                    case 0:
                        const imageOrVideos = data_file?.map((f) => {
                            return {
                                file: { link: f.id, type: f.type },
                                title: f.title,
                            };
                        });
                        options = {
                            default: imageOrVideos,
                        };
                        console.log(options, '0');
                        break;
                    case 1:
                        let data = {};
                        if (categoryOfSwiper.id === 5 && categoryOfSwiper.name === 'Centered') {
                            const centered = [];
                            if (Centered1) centered.push(Centered1);
                            if (Centered2) centered.push(Centered2);
                            if (Centered3) centered.push(Centered3);
                            data = {
                                centered,
                            };
                        } else {
                            data = {
                                file: imageOrVideosD,
                            };
                        }
                        options = {
                            swiper: {
                                id: categoryOfSwiper.id,
                                name: categoryOfSwiper.name,
                                data,
                            },
                        };
                        break;
                    case 2:
                        options = {
                            grid: {
                                file: imageOrVideosD,
                                BgColor,
                                column: columnGrid,
                            },
                        };
                        break;
                    case 3:
                        options = {
                            onlyImage: imageOrVideosD,
                        };
                        break;
                }
                console.log(
                    options,
                    'options',
                    category,
                    hashTags.map((h) => h.value),
                );
                const res = await NewPost.create({
                    id_user: id,
                    category,
                    hashTag: hashTags.map((h) => ({ value: h.value })),
                    background: bg_default,
                    content: {
                        text: value,
                        fontFamily: fontFamily,
                        options,
                    },
                    feel: {
                        onlyEmo: imotions,
                        act: act,
                    },
                    private: privates,
                    whoCanSeePost,
                    createdAt: DateTime(),
                });
                console.log(res, 'res no expire');
                resolve({ data: res, id_c });
            } catch (err) {
                reject(err);
            }
        });
    };
    getPosts = (
        id: string = '84e3f4f6-9e7f-4253-8380-3be1d6112afb',
        limit: number,
        offset: number,
        status: string,
    ): Promise<PropsDataPosts[]> => {
        return new Promise(async (resolve, reject) => {
            // is friend (following) -> not friend (following) + interact (max -> min) = view posts
            // whoever - is friend or not friend is status: anyone
            try {
                if (status === 'friend') {
                    // get id_followeds
                    const friends_id = await prisma.friends
                        .findMany({
                            where: {
                                OR: [
                                    { idRequest: id, level: 2 },
                                    { idIsRequested: id, level: 2 },
                                ],
                            },
                            select: {
                                idRequest: true,
                                idIsRequested: true,
                            },
                        })
                        .then((fr: any[]) =>
                            fr.map((f) =>
                                f.idIsRequested !== id ? f.idIsRequested : f.idRequest !== id ? f.idRequest : '',
                            ),
                        );

                    // get idfollows
                    const follow_id = await prisma.followers
                        .findMany({
                            where: {
                                OR: [
                                    { idFollowing: { in: friends_id }, idIsFollowed: id, followed: 2 },
                                    { idIsFollowed: { in: friends_id }, idFollowing: id, following: 2 },
                                ],
                            },
                        })
                        .then((fr: any[]) => fr.map((f) => (f.idFollowing !== id ? f.idFollowing : f.idIsFollowed)));

                    // friend + following
                    // const dataPost = await NewPost.aggregate([
                    //     { $match: { id_user: { $in: follow_id } } },
                    //     { $unwind: '$commentsOne' },
                    //     { $sort: { 'commentsOne.feel.amount': -1 } },
                    //     {
                    //         $group: {
                    //             _id: '$_id',
                    //             commentsOne: { $first: '$commentsOne' },
                    //         },
                    //     },
                    // ]);
                    const dataPost = await NewPost.find({ id_user: { $in: [...friends_id, ...follow_id, id] } })
                        .sort({ createdAt: -1 })
                        .limit(limit)
                        .skip(offset)
                        .select('-comments');
                    if (dataPost.length) {
                        const newData: any = await new Promise(async (resolve, reject) => {
                            try {
                                await Promise.all(
                                    dataPost.map(async (p, index: number) => {
                                        if (p.id_user === id) {
                                            dataPost[index].user = [
                                                {
                                                    id: "It's me",
                                                    fullName: "It's me",
                                                    avatar: undefined,
                                                    gender: 0,
                                                },
                                            ];
                                        } else {
                                            const user: any = await prisma.user.findUnique({
                                                where: {
                                                    id: p.id_user,
                                                },
                                                select: { id: true, avatar: true, fullName: true, gender: true },
                                            });
                                            console.log(user, 'user');
                                            if (user) {
                                                dataPost[index].user = [user];
                                            }
                                        }
                                    }),
                                );
                                resolve(dataPost);
                            } catch (error) {
                                console.log('Error: get post', error);
                            }
                        });
                        console.log(newData[0].user, 'newData');
                        resolve(newData);
                    }
                    resolve([]);

                    // console.log(dataPost, 'dataPost', users);
                    // const follow_id = await db.follows
                    //     .findAll({
                    //         where: {
                    //             [Op.or]: [
                    //                 { id_following: id, flwing: 2 },
                    //                 { id_followed: id, flwed: 2 },
                    //             ],
                    //         },
                    //     })
                    //     .then((fr: { id_following: string; id_followed: string }[]) =>
                    //         fr.map((f) =>
                    //             f.id_following !== id
                    //                 ? f.id_following
                    //                 : f.id_followed !== id
                    //                 ? f.id_followed
                    //                 : f.id_following,
                    //         ),
                    //     );
                }
                // const data = await db.users.findAll({
                //     attributes: ['id', 'fullName', 'avatar'],
                //     raw: true,
                // });
            } catch (err) {
                reject(err);
            }
        });
    };
    setEmotion = (_id: string, index: number, id_user: string, state: string, oldIndex: number) => {
        return new Promise(async (resolve, reject) => {
            try {
                if (state === 'remove') {
                    const post = await NewPost.findByIdAndUpdate(
                        _id,
                        { $pull: { 'feel.onlyEmo.$[elm].id_user': id_user } },
                        { arrayFilters: [{ 'elm.id': index }], new: true },
                    );
                    resolve(post?.feel);
                } else if (state === 'add') {
                    const post = await NewPost.findByIdAndUpdate(
                        _id,
                        { $addToSet: { 'feel.onlyEmo.$[elm].id_user': id_user } },
                        { arrayFilters: [{ 'elm.id': index }], new: true },
                    );
                    resolve(post?.feel);
                } else {
                    const post = await NewPost.findByIdAndUpdate(
                        _id,
                        {
                            $pull: { 'feel.onlyEmo.$[old].id_user': id_user }, // remove
                            $addToSet: { 'feel.onlyEmo.$[elm].id_user': id_user }, // add new
                        },
                        { arrayFilters: [{ 'elm.id': index }, { 'old.id': oldIndex }], new: true },
                    );
                    resolve(post?.feel);
                }
            } catch (error) {
                reject(error);
            }
        });
    };
    sendComment = (postId: string, userId: string, text: string, onAnonymous: boolean): Promise<any> => {
        return new Promise(async (resolve, reject) => {
            try {
                const _id = primaryKey();
                if (_id) {
                    const res = await NewPost.findByIdAndUpdate(postId, {
                        $push: { comments: { _id, id_user: userId, user: null, content: { text } } },
                        $set: { anonymous: onAnonymous },
                    });
                    const user = await prisma.user.findUnique({
                        where: { id: userId },
                        select: { id: true, fullName: true, avatar: true, gender: true },
                    });
                    if (res && user)
                        resolve({
                            content: { text, imageOrVideos: [] },
                            createdAt: new Date(),
                            feel: { onlyEmo: [] },
                            id_user: userId,
                            reply: [],
                            user,
                            _id: _id,
                        });
                }

                resolve(null);
            } catch (error) {
                reject(error);
            }
        });
    };
    getComments = (postId: string, userId: string, offset: number, limit: number): Promise<PropsComments[] | null> => {
        return new Promise(async (resolve, reject) => {
            try {
                const res: any = await NewPost.aggregate([
                    { $match: { _id: ObjectId(postId) } },
                    { $unwind: '$comments' },
                    { $sort: { 'comments.createdAt': -1 } },
                    { $skip: offset }, // Skip the specified number of documents
                    { $limit: limit },
                    {
                        $group: {
                            _id: '$_id',
                            comments: { $push: '$comments' },
                        },
                    },
                ]);
                if (res[0]?.comments.length) {
                    await Promise.all(
                        res[0]?.comments.map(async (c: PropsComments, index: string) => {
                            const oldData = res[0].comments.filter(
                                (r: { user: { id: string } }) => r.user?.id === c.id_user,
                            );
                            if (!oldData?.length) {
                                const d = await prisma.user.findUnique({
                                    where: { id: c.id_user },
                                    select: { avatar: true, id: true, fullName: true, gender: true },
                                });
                                if (d) res[0].comments[index].user = d;
                            } else {
                                res[0].comments[index].user = oldData[0];
                            }
                        }),
                    );
                    resolve(res[0]?.comments);
                }
                resolve([]);
            } catch (error) {
                reject(error);
            }
        });
    };
}
export default new PostServiceSN();
