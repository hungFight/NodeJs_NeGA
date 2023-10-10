import moment from 'moment';
import { prisma } from '../..';
import xPrismaF from '../../models/prisma/extension/xPrismaF';
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
class UserService {
    getById(id: string, id_reqs: string[], params: PropsParams, mores: PropsParamsMores, first?: string) {
        return new Promise(async (resolve: any, reject: (arg0: unknown) => void) => {
            try {
                const attrF = ['idCurrentUser', 'idFriend', 'level', 'createdAt'];
                const attrFl = ['id_following', 'id_followed', 'flwing', 'flwed', 'createdAt', 'updatedAt'];
                if (first) {
                    const data = await prisma.user.findUnique({
                        where: { id: id },
                        select: params,
                    });
                    console.log(data, 'data');

                    if (data) resolve(data);
                } else {
                    console.log(id_reqs, '({ status: 1, data: data })');
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

                    const newData = await new Promise(async (resolve: any, reject: any) => {
                        try {
                            const newData = await Promise.all(
                                data.map(
                                    async (us: {
                                        mores: { privacy: any }[];
                                        id: string;
                                        userRequest: { level: number }[];
                                        userIsRequested: { level: number }[];
                                    }) => {
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
                                        console.log(us.mores[0].privacy, 'us.mores[0].privacy');
                                        if (id !== us.id) {
                                            params.address =
                                                privates.address === 'everyone' ||
                                                ((us.userRequest[0]?.level === 2 ||
                                                    us.userIsRequested[0]?.level === 2) &&
                                                    privates.address !== 'only')
                                                    ? true
                                                    : false;
                                            params.birthday =
                                                privates.birthday === 'everyone' ||
                                                ((us.userRequest[0]?.level === 2 ||
                                                    us.userIsRequested[0]?.level === 2) &&
                                                    privates.birthday !== 'only')
                                                    ? true
                                                    : false;
                                            params.occupation =
                                                privates.occupation === 'everyone' ||
                                                ((us.userRequest[0]?.level === 2 ||
                                                    us.userIsRequested[0]?.level === 2) &&
                                                    privates.occupation !== 'only')
                                                    ? true
                                                    : false;
                                            params.hobby =
                                                privates.hobby === 'everyone' ||
                                                ((us.userRequest[0]?.level === 2 ||
                                                    us.userIsRequested[0]?.level === 2) &&
                                                    privates.hobby !== 'only')
                                                    ? true
                                                    : false;
                                            params.skill =
                                                privates.skill === 'everyone' ||
                                                ((us.userRequest[0]?.level === 2 ||
                                                    us.userIsRequested[0]?.level === 2) &&
                                                    privates.skill !== 'only')
                                                    ? true
                                                    : false;
                                            params.schoolName =
                                                privates.schoolName === 'everyone' ||
                                                ((us.userRequest[0]?.level === 2 ||
                                                    us.userIsRequested[0]?.level === 2) &&
                                                    privates.schoolName !== 'only')
                                                    ? true
                                                    : false;
                                            params.gender =
                                                privates.gender === 'everyone' ||
                                                ((us.userRequest[0]?.level === 2 ||
                                                    us.userIsRequested[0]?.level === 2) &&
                                                    privates.gender !== 'only')
                                                    ? true
                                                    : false;
                                            if (mores) {
                                                mores.language =
                                                    privates.language === 'everyone' ||
                                                    ((us.userRequest[0]?.level === 2 ||
                                                        us.userIsRequested[0]?.level === 2) &&
                                                        privates.position !== 'only')
                                                        ? true
                                                        : false;
                                                mores.position =
                                                    privates.position === 'everyone' ||
                                                    ((us.userRequest[0]?.level === 2 ||
                                                        us.userIsRequested[0]?.level === 2) &&
                                                        privates.position !== 'only')
                                                        ? true
                                                        : false;
                                            }
                                            if (
                                                privates.subAccount !== 'everyone' ||
                                                !(us.userRequest[0]?.level === 2 || us.userIsRequested[0]?.level === 2)
                                            ) {
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
                                    },
                                ),
                            );
                            console.log(newData, 'newData');

                            resolve(newData);
                        } catch (error) {
                            reject(error);
                        }
                    });
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
        return new Promise(
            async (resolve: (arg0: { status: number; data?: any }) => void, reject: (arg0: unknown) => void) => {
                try {
                    console.log({ [`${cateMore}`]: searchMore });
                    if (cateMore && searchMore) {
                        const data = await prisma.user.findMany({
                            where: {
                                id: { notIn: [id] },
                                AND: [
                                    {
                                        fullName: {
                                            contains: name,
                                        },
                                    },
                                    {
                                        [`${cateMore}`]: {
                                            contains: searchMore,
                                        },
                                    },
                                ],
                            },
                            select: {
                                ...params,
                            },
                        });
                        if (data) resolve({ status: 1, data });
                    } else {
                        const data = await prisma.user.findMany({
                            where: {
                                id: { notIn: [id] },
                                fullName: {
                                    contains: name,
                                },
                            },
                            select: {
                                ...params,
                            },
                        });
                        if (data) resolve({ status: 1, data });
                    }

                    resolve({ status: 0 });
                } catch (error) {
                    reject(error);
                }
            },
        );
    }
    setLg(id: string, lg: string) {
        return new Promise(async (resolve: (arg0: any) => void, reject: (arg0: unknown) => void) => {
            try {
                // const data = await db.users.update({ sn: lg }, { where: { id: id } });
                // resolve(data[0]);
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
        value: any, //string or buffer
        params: { avatar: string; background: string; fullName: string; mores: { loverAmount: string } },
    ) {
        return new Promise(async (resolve: any, reject: (arg0: unknown) => void) => {
            try {
                const av = params.avatar;
                const akg = params.background;
                const name = params.fullName;
                const more = params.mores;

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
                    if ((av || akg) && value) {
                        value = Buffer.from(value);
                    }
                    const data: any = await prisma.user.update({
                        where: { id: id },
                        data: { [`${av || akg || name}`]: value },
                    });
                    console.log('value', data);
                    if (data) resolve(data[`${av || akg || name}`]);
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
        return new Promise(
            async (
                resolve: (arg0: { countUser: number; countMores: number }) => void,
                reject: (arg0: unknown) => void,
            ) => {
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
            },
        );
    }
    follow(id: string, id_fl: string, follow?: string) {
        return new Promise(async (resolve: any, reject: any) => {
            try {
                const date = moment().format('YYYY-MM-DDTHH:mm:ssZ');
                console.log(date, 'date', follow);
                let ok = 0;

                const follows = await xPrismaF.follower(id, id_fl);
                if (!follows) {
                    const following = await prisma.followers.create({
                        data: {
                            idFollowing: id_fl,
                            idIsFollowed: id,
                            following: 2,
                            followed: 1,
                        },
                    });
                    if (following) ok = 1;
                } else {
                    if (follow === 'following') {
                        const following = await prisma.followers.update({
                            where: {
                                id: follows.id,
                                idFollowing: id_fl,
                                idIsFollowed: id,
                            },
                            data: {
                                following: 2,
                                updatedAt: date,
                            },
                        });
                        if (following) ok = 1;
                    } else if (follow === 'followed') {
                        const following = await prisma.followers.update({
                            where: {
                                id: follows.id,
                                idFollowing: id,
                                idIsFollowed: id_fl,
                            },
                            data: {
                                followed: 2,
                                updatedAt: date,
                            },
                        });
                        if (following) ok = 1;
                    } else {
                        console.log('follow here', follow);
                    }
                }

                const count_flwe = await prisma.followers.count({
                    where: {
                        OR: [
                            { idFollowing: id, followed: 2 }, // idIsFollowing's user is other people are following, the under is opposite too
                            { idIsFollowed: id, following: 2 },
                        ],
                    },
                });
                resolve({ ok, id, id_fl, count_flwe, follow: !follow ? 'no' : follow });
            } catch (error) {
                reject(error);
            }
        });
    }
    Unfollow(id: string, id_fl: string, unfollow: string) {
        return new Promise(async (resolve: any, reject: any) => {
            try {
                const date = moment().format('YYYY-MM-DDTHH:mm:ssZ');
                let ok = 0;
                const follow = await xPrismaF.follower(id, id_fl);
                console.log(date, 'date', unfollow, follow);

                if (follow) {
                    if (unfollow === 'following') {
                        if (follow.followed === 1) {
                            const flDel = await prisma.followers.delete({
                                where: {
                                    id: follow.id,
                                },
                            });
                            if (flDel) ok = 1;
                        } else {
                            const resFl = await prisma.followers.update({
                                where: {
                                    id: follow.id,
                                    idFollowing: id_fl,
                                    idIsFollowed: id,
                                },
                                data: {
                                    following: 1,
                                },
                            });

                            if (resFl) ok = 1;
                            console.log(resFl, unfollow);
                        }
                    } else {
                        if (follow.following === 1) {
                            const flDel = await prisma.followers.delete({
                                where: {
                                    id: follow.id,
                                },
                            });
                            if (flDel) ok = 1;
                        } else {
                            const resFl = await prisma.followers.update({
                                where: {
                                    id: follow.id,
                                    idFollowing: follow.idFollowing,
                                    idIsFollowed: follow.idIsFollowed,
                                },
                                data: {
                                    followed: 1,
                                },
                            });
                            if (resFl) ok = 1;
                            console.log(resFl, unfollow);
                        }
                    }
                    const count_flwe = await prisma.followers.count({
                        where: {
                            OR: [
                                { idFollowing: id, followed: 2 },
                                { idIsFollowed: id, following: 2 },
                            ],
                        },
                    });
                    resolve({ ok, id, id_fl, count_flwe, unfollow });
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
