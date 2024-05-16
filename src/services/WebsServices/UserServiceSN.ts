import moment from 'moment';
import { esClient, prisma } from '../..';
import xPrismaF from '../../models/prisma/extension/xPrismaF';
import { v4 as primaryKey } from 'uuid';
export interface PropsParams {
    fullName?: boolean;
    active?: boolean;
    biography?: boolean;
    gender?: boolean;
    background?: boolean;
    avatar?: boolean;
    hobby?: boolean;
    strengths?: boolean;
    address?: boolean;
    skill?: boolean;
    birthday?: boolean;
    occupation?: boolean;
    schoolName?: boolean;
    createdAt?: boolean;
    firstPage?: boolean;
    secondPage?: boolean;
    thirdPage?: boolean;
}
interface PropsParamsMores {
    position?: boolean;
    star?: boolean;
    loverAmount?: boolean;
    friendAmount?: boolean;
    visitorAmount?: boolean;
    followedAmount?: boolean;
    followingAmount?: boolean;
    relationship?: boolean;
    language?: boolean;
}
async function searchUsersInElasticsearchName(query: string) {
    try {
        const data = await esClient.search({
            index: 'users', // Elasticsearch index name
            body: {
                query: {
                    match: {
                        fullName: query, // Search by user's full name
                    },
                },
            },
        });
        console.log('users are found ', data);

        // const users = body.hits.hits.map((hit) => hit._source);
        // return users;
    } catch (error) {
        console.error('Error searching users in Elasticsearch:', error);
        return [];
    }
}
async function indexUserInElasticsearch(userId: string) {
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            throw new Error(`User with id ${userId} not found`);
        }

        // Index user data in Elasticsearch
        await esClient.index({
            index: 'users', // Elasticsearch index name
            id: user.id,
            body: {
                fullName: user.fullName,
                // Add more fields as needed
            },
        });

        console.log(`User ${userId} indexed in Elasticsearch`);
    } catch (error) {
        console.error('Error indexing user in Elasticsearch:', error);
    }
}
class UserService {
    getById(id: string, id_reqs: string[], params: PropsParams, mores: PropsParamsMores, first?: string) {
        return new Promise(async (resolve: any, reject: (arg0: unknown) => void) => {
            try {
                if (first) {
                    const data = await prisma.user.findUnique({
                        where: { id: id },
                        select: params,
                    });
                    if (data) resolve(data);
                } else {
                    const data = await prisma.user.findMany({
                        where: { id: { in: id_reqs } },
                        select: {
                            id: true,
                            mores: {
                                select: {
                                    privacy: true,
                                },
                            },
                            userRequest: {
                                where: {
                                    OR: [
                                        { idRequest: id, idIsRequested: { in: id_reqs } },
                                        { idRequest: { in: id_reqs }, idIsRequested: id },
                                    ],
                                },
                            },
                            userIsRequested: {
                                where: {
                                    OR: [
                                        { idRequest: { in: id_reqs }, idIsRequested: id },
                                        { idRequest: id, idIsRequested: { in: id_reqs } },
                                    ],
                                },
                            },
                        },
                    });

                    const newData = await Promise.all(
                        data.map(async (us: { mores: { privacy: any }[]; id: string; userRequest: { level: number }[]; userIsRequested: { level: number }[] }) => {
                            const privacy: any = us.mores[0].privacy;
                            const privates: {
                                position: string;
                                address: string;
                                birthday: string;
                                relationship: string;
                                gender: string;
                                schoolName: string;
                                occupation: string;
                                hobby: string;
                                skill: string;
                                language: string;
                                subAccount: string;
                            } = privacy;
                            let accountUser: any = {
                                select: {
                                    account: {
                                        select: {
                                            id: true,
                                            fullName: true,
                                            avatar: true,
                                            gender: true,
                                            phoneNumberEmail: true,
                                        },
                                    },
                                },
                            };
                            if (id !== us.id) {
                                params.address =
                                    privates.address === 'everyone' || ((us.userRequest[0]?.level === 2 || us.userIsRequested[0]?.level === 2) && privates.address !== 'only') ? true : false;
                                params.birthday =
                                    privates.birthday === 'everyone' || ((us.userRequest[0]?.level === 2 || us.userIsRequested[0]?.level === 2) && privates.birthday !== 'only') ? true : false;
                                params.occupation =
                                    privates.occupation === 'everyone' || ((us.userRequest[0]?.level === 2 || us.userIsRequested[0]?.level === 2) && privates.occupation !== 'only') ? true : false;
                                params.hobby = privates.hobby === 'everyone' || ((us.userRequest[0]?.level === 2 || us.userIsRequested[0]?.level === 2) && privates.hobby !== 'only') ? true : false;
                                params.skill = privates.skill === 'everyone' || ((us.userRequest[0]?.level === 2 || us.userIsRequested[0]?.level === 2) && privates.skill !== 'only') ? true : false;
                                params.schoolName =
                                    privates.schoolName === 'everyone' || ((us.userRequest[0]?.level === 2 || us.userIsRequested[0]?.level === 2) && privates.schoolName !== 'only') ? true : false;
                                params.gender = privates.gender === 'everyone' || ((us.userRequest[0]?.level === 2 || us.userIsRequested[0]?.level === 2) && privates.gender !== 'only') ? true : false;
                                if (mores) {
                                    mores.language =
                                        privates.language === 'everyone' || ((us.userRequest[0]?.level === 2 || us.userIsRequested[0]?.level === 2) && privates.position !== 'only') ? true : false;
                                    mores.position =
                                        privates.position === 'everyone' || ((us.userRequest[0]?.level === 2 || us.userIsRequested[0]?.level === 2) && privates.position !== 'only') ? true : false;
                                }
                                if (privates.subAccount !== 'everyone' || !(us.userRequest[0]?.level === 2 || us.userIsRequested[0]?.level === 2)) {
                                    accountUser = false;
                                }
                            }

                            const newUs = await prisma.user.findUnique({
                                where: {
                                    id: us.id,
                                },
                                select: {
                                    id: true,
                                    ...params,
                                    mores: {
                                        select: {
                                            ...mores,
                                        },
                                    },
                                    userRequest: {
                                        where: {
                                            OR: [
                                                { idRequest: id, idIsRequested: us.id },
                                                { idRequest: us.id, idIsRequested: id },
                                            ],
                                        },
                                    },
                                    userIsRequested: {
                                        where: {
                                            OR: [
                                                { idRequest: us.id, idIsRequested: id },
                                                { idRequest: id, idIsRequested: us.id },
                                            ],
                                        },
                                    },
                                    followings: {
                                        where: {
                                            OR: [
                                                { idFollowing: id, idIsFollowed: us.id },
                                                { idFollowing: us.id, idIsFollowed: id },
                                            ],
                                        },
                                    },
                                    followed: {
                                        where: {
                                            OR: [
                                                { idFollowing: us.id, idIsFollowed: id },
                                                { idFollowing: id, idIsFollowed: us.id },
                                            ],
                                        },
                                    },
                                    isLoved: {
                                        where: {
                                            userId: id,
                                        },
                                    },
                                    accountUser,
                                },
                            });
                            if (newUs?.mores) {
                                const count_following = await prisma.followers.count({
                                    where: {
                                        OR: [
                                            { idFollowing: us.id, following: 2 }, // idIsFollowing's user is other people are following, the under is opposite too
                                            { idIsFollowed: us.id, followed: 2 },
                                        ],
                                    },
                                });
                                newUs.mores[0].followingAmount = count_following;
                                const count_followed = await prisma.followers.count({
                                    where: {
                                        OR: [
                                            { idFollowing: us.id, followed: 2 },
                                            { idIsFollowed: us.id, following: 2 },
                                        ],
                                    },
                                });
                                newUs.mores[0].followedAmount = count_followed;

                                const count_friends = await prisma.friends.count({
                                    where: {
                                        OR: [
                                            { idRequest: us.id, level: 2 },
                                            { idIsRequested: us.id, level: 2 },
                                        ],
                                    },
                                });
                                newUs.mores[0].friendAmount = count_friends;
                                const count_loves = await prisma.lovers.count({
                                    where: { idIsLoved: us.id },
                                });
                                newUs.mores[0].loverAmount = count_loves;
                                console.log('loves newUs', newUs, privates, mores, 'mores');
                                return newUs;
                            }
                        }),
                    );
                    console.log(newData, 'newData', id_reqs);

                    resolve(newData);
                }
                resolve(false);
            } catch (error) {
                reject(error);
            }
        });
    }
    getMore(id: string, offset: number, limit: number) {
        return new Promise(async (resolve: any, reject: (arg0: unknown) => void) => {
            try {
                // console.log(offset, limit);
                // const id_flwi = await db.follows
                //     .findAll({
                //         where: {
                //             [Op.or]: [
                //                 { id_following: id, flwing: 2 },
                //                 { id_followed: id, flwed: 2 },
                //             ],
                //         },
                //         offset: offset,
                //         limit: limit,
                //         attributes: ['id_followed', 'id_following'],
                //         raw: true,
                //     })
                //     .then((resl: { id_following: string; id_followed: string }[]) => {
                //         return resl.map((fl) => {
                //             if (fl.id_followed !== id) {
                //                 return fl.id_followed;
                //             } else {
                //                 return fl.id_following;
                //             }
                //         });
                //     });
                // const id_flwe = await db.follows
                //     .findAll({
                //         where: {
                //             [Op.or]: [
                //                 { id_following: id, flwed: 2 },
                //                 { id_followed: id, flwing: 2 },
                //             ],
                //         },
                //         offset: offset,
                //         limit: limit,
                //         attributes: ['id_following', 'id_followed'],
                //         raw: true,
                //     })
                //     .then((resl: { id_following: string; id_followed: string }[]) => {
                //         return resl.map((fl) => {
                //             if (fl.id_followed !== id) {
                //                 return fl.id_followed;
                //             } else {
                //                 return fl.id_following;
                //             }
                //         });
                //     });
                // console.log('i don t know');
                // const flwing_data = await db.users.findAll({
                //     where: { id: { [Op.in]: id_flwi } },
                //     attributes: ['id', 'avatar', 'fullName', 'gender'],
                //     raw: true,
                // });
                // const flwed_data = await db.users.findAll({
                //     where: { id: { [Op.in]: id_flwe } },
                //     attributes: ['id', 'avatar', 'fullName', 'gender'],
                //     raw: true,
                // });
                // resolve({ following: flwing_data, followed: flwed_data });
            } catch (error) {
                reject(error);
            }
        });
    }
    getByName(id: string, name: string, cateMore: string, searchMore: string, params: PropsParams) {
        return new Promise(async (resolve: (arg0: { status: number; data?: any }) => void, reject: (arg0: unknown) => void) => {
            try {
                console.log({ [`${cateMore}`]: searchMore });
                searchUsersInElasticsearchName(name);
                // if (cateMore && searchMore) {
                //     const data = await prisma.user.findMany({
                //         where: {
                //             id: { notIn: [id] },
                //             AND: [
                //                 {
                //                     fullName: {
                //                         contains: name,
                //                     },
                //                 },
                //                 {
                //                     [`${cateMore}`]: {
                //                         // other fields
                //                         contains: searchMore,
                //                     },
                //                 },
                //             ],
                //         },
                //         select: {
                //             ...params,
                //         },
                //     });
                //     if (data) resolve({ status: 1, data });
                // } else {
                //     const data = await prisma.user.findMany({
                //         where: {
                //             id: { notIn: [id] },
                //             fullName: {
                //                 contains: name,
                //             },
                //         },
                //         select: {
                //             ...params,
                //         },
                //     });
                //     if (data) resolve({ status: 1, data });
                // }

                resolve({ status: 0 });
            } catch (error) {
                reject(error);
            }
        });
    }
    setLg(id: string, lg: string) {
        return new Promise(async (resolve: (arg0: any) => void, reject: (arg0: unknown) => void) => {
            try {
                const data = await prisma.user.update({
                    where: { id: id },
                    data: {
                        firstPage: lg,
                    },
                    select: {
                        firstPage: true,
                    },
                });
                resolve(data.firstPage);
            } catch (error) {
                reject(error);
            }
        });
    }
    setAs(ass: boolean, id: string) {
        return new Promise(async (resolve: (arg0: any) => void, reject: (arg0: unknown) => void) => {
            try {
                const data = await prisma.user.update({
                    where: { id: id },
                    data: {
                        active: ass,
                    },
                    select: {
                        active: true,
                    },
                });
                resolve(data);
            } catch (error) {
                reject(error);
            }
        });
    }
    getNewMes(id: string) {
        return new Promise(async (resolve: (arg0: { user: any }) => void, reject: (arg0: unknown) => void) => {
            try {
                // const id_f = await db.friends
                //     .findAll({
                //         limit: 5,
                //         where: { idFriend: id, level: 1 },
                //         order: [['createdAt', 'DESC']],
                //         raw: true,
                //     })
                //     .then((x: { idCurrentUser: string }[]) => x.map((v) => v.idCurrentUser));
                // const us = await db.users
                //     .findAll({
                //         where: { id: { [Op.in]: id_f } },
                //         include: [
                //             {
                //                 model: db.friends,
                //                 where: {
                //                     idCurrentUser: { [Op.in]: id_f },
                //                     idFriend: id,
                //                     level: 1,
                //                 },
                //                 as: 'id_f_user',
                //                 attributes: ['createdAt'],
                //             },
                //         ],
                //         nest: true,
                //         attributes: ['id', 'avatar', 'fullName', 'nickName', 'gender'],
                //         raw: true,
                //     })
                //     .then((u: any) =>
                //         u.map((s: any) => {
                //             s.status = 1;
                //             return s;
                //         }),
                //     );
                // console.log('heeee---------------', id_f, 'ussss', us);
                // resolve({ user: us });
            } catch (error) {
                reject(error);
            }
        });
    }
    changesOne(
        id: string,
        id_req: string,
        value: any, //string | { id_file: string; type: string; name: string }
        params: {
            avatar?: string;
            background?: string;
            fullName?: string;
            mores?: { loverAmount: string };
            id_file?: string;
            type?: string;
            name?: string;
            title?: string;
        },
    ): Promise<
        | {
              loverData:
                  | {
                        id: number;
                        userId: string;
                        idIsLoved: string;
                        createdAt: Date;
                        updatedAt: Date;
                    }
                  | undefined;
              count_loves: number;
          }
        | string
    > {
        return new Promise(async (resolve: any, reject: (arg0: unknown) => void) => {
            try {
                const av = params.avatar;
                const akg = params.background;
                const name = params.fullName;
                const more = params.mores;
                // indexUserInElasticsearch(id);
                if (more) {
                    const lv = await prisma.lovers.findFirst({
                        where: {
                            AND: [{ userId: id_req }, { idIsLoved: id }],
                        },
                    });
                    const love = more.loverAmount;
                    let loverData;
                    if (love === 'love' && !lv) {
                        loverData = await prisma.lovers.create({
                            data: {
                                id: primaryKey(),
                                userId: id_req,
                                idIsLoved: id,
                            },
                        });
                    } else if (love === 'unLove' && lv) {
                        await prisma.lovers.delete({
                            where: {
                                id: lv.id,
                            },
                        });
                    }
                    const count_loves = await prisma.lovers.count({ where: { idIsLoved: id } });
                    await prisma.mores.update({
                        where: {
                            id: id,
                        },
                        data: {
                            loverAmount: count_loves,
                        },
                    });
                    console.log(count_loves, 'count_loves ');
                    resolve({ count_loves, loverData });
                } else {
                    console.log(value);
                    if (name) if (value.length > 30) resolve(0);
                    const data: any = await prisma.user.update({
                        where: { id: id },
                        data: { [`${av || akg || name}`]: av || akg ? value.id_file : value },
                    });
                    if (name) resolve(data[`${name}`]);
                    if (akg || av) resolve(value.id_file);
                }
            } catch (error) {
                reject(error);
            }
        });
    }
    changesMany(
        id: string,
        params: {
            biography: string;
            gender: number;
            hobby: string[];
            address: string;
            skill: string[];
            birthday: string;
            occupation: string;
            schoolName: string;
        },
        mores: {
            language: string[];
            relationships: string;
        },
        privacy: {
            position: string;
            address: string;
            birthday: string;
            relationship: string;
            gender: string;
            job: string;
            schoolName: string;
            occupation: string;
            hobby: string;
            skill: string;
            language: string;
            subAccount: string;
        },
    ) {
        return new Promise(async (resolve: (arg0: { countUser: number; countMores: number }) => void, reject: (arg0: unknown) => void) => {
            try {
                const dataUser = await prisma.user.updateMany({
                    where: { id: id },
                    data: { ...params },
                });
                const dataMores = await prisma.mores.updateMany({
                    where: { id: id },
                    data: { ...mores, privacy: privacy },
                });
                console.log(params, 'value', dataMores, dataUser);
                resolve({ countUser: dataUser.count, countMores: dataMores.count });
            } catch (error) {
                reject(error);
            }
        });
    }
    follow(
        id: string,
        id_fl: string,
    ): Promise<{
        ok: {
            id: string;
            idFollowing: string;
            idIsFollowed: string;
            following: number;
            followed: number;
            createdAt: Date;
            updatedAt: Date;
        };
        count_followed: number;
        count_following: number;
        count_followed_other: number;
        count_following_other: number;
    } | null> {
        return new Promise(async (resolve: any, reject: any) => {
            try {
                const date = moment().format('YYYY-MM-DDTHH:mm:ssZ');
                console.log(date, 'date');
                let ok: {
                    id: string;
                    idFollowing: string;
                    idIsFollowed: string;
                    following: number;
                    followed: number;
                    createdAt: Date;
                    updatedAt: Date;
                } | null = null;

                const follows = await xPrismaF.getFollowerAsync(id, id_fl);
                console.log(follows, 'follows_');

                if (!follows) {
                    ok = await prisma.followers.create({
                        data: {
                            id: primaryKey(),
                            idFollowing: id_fl,
                            idIsFollowed: id,
                            following: 2,
                            followed: 1,
                        },
                    });
                } else {
                    console.log(follows, id_fl, ' yyyyy__');

                    if (follows.idFollowing === id_fl) {
                        ok = await prisma.followers.update({
                            where: {
                                id: follows.id,
                            },
                            data: {
                                following: 2,
                                updatedAt: date,
                            },
                        });
                    } else if (follows.idIsFollowed === id_fl) {
                        ok = await prisma.followers.update({
                            where: {
                                id: follows.id,
                            },
                            data: {
                                followed: 2,
                                updatedAt: date,
                            },
                        });
                    }
                }
                const [count_followed, count_following, count_followed_other, count_following_other] = await Promise.all([
                    xPrismaF.countFollowed(id_fl),
                    xPrismaF.countFollowing(id_fl),
                    xPrismaF.countFollowed(id),
                    xPrismaF.countFollowing(id),
                ]);
                resolve({ ok, count_followed, count_following, count_followed_other, count_following_other });
            } catch (error) {
                reject(error);
            }
        });
    }
    Unfollow(
        id: string,
        id_fl: string,
    ): Promise<{
        ok: {
            id: string;
            idFollowing: string;
            idIsFollowed: string;
            following: number;
            followed: number;
            createdAt: Date;
            updatedAt: Date;
        };
        count_followed: number;
        count_following: number;
        count_followed_other: number;
        count_following_other: number;
    }> {
        return new Promise(async (resolve: any, reject: any) => {
            try {
                const date = moment().format('YYYY-MM-DDTHH:mm:ssZ');
                let ok: {
                    id: string;
                    idFollowing: string;
                    idIsFollowed: string;
                    following: number;
                    followed: number;
                    createdAt: Date;
                    updatedAt: Date;
                } | null = null;
                const follow = await xPrismaF.getFollowerAsync(id, id_fl);
                console.log(date, 'date', follow);
                if (follow) {
                    if ((follow.idFollowing === id_fl && follow.followed === 1) || (follow.idIsFollowed === id_fl && follow.following === 1)) {
                        ok = await prisma.followers.delete({
                            where: {
                                id: follow.id,
                            },
                        });
                    } else if (follow.idFollowing === id_fl) {
                        ok = await prisma.followers.update({
                            where: {
                                id: follow.id,
                            },
                            data: {
                                following: 1,
                            },
                        });
                    } else if (follow.idIsFollowed === id_fl) {
                        ok = await prisma.followers.update({
                            where: {
                                id: follow.id,
                            },
                            data: {
                                followed: 1,
                            },
                        });
                    }

                    const [count_followed, count_following, count_followed_other, count_following_other] = await Promise.all([
                        xPrismaF.countFollowed(id_fl),
                        xPrismaF.countFollowing(id_fl),
                        xPrismaF.countFollowed(id),
                        xPrismaF.countFollowing(id),
                    ]);
                    resolve({ ok, count_followed, count_following, count_followed_other, count_following_other });
                }
            } catch (error) {
                reject(error);
            }
        });
    }
    delSubAccount(id: string, ownId: string, phoneOrEmail: string) {
        return new Promise(async (resolve: (arg0: boolean) => void, reject: (arg0: unknown) => void) => {
            try {
                const sub = await prisma.subAccounts.findFirst({
                    where: {
                        userId: ownId,
                        phoneNumberEmail: phoneOrEmail,
                        accountId: id,
                    },
                });
                if (sub) {
                    const del = await prisma.subAccounts.delete({
                        where: {
                            id: sub.id,
                            userId: ownId,
                            phoneNumberEmail: phoneOrEmail,
                            accountId: id,
                        },
                    });
                    if (del) resolve(true);
                }
                resolve(false);
            } catch (error) {
                reject(error);
            }
        });
    }
}
export default new UserService();
