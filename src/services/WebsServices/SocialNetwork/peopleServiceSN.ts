import moment from 'moment';
import { v4 as primaryKey } from 'uuid';
import { prisma } from '../../..';
import xPrismaF from '../../../models/prisma/extension/xPrismaF';
import Validation from '../../../utils/errors/Validation';
moment.locale('vi');
class PeopleService {
    setFriend(
        id: string,
        id_friend: string,
        per: string,
    ): Promise<{
        id_friend: string;
        user: any;
        data: {
            id: string;
            idRequest: string;
            idIsRequested: string;
            level: number;
            createdAt: Date;
            updatedAt: Date;
        };
        quantity: number;
        count_followed?: number;
        count_following?: number;
        count_followed_other?: number;
        count_following_other?: number;
        follow?: {
            id: string;
            idFollowing: string;
            idIsFollowed: string;
            following: number;
            followed: number;
            createdAt: Date;
            updatedAt: Date;
        };
    }> {
        return new Promise(async (resolve, reject) => {
            try {
                const id_mess = primaryKey();
                if (id_mess) {
                    let dataF = await xPrismaF.getFriendAsync(id, id_friend);
                    if (!dataF) {
                        const newF = await prisma.friends.create({
                            data: {
                                id: id_mess,
                                idRequest: id,
                                idIsRequested: id_friend,
                                level: 1,
                            },
                        });
                        const id_user = newF.idRequest;
                        const id_fr = newF.idIsRequested;
                        // for notification
                        if (newF && id_user && id_fr) {
                            let [userF, follow] = await Promise.all([
                                prisma.user.findUnique({
                                    where: { id: id_user },
                                    select: { id: true, avatar: true, fullName: true, gender: true },
                                }),
                                xPrismaF.getFollower(id_user, id_fr),
                            ]);
                            const user: any = { ...userF };
                            user.status = 1;
                            user.id_f_user = { createdAt: newF.createdAt };
                            if (!follow) {
                                const id_flow = primaryKey();
                                follow = await prisma.followers.create({
                                    data: {
                                        id: id_flow,
                                        idFollowing: id,
                                        idIsFollowed: id_friend,
                                        following: 2,
                                        followed: 1,
                                    },
                                });
                            } else {
                                if (follow.idIsFollowed === id_user && follow.followed === 1) follow = await prisma.followers.update({ where: { id: follow.id }, data: { followed: 2 } });
                                else if (follow.idFollowing === id_user && follow.followed === 1) follow = await prisma.followers.update({ where: { id: follow.id }, data: { following: 2 } });
                            }
                            if (per === 'yes') {
                                // per is in personalPage
                                const [count_followed, count_following, count_followed_other, count_following_other] = await Promise.all([
                                    xPrismaF.countFollowed(id),
                                    xPrismaF.countFollowing(id),
                                    xPrismaF.countFollowed(id_friend),
                                    xPrismaF.countFollowing(id_friend),
                                ]);
                                resolve({
                                    // Setting Notification
                                    id_friend: id_fr,
                                    user,
                                    data: newF,
                                    quantity: 1,
                                    follow,
                                    count_followed,
                                    count_following,
                                    count_followed_other,
                                    count_following_other,
                                });
                            } else {
                                resolve({
                                    id_friend: id_fr,
                                    user,
                                    data: newF,
                                    quantity: 1,
                                    follow,
                                });
                            }
                        }
                    } else {
                        if (dataF.level === 1)
                            dataF = await prisma.friends.update({
                                where: {
                                    id: dataF.id,
                                },
                                data: {
                                    level: 2,
                                },
                            });

                        let follow = await xPrismaF.getFollowerAsync(dataF.idRequest, dataF.idIsRequested);
                        if (!follow) {
                            const id_flow = primaryKey();
                            follow = await prisma.followers.create({
                                data: {
                                    id: id_flow,
                                    idFollowing: id,
                                    idIsFollowed: id_friend,
                                    following: 2,
                                    followed: 1,
                                },
                            });
                        } else {
                            if (follow.idIsFollowed === id && follow.followed === 1) follow = await prisma.followers.update({ where: { id: follow.id }, data: { followed: 2 } });
                            else if (follow.idFollowing === id && follow.followed === 1) follow = await prisma.followers.update({ where: { id: follow.id }, data: { following: 2 } });
                        }
                        const userF = await prisma.user.findUnique({
                            // for notification
                            where: { id: id },
                            select: { id: true, avatar: true, fullName: true, gender: true },
                        });
                        const user: any = { ...userF };
                        user.status = 1;
                        user.id_f_user = { createdAt: dataF.createdAt };
                        resolve({
                            id_friend: dataF.idIsRequested,
                            user,
                            data: dataF,
                            quantity: 1,
                            follow,
                        });
                    }
                    console.log(dataF, 'dataF');
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
                        .then((fr: any[]) => fr.map((f) => (f.idIsRequested !== id ? f.idIsRequested : f.idRequest !== id ? f.idRequest : '')));

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
                        .then((fr: any[]) => fr.map((f) => (f.idIsRequested !== id ? f.idIsRequested : f.idRequest !== id ? f.idRequest : '')));
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
                        .then((fr: any[]) => fr.map((f) => (f.idIsRequested !== id ? f.idIsRequested : f.idRequest !== id ? f.idRequest : '')));
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
    delete(
        id_user: string,
        id_req: string,
        kindOf?: string,
        per?: 'personal',
    ): Promise<
        | {
              ok: {
                  id: string;
                  idRequest: string;
                  idIsRequested: string;
                  level: number;
                  createdAt: Date;
                  updatedAt: Date;
              };
              count_followed?: number;
              count_following?: number;
              count_followed_other?: number;
              count_following_other?: number;
          }
        | false
    > {
        return new Promise(async (resolve, reject) => {
            try {
                if (kindOf) {
                    if (kindOf === 'friends') {
                        const dataF = await xPrismaF.getFriendAsync(id_user, id_req);
                        if (dataF) {
                            const [followD, _] = await Promise.all([xPrismaF.getFollower(id_user, id_req), prisma.friends.delete({ where: { id: dataF.id } })]);
                            if (followD)
                                await prisma.followers.delete({
                                    where: {
                                        id: followD.id,
                                    },
                                });
                            if (per === 'personal') {
                                const [count_followed, count_following, count_followed_other, count_following_other] = await Promise.all([
                                    xPrismaF.countFollowed(id_user),
                                    xPrismaF.countFollowing(id_user),
                                    xPrismaF.countFollowed(id_req),
                                    xPrismaF.countFollowing(id_req),
                                ]);
                                resolve({ ok: dataF, count_followed, count_following, count_followed_other, count_following_other });
                            } else resolve({ ok: dataF });
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
    setConfirm(
        id: string,
        id_fr: string,
        kindOf: string,
        per?: string,
    ): Promise<
        | {
              ok: any;
              follower: {
                  id: string;
                  idFollowing: string;
                  idIsFollowed: string;
                  following: number;
                  followed: number;
                  createdAt: Date;
                  updatedAt: Date;
              };
              count_following: number;
              count_followed: number;
              count_following_other: number;
              count_followed_other: number;
              count_friends: number;
              count_friends_other: number;
          }
        | false
    > {
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
                            let [friendData, dataFL] = await Promise.all([
                                per === 'personal'
                                    ? prisma.friends.update({
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
                                              userIsRequested: {
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
                                                              userId: dataF.idIsRequested,
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
                                    : prisma.friends.update({
                                          where: {
                                              id: dataF.id,
                                              idRequest: dataF.idRequest,
                                              idIsRequested: dataF.idIsRequested,
                                              level: 1,
                                          },
                                          data: {
                                              level: 2,
                                          },
                                      }),
                                xPrismaF.getFollower(id_fr, id),
                            ]);
                            if (dataFL) {
                                const newDF = await prisma.followers.update({
                                    where: {
                                        id: dataFL.id,
                                    },
                                    data: {
                                        [`${dataFL.idFollowing === id ? 'following' : 'followed'}`]: 2,
                                        updatedAt: new Date(),
                                    },
                                });
                                const [count_following, count_followed, count_following_other, count_followed_other, count_friends, count_friends_other] = await Promise.all([
                                    xPrismaF.countFollowing(id),
                                    xPrismaF.countFollowed(id),
                                    xPrismaF.countFollowing(id_fr),
                                    xPrismaF.countFollowed(id_fr),
                                    xPrismaF.countFriends(id),
                                    xPrismaF.countFriends(id_fr),
                                ]);
                                const fffff: any = friendData;
                                fffff.userRequest.mores[0].followingAmount = count_following_other;
                                fffff.userRequest.mores[0].followedAmount = count_followed_other;
                                fffff.userRequest.mores[0].friendAmount = count_friends_other;
                                fffff.userIsRequested.mores[0].followingAmount = count_following;
                                fffff.userIsRequested.mores[0].followedAmount = count_followed;
                                fffff.userIsRequested.mores[0].friendAmount = count_friends;
                                resolve({ ok: fffff, follower: newDF, count_following, count_followed, count_following_other, count_followed_other, count_friends, count_friends_other });
                            } else {
                                const key = primaryKey();
                                const valid = new Validation();
                                if (valid.validUUID(key)) {
                                    dataFL = await prisma.followers.create({
                                        data: {
                                            id: key,
                                            idFollowing: id,
                                            idIsFollowed: id_fr,
                                            following: 2,
                                            followed: 1,
                                        },
                                    });
                                    const newDF = await prisma.followers.update({
                                        where: {
                                            id: dataFL.id,
                                        },
                                        data: {
                                            [`${dataFL.idFollowing === id ? 'following' : 'followed'}`]: 2,
                                            updatedAt: new Date(),
                                        },
                                    });
                                    const [count_following, count_followed, count_following_other, count_followed_other, count_friends, count_friends_other] = await Promise.all([
                                        xPrismaF.countFollowing(id),
                                        xPrismaF.countFollowed(id),
                                        xPrismaF.countFollowing(id_fr),
                                        xPrismaF.countFollowed(id_fr),
                                        xPrismaF.countFriends(id),
                                        xPrismaF.countFriends(id_fr),
                                    ]);
                                    const fffff: any = friendData;
                                    fffff.userRequest.mores[0].followingAmount = count_following_other;
                                    fffff.userRequest.mores[0].followedAmount = count_followed_other;
                                    fffff.userRequest.mores[0].friendAmount = count_friends_other;
                                    fffff.userIsRequested.mores[0].followingAmount = count_following;
                                    fffff.userIsRequested.mores[0].followedAmount = count_followed;
                                    fffff.userIsRequested.mores[0].friendAmount = count_friends;
                                    resolve({ ok: fffff, follower: newDF, count_following, count_followed, count_following_other, count_followed_other, count_friends, count_friends_other });
                                } else reject('Invalid UUID');
                            }
                        } else resolve(false);
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
                    .then((fr: any[]) => fr.map((f) => (f.idIsRequested !== id ? f.idIsRequested : f.idRequest !== id ? f.idRequest : '')));
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
