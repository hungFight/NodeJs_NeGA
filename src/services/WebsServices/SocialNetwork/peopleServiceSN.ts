import moment from 'moment';
import { v4 as primaryKey } from 'uuid';
import { prisma } from '../../..';
moment.locale('vi');
class PeopleService {
    setFriend(id: string, id_friend: string, per: string) {
        return new Promise(async (resolve, reject) => {
            try {
                const id_mess = primaryKey();
                if (id_mess) {
                    const dataF = await prisma.friends.findFirst({
                        where: {
                            OR: [
                                { idRequest: id, idIsRequested: id_friend },
                                { idRequest: id_friend, idIsRequested: id },
                            ],
                        },
                    });
                    if (!dataF) {
                        const newF = await prisma.friends.create({
                            data: {
                                idRequest: id,
                                idIsRequested: id_friend,
                                level: 1,
                            },
                        });
                        const id_user = newF.idRequest;
                        const id_fr = newF.idIsRequested;
                        if (!dataF && newF && id_user && id_fr) {
                            const follow = await prisma.followers.findFirst({
                                where: {
                                    OR: [
                                        { idFollowing: id_user, idIsFollowed: id_fr },
                                        { idFollowing: id_fr, idIsFollowed: id_user },
                                    ],
                                },
                            });
                            if (!follow) {
                                await prisma.followers.create({
                                    data: {
                                        idFollowing: id_user,
                                        idIsFollowed: id_fr,
                                        following: 2,
                                        followed: 1,
                                    },
                                });
                            }
                            const userF = await prisma.user.findUnique({
                                where: { id: id_user },
                                select: { id: true, avatar: true, fullName: true, gender: true },
                            });
                            const user: any = { ...userF };
                            user.status = 1;
                            user.id_f_user;
                            user.id_f_user = { createdAt: newF.createdAt };
                            if (per === 'yes') {
                                // per is in personalPage
                                const count_flw = await prisma.followers.count({
                                    where: {
                                        OR: [
                                            { idFollowing: id_fr, followed: 2 },
                                            { idIsFollowed: id_fr, following: 2 },
                                        ],
                                    },
                                });

                                resolve({
                                    // Setting Notification
                                    id_friend: id_fr,
                                    user,
                                    data: newF,
                                    quantity: 1,
                                    count_flw,
                                    id: id_fr,
                                    id_fl: id,
                                });
                            }
                            resolve({
                                id_friend: id_fr,
                                user,
                                data: newF,
                                quantity: 1,
                            });
                        } else {
                            console.log('Was friend');
                        }
                    }
                }
            } catch (error) {
                reject(error);
            }
        });
    }
    getFriends(id: string, offset: number, limit: number, type: string) {
        return new Promise(async (resolve, reject) => {
            try {
                if (type === 'yousent') {
                    const friend_ids = await prisma.friends
                        .findMany({
                            where: {
                                idRequest: id,
                                level: 1,
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

                    const dataYousent = await prisma.user.findMany({
                        where: { id: { in: friend_ids } },
                        skip: offset,
                        take: limit,
                        select: {
                            id: true,
                            avatar: true,
                            fullName: true,
                            gender: true,
                            birthday: true,
                        },
                    });
                    resolve(dataYousent);
                } else if (type === 'others') {
                    const ohters_id = await prisma.friends
                        .findMany({
                            where: {
                                idIsRequested: id,
                                level: 1,
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
                    const dataOthers = await prisma.user.findMany({
                        where: { id: { in: ohters_id } },
                        skip: offset,
                        take: limit,
                        select: {
                            id: true,
                            avatar: true,
                            fullName: true,
                            gender: true,
                            birthday: true,
                        },
                    });
                    resolve(dataOthers);
                } else {
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
                    const dataFriends = await prisma.user.findMany({
                        where: { id: { in: friends_id } },
                        skip: offset,
                        take: limit,
                        select: {
                            id: true,
                            avatar: true,
                            fullName: true,
                            gender: true,
                            birthday: true,
                        },
                    });
                    resolve(dataFriends);
                }
            } catch (error) {
                reject(error);
            }
        });
    }
    // {idCurrentUser: id_user, idFriend: id_req},{idCurrentUser: id_req,idFriend: id_user}
    delete(id_user: string, id_req: string, kindOf?: string, per?: string) {
        return new Promise(async (resolve, reject) => {
            try {
                if (kindOf) {
                    if (kindOf === 'friends') {
                        const dataF = await prisma.friends.findFirst({
                            where: {
                                OR: [
                                    { idRequest: id_user, idIsRequested: id_req },
                                    { idRequest: id_req, idIsRequested: id_user },
                                ],
                            },
                        });
                        if (dataF) {
                            const followD = await prisma.followers.findFirst({
                                where: {
                                    OR: [
                                        { idFollowing: id_user, idIsFollowed: id_req },
                                        { idFollowing: id_req, idIsFollowed: id_user },
                                    ],
                                },
                            });
                            if (followD) {
                                const f = await prisma.followers.delete({
                                    where: {
                                        id: followD.id,
                                        OR: [
                                            { idFollowing: id_user, idIsFollowed: id_req },
                                            { idFollowing: id_req, idIsFollowed: id_user },
                                        ],
                                    },
                                });
                                console.log(f, dataF, 'delete follow');
                            }

                            if (dataF) {
                                const data = await prisma.friends.delete({ where: { id: dataF.id } });
                                if (per === 'yes') {
                                    const count_flwe = await prisma.followers.count({
                                        where: {
                                            idIsFollowed: id_req,
                                            following: 2,
                                        },
                                    });
                                    resolve({ ok: dataF, count_flwe });
                                }
                                resolve({ ok: dataF });
                            }
                        }

                        resolve(false);
                    } else {
                        console.log('relative', kindOf);
                    }
                } else {
                    console.log('all');
                }
            } catch (error) {
                reject(error);
            }
        });
    }
    setConfirm(id: string, id_fr: string, kindOf: string, per?: string) {
        return new Promise(async (resolve, reject) => {
            try {
                if (kindOf) {
                    if (kindOf === 'friends') {
                        const dataF = await prisma.friends.findFirst({
                            where: {
                                idRequest: id_fr,
                                idIsRequested: id,
                                level: 1,
                            },
                        });
                        if (dataF) {
                            const frUp: any =
                                per === 'personal'
                                    ? await prisma.friends.update({
                                          where: {
                                              id: dataF.id,
                                              idRequest: dataF.idRequest,
                                              idIsRequested: dataF.idIsRequested,
                                              level: 1,
                                          },
                                          data: {
                                              level: 2,
                                          },
                                          include: {
                                              userRequest: {
                                                  select: {
                                                      address: true,
                                                      biography: true,
                                                      birthday: true,
                                                      gender: true,
                                                      hobby: true,
                                                      skill: true,
                                                      occupation: true,
                                                      schoolName: true,
                                                      accountUser: {
                                                          where: {
                                                              userId: dataF.idRequest,
                                                          },
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
                                                      },
                                                      mores: {
                                                          select: {
                                                              id: true,
                                                              position: true,
                                                              star: true,
                                                              loverAmount: true,
                                                              friendAmount: true,
                                                              visitorAmount: true,
                                                              followedAmount: true,
                                                              followingAmount: true,
                                                              relationship: true,
                                                              language: true,
                                                              createdAt: true,
                                                              privacy: true,
                                                          },
                                                      },
                                                  },
                                              },
                                          },
                                      })
                                    : await prisma.friends.update({
                                          where: {
                                              id: dataF.id,
                                              idRequest: dataF.idRequest,
                                              idIsRequested: dataF.idIsRequested,
                                              level: 1,
                                          },
                                          data: {
                                              level: 2,
                                          },
                                      });
                            const dataFL = await prisma.followers.findFirst({
                                where: {
                                    OR: [
                                        { idFollowing: id_fr, idIsFollowed: id },
                                        { idFollowing: id, idIsFollowed: id_fr },
                                    ],
                                },
                            });
                            if (dataFL) {
                                const newDF = await prisma.followers.update({
                                    where: {
                                        id: dataFL.id,
                                        idFollowing: dataFL.idFollowing,
                                        idIsFollowed: dataFL.idIsFollowed,
                                    },
                                    data: {
                                        followed: 2,
                                    },
                                });
                                const count_following = await prisma.followers.count({
                                    where: {
                                        OR: [
                                            { idFollowing: id_fr, following: 2 },
                                            { idIsFollowed: id_fr, followed: 2 },
                                        ],
                                    },
                                });
                                frUp.userRequest.mores[0].followingAmount = count_following;
                                const count_followed = await prisma.followers.count({
                                    where: {
                                        OR: [
                                            { idFollowing: id_fr, followed: 2 },
                                            { idIsFollowed: id_fr, following: 2 },
                                        ],
                                    },
                                });
                                frUp.userRequest.mores[0].followedAmount = count_followed;
                            }

                            const count_friends = await prisma.friends.count({
                                where: {
                                    OR: [
                                        { idRequest: id_fr, level: 2 },
                                        { idIsRequested: id_fr, level: 2 },
                                    ],
                                },
                            });
                            frUp.userRequest.mores[0].friendAmount = count_friends;
                            frUp.userRequest.mores[0].followedAmount;
                            resolve({ ok: frUp, id_fr: id_fr, id: id, count_friends });
                        }
                    }
                } else {
                    console.log('relatives');
                }
            } catch (error) {
                reject(error);
            }
        });
    }
    getStrangers(id: string, limit: number) {
        return new Promise(async (resolve, reject) => {
            try {
                const friend_ids = await prisma.friends
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
                // const relatives_id = await db.relatives
                //     .findAll({
                //         where: {
                //             [Op.or]: [
                //                 { id_user: id, really: 1 },
                //                 { id_relative: id, really: 1 },
                //             ],
                //         },
                //         attributes: ['id_user', 'id_relative', 'createdAt'],
                //         raw: true,
                //     })
                //     .then((rel: { id_user: string; id_relative: string }[]) =>
                //         rel.map((r) => (r.id_user !== id ? r.id_user : r.id_relative !== id ? r.id_relative : '')),
                //     );
                friend_ids.push(id);
                const attributes = ['id', 'avatar', 'fullName', 'nickName', 'gender', 'birthday'];

                const usersCount = await prisma.user.count({ where: { id: { notIn: friend_ids } } });
                const skip = Math.floor(Math.random() * usersCount);
                const strangers = await prisma.user.findMany({
                    where: {
                        id: { notIn: friend_ids },
                    },
                    take: limit,
                    skip,
                    select: {
                        id: true,
                        avatar: true,
                        fullName: true,
                        gender: true,
                        birthday: true,
                        userRequest: {
                            where: {
                                OR: [
                                    { idRequest: id, level: 1 },
                                    { idIsRequested: id, level: 1 },
                                ],
                            },
                        },
                        userIsRequested: {
                            where: {
                                OR: [
                                    { idRequest: id, level: 1 },
                                    { idIsRequested: id, level: 1 },
                                ],
                            },
                        },
                    },
                    // orderBy:
                });
                console.log(' randomStrangers', strangers, skip, Math.random(), usersCount);

                // const dataStrangers = await db.users.findAll({
                //     where: { id: { [Op.notIn]: all_id } },
                //     order: db.sequelize.random(),
                //     limit: limit,
                //     include: [
                //         {
                //             model: db.friends,
                //             where: {
                //                 [Op.or]: [
                //                     { idCurrentUser: id, level: 1 },
                //                     { idFriend: id, level: 1 },
                //                 ],
                //             },
                //             as: 'id_friend',
                //             attributes: ['idCurrentUser', 'idFriend', 'level', 'createdAt'],
                //             raw: true,
                //             required: false,
                //         },
                //         {
                //             model: db.friends,
                //             where: {
                //                 [Op.or]: [
                //                     { idCurrentUser: id, level: 1 },
                //                     { idFriend: id, level: 1 },
                //                 ],
                //             },
                //             as: 'id_f_user',
                //             attributes: ['idCurrentUser', 'idFriend', 'level', 'createdAt'],
                //             required: false,
                //         },
                //         {
                //             model: db.relatives,
                //             where: {
                //                 [Op.or]: [
                //                     { id_user: id, really: 0 },
                //                     { id_relative: id, really: 0 },
                //                 ],
                //             },
                //             as: 'id_r_user',
                //             attributes: ['id_user', 'id_relative', 'title', 'really', 'createdAt'],
                //             required: false,
                //         },
                //         {
                //             model: db.relatives,
                //             where: {
                //                 [Op.or]: [
                //                     { id_user: id, really: 0 },
                //                     { id_relative: id, really: 0 },
                //                 ],
                //             },
                //             as: 'id_relative',
                //             attributes: ['id_user', 'id_relative', 'title', 'really', 'createdAt'],
                //             required: false,
                //         },
                //     ],
                //     attributes: attributes,
                //     raw: true,
                //     nest: true,
                // });
                resolve(strangers);
            } catch (error) {
                reject(error);
            }
        });
    }
}
export default new PeopleService();
