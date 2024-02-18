import { file } from 'googleapis/build/src/apis/file';
import DateTime from '../../../DateTimeCurrent/DateTimeCurrent';
import { NewPost } from '../../../models/mongodb/SN_DB/home';
import { prisma } from '../../..';
// const Sequelize = require('sequelize');
// const Op = Sequelize.Op;

// const db = require('../../../models');

class HomeServiceSN {
    setPost = (
        id: string,
        value: string,
        category: number,
        fontFamily: string,
        files: any,
        privates: { id: number; name: string }[], // lists of privacies
        whoCanSeePost: { id: number; name: string },
        imotigons: { id: number; name: string }[],
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
    ) => {
        return new Promise(async (resolve, reject) => {
            try {
                const id_c = files?.map((f: any) => f.id);
                let options = {};
                const imageOrVideos: any = files?.map((f: any) => f.metadata.id_file.toString());
                switch (category) {
                    case 0:
                        const imageOrVideosDe: any = files.map((f: any) => {
                            return {
                                file: f.metadata.id_file.toString(),
                                title: f.metadata.title,
                            };
                        });
                        options = {
                            default: imageOrVideosDe,
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
                                file: imageOrVideos,
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
                                file: imageOrVideos,
                                BgColor,
                                column: columnGrid,
                            },
                        };
                        break;
                    case 3:
                        options = {
                            onlyImage: imageOrVideos,
                        };
                        break;
                }
                console.log(options, 'options', category);
                const res = await NewPost.create({
                    id_user: id,
                    category,
                    hashTag: hashTags.map((h) => h.value),
                    content: {
                        text: value,
                        fontFamily: fontFamily,
                        options,
                    },
                    feel: {
                        only: imotigons,
                        amount: 0,
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
    getPosts = (id: string = '84e3f4f6-9e7f-4253-8380-3be1d6112afb', limit: number, offset: number, status: string) => {
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
                    const dataPost = await NewPost.find({ id_user: { $in: [...follow_id, id] } })
                        .sort({ createdAt: -1 })
                        .limit(limit)
                        .skip(offset);
                    const newData = await new Promise(async (resolve, reject) => {
                        try {
                            await Promise.all(
                                dataPost.map(async (p, index: number) => {
                                    const users = await prisma.user.findMany({
                                        where: {
                                            id: p.id_user,
                                        },
                                        select: { id: true, avatar: true, fullName: true, gender: true },
                                    });
                                    dataPost[index].user = users;
                                }),
                            );
                            resolve(dataPost);
                        } catch (error) {
                            console.log('Error: get post', error);
                        }
                    });
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
                    console.log(newData, 'newData');
                    resolve(newData);
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
}
export default new HomeServiceSN();
