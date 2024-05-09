import { v4 as primaryKey } from 'uuid';
import DateTime from '../../../DateTimeCurrent/DateTimeCurrent';
import { Comments, NewPost } from '../../../models/mongodb/SN_DB/home';
import { prisma } from '../../..';
import { PropsComments, PropsCommentsIn, PropsDataPosts, feel } from '../../../../socailType';
import { PropsInfoFile } from '../../../typescript/senChatType';

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
                let content = {};
                const imageOrVideosD = data_file?.map((f) => f.id);
                switch (category) {
                    case 0:
                        const imageOrVideos = data_file?.map((f) => {
                            return {
                                id_sort: f.id_sort,
                                file: { link: f.id, type: f.type, title: f.title, width: f.width, height: f.height },
                            };
                        });
                        content = {
                            text: value,
                            fontFamily,
                            default: imageOrVideos,
                        };
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
                        content = {
                            swiper: {
                                id: categoryOfSwiper.id,
                                name: categoryOfSwiper.name,
                                data,
                            },
                        };
                        break;
                    case 2:
                        content = {
                            grid: {
                                file: imageOrVideosD,
                                BgColor,
                                column: columnGrid,
                            },
                        };
                        break;
                    case 3:
                        content = {
                            onlyImage: imageOrVideosD,
                        };
                        break;
                }
                const res: any = await NewPost.create({
                    id_user: id,
                    category,
                    hashTag: hashTags.map((h) => ({ value: h.value })),
                    background: bg_default,
                    content,
                    feel: {
                        onlyEmo: imotions,
                        act: act,
                    },
                    private: privates,
                    whoCanSeePost,
                    createdAt: DateTime(),
                });
                await Comments.create({ postId: res._id, count: 0, data: [] });
                console.log(res, 'res no expire');
                resolve(res);
            } catch (err) {
                reject(err);
            }
        });
    };
    getPosts = (id: string = '84e3f4f6-9e7f-4253-8380-3be1d6112afb', limit: number, offset: number, status: string): Promise<PropsDataPosts[]> => {
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
                        .then((fr: any[]) => fr.map((f) => (f.idIsRequested !== id ? f.idIsRequested : f.idRequest !== id ? f.idRequest : '')));

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
                    const dataPost: any = await NewPost.find({ id_user: { $in: [...friends_id, ...follow_id, id] } })
                        .sort({ createdAt: -1 })
                        .limit(limit)
                        .skip(offset);
                    if (dataPost.length) {
                        const newData = await Promise.all(
                            dataPost.map(async (p: any, index: number) => {
                                if (p.id_user === id) {
                                    p.user = [
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
                                    if (user) {
                                        p.user = [user];
                                    }
                                }
                            }),
                        );
                        try {
                            resolve(dataPost);
                        } catch (error) {
                            console.log('Error: get post', error);
                        }

                        console.log(newData[0].user, 'newData');
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
    setEmotion = (data: {
        _id: string;
        index: number;
        id_user: string;
        state: 'add' | 'remove' | 'update';
        oldIndex?: number;
        id_comment?: string;
        groupCommentId?: string;
    }): Promise<feel | null> => {
        return new Promise(async (resolve, reject) => {
            const { _id, index, id_user, state, oldIndex, id_comment, groupCommentId } = data;
            try {
                const date = new Date();
                if (id_comment && groupCommentId) {
                    //comment
                    const commentToUpdate: any = await Comments.findById(groupCommentId);
                    let loadToClient: feel | null = null;
                    commentToUpdate.data.map((c: PropsCommentsIn) => {
                        if (c._id === id_comment && c.feel) {
                            c.feel.onlyEmo.map((e: { id_user: string[]; id: number }) => {
                                e.id_user = e.id_user.filter((u) => u !== id_user);
                                if ((state === 'add' || state === 'update') && String(e.id) === String(index)) e.id_user.push(id_user);
                                return e;
                            });
                            c.feel.createdAt = date;
                            loadToClient = c.feel;
                        }
                        return c;
                    });
                    await commentToUpdate.save();
                    resolve(loadToClient);
                } else {
                    // post
                    const post: any = await NewPost.findById(_id);
                    if (post && post?.feel) {
                        post.feel.onlyEmo = post.feel.onlyEmo.map((e: { id_user: string[]; id: any }) => {
                            e.id_user = e.id_user.filter((u: string) => u !== id_user);
                            if ((state === 'add' || state === 'update') && String(e.id) === String(index)) e.id_user.push(id_user);
                            return e;
                        });
                        await post.save();
                        resolve(post.feel);
                    }
                }
                resolve(null);
            } catch (error) {
                reject(error);
            }
        });
    };
    sendComment = (
        postId: string,
        userId: string,
        text: string,
        onAnonymous: boolean,
        emos: {
            act: number;
            onlyEmo: {
                id: number;
                icon: string;
                id_user: string[];
            }[];
            createdAt: string | Date;
        },
        commentId?: string,
        repliedId?: string,
    ): Promise<PropsComments | null> => {
        return new Promise(async (resolve, reject) => {
            try {
                const _id = primaryKey();
                if (_id) {
                    const date = new Date();
                    if (commentId && repliedId) {
                        const re = await Comments.findOneAndUpdate(
                            { postId },
                            {
                                $push: {
                                    data: {
                                        _id,
                                        id_user: userId,
                                        anonymous: onAnonymous,
                                        user: null,
                                        content: { text },
                                        feel: emos,
                                        createdAt: date,
                                    },
                                },
                                $inc: {
                                    count: 1,
                                },
                            },
                            { new: true },
                        );
                        // const res = await NewPost.findByIdAndUpdate(
                        //     postId,
                        //     {
                        //         $push: {
                        //             'comments.$[elm].reply':
                        //         },
                        //     },
                        //     { arrayFilters: [{ 'elm._id': commentId }] },
                        // );
                    } else {
                        emos.createdAt = new Date();
                        const res = await Comments.findOneAndUpdate(
                            { postId, full: false },
                            {
                                $push: {
                                    data: {
                                        _id,
                                        id_user: userId,
                                        anonymous: onAnonymous,
                                        user: null,
                                        content: { text },
                                        feel: emos,
                                        createdAt: date,
                                    },
                                },
                                $inc: {
                                    count: 1,
                                },
                            },
                            { new: true },
                        );

                        const user = await prisma.user.findUnique({
                            where: { id: userId },
                            select: { id: true, fullName: true, avatar: true, gender: true },
                        });
                        if (res && user)
                            resolve({
                                _id: res._id,
                                postId,
                                count: res.count,
                                full: res.full,
                                data: [
                                    {
                                        content: { text, imageOrVideos: [] },
                                        createdAt: date,
                                        anonymous: onAnonymous,
                                        feel: emos,
                                        id_user: userId,
                                        reply: [],
                                        user,
                                        _id: _id,
                                    },
                                ],
                            });
                    }
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
                const res: PropsComments[] = await Comments.aggregate([
                    { $match: { postId } },
                    { $unwind: '$data' },
                    { $sort: { 'data.createdAt': -1 } },
                    { $skip: offset }, // Skip the specified number of documents
                    { $limit: limit },
                    {
                        $group: {
                            _id: '$_id',
                            count: { $first: '$count' },
                            full: { $first: '$full' },
                            postId: { $first: '$first' },
                            data: { $push: '$data' },
                        },
                    },
                ]);
                console.log(res, 'comment');
                if (res?.length) {
                    const newCom = await Promise.all(
                        res.map(async (d, indexD: number) => {
                            // Map over 'd.data' asynchronously to fetch additional user data
                            const newData = await Promise.all(
                                d.data.map(async (c, index: number) => {
                                    try {
                                        const userData = await prisma.user.findUnique({
                                            where: { id: c.id_user },
                                            select: { avatar: true, id: true, fullName: true, gender: true },
                                        });
                                        if (userData) {
                                            c.user = userData;
                                        }
                                        return c;
                                    } catch (error) {
                                        // Handle errors if user data fetching fails
                                        console.error(`Error fetching user data for id_user ${c.id_user}:`, error);
                                        // You can choose to return the original 'c' object or handle errors differently
                                        return c;
                                    }
                                }),
                            );
                            // Replace 'd.data' with the updated 'newData' that includes user information
                            d.data = newData;
                            return d;
                        }),
                    );
                    resolve(newCom);
                }
                resolve([]);
            } catch (error) {
                reject(error);
            }
        });
    };
}
export default new PostServiceSN();
