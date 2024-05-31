import moment from 'moment';
import { esClient, prisma } from '../..';
import { v4 as primaryKey } from 'uuid';
import Validation from '../../utils/errors/Validation';
import CLassUser, { params } from '../../Classes/CLassUser';
import ClassFollower from '../../Classes/ClassFollower';
import ClassSubAccount from '../../Classes/ClassSubAccount';
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
export interface PropsParamsMores {
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
    getById(id: string, id_reqs: string[], first?: string) {
        return new Promise(async (resolve: any, reject: (arg0: unknown) => void) => {
            try {
                if (first) {
                    const data = await CLassUser.getById(id, params);
                    if (data) resolve(data);
                } else {
                    //personal page
                    const newData = await CLassUser.getOtherById(id_reqs, id);
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
    getByName(id: string, name: string, cateMore: string, searchMore: string) {
        return new Promise(async (resolve: (arg0: { status: number; data?: any }) => void, reject: (arg0: unknown) => void) => {
            try {
                // console.log({ [`${cateMore}`]: searchMore });
                // searchUsersInElasticsearchName(name);

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
                    const key = primaryKey();
                    let loverData;
                    if (!Validation.validUUID(key)) reject('Invalid UUID');
                    if (love === 'love' && !lv) {
                        loverData = await prisma.lovers.create({
                            data: {
                                id: key,
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

                const follows = await ClassFollower.getIdFollowing_idIsFollowed(id, id_fl);
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

                    if (follows.idFollowing === id_fl) ok = await ClassFollower.updateLevelFollowing(follows.id, 2);
                    else if (follows.idIsFollowed === id_fl) ok = await ClassFollower.updateLevelFollowed(follows.id, 2);
                }
                const [count_followed, count_following, count_followed_other, count_following_other] = await ClassFollower.getCountTwo(id, id_fl);
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
                const follow = await ClassFollower.getIdFollowing_idIsFollowed(id, id_fl);
                console.log(date, 'date', follow);
                if (follow) {
                    if ((follow.idFollowing === id_fl && follow.followed === 1) || (follow.idIsFollowed === id_fl && follow.following === 1)) ok = await ClassFollower.deleteIf(follow.id);
                    else if (follow.idFollowing === id_fl) {
                        ok = await ClassFollower.updateLevelFollowing(follow.id, 1);
                        prisma.followers.update({
                            where: {
                                id: follow.id,
                            },
                            data: {
                                following: 1,
                            },
                        });
                    } else if (follow.idIsFollowed === id_fl) ok = await ClassFollower.updateLevelFollowed(follow.id, 1);

                    const [count_followed, count_following, count_followed_other, count_following_other] = await ClassFollower.getCountTwo(id, id_fl);
                    resolve({ ok, count_followed, count_following, count_followed_other, count_following_other });
                }
            } catch (error) {
                reject(error);
            }
        });
    }
    delSubAccount(id: string) {
        return new Promise(async (resolve: (arg0: boolean) => void, reject: (arg0: unknown) => void) => {
            try {
                const del = await ClassSubAccount.delete(id);
                if (del) resolve(true);
                resolve(false);
            } catch (error) {
                reject(error);
            }
        });
    }
}
export default new UserService();
