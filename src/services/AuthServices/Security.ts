import bcrypt from 'bcryptjs';
import { prisma } from '../..';
const hash = bcrypt.genSaltSync(10);

class Security {
    checkUserEmail(email: string, subAccount?: boolean, id_other?: string, id?: string) {
        return new Promise<
            | {
                  status: number;
                  user?: {
                      id: string;
                      fullName: string;
                      phoneNumberEmail: string;
                      password: string;
                      avatar: Buffer | null;
                  }[];
              }
            | any
        >(async (resolve, reject) => {
            try {
                if (id_other) {
                    const user = await prisma.user.findFirst({
                        where: { id: id_other, phoneNumberEmail: email },
                        include: {
                            mores: true,
                            userRequest: {
                                where: {
                                    OR: [
                                        { idRequest: id, idIsRequested: id_other },
                                        { idRequest: id_other, idIsRequested: id },
                                    ],
                                },
                            },
                            userIsRequested: {
                                where: {
                                    OR: [
                                        { idRequest: id_other, idIsRequested: id },
                                        { idRequest: id, idIsRequested: id_other },
                                    ],
                                },
                            },
                            followings: {
                                where: {
                                    OR: [
                                        { idFollowing: id, idIsFollowed: id_other },
                                        { idFollowing: id_other, idIsFollowed: id },
                                    ],
                                },
                            },
                            followed: {
                                where: {
                                    OR: [
                                        { idFollowing: id_other, idIsFollowed: id },
                                        { idFollowing: id, idIsFollowed: id_other },
                                    ],
                                },
                            },
                            isLoved: {
                                where: {
                                    userId: id,
                                },
                            },
                            accountUser: {
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
                        },
                    });
                    if (user) {
                        const newData = await new Promise<typeof user>(async (resolveF, reject) => {
                            try {
                                const count_following = await prisma.followers.count({
                                    where: {
                                        OR: [
                                            { idFollowing: user.id, following: 2 },
                                            { idIsFollowed: user.id, followed: 2 },
                                        ],
                                    },
                                });

                                const count_followed = await prisma.followers.count({
                                    where: {
                                        OR: [
                                            { idFollowing: user.id, followed: 2 },
                                            { idIsFollowed: user.id, following: 2 },
                                        ],
                                    },
                                });
                                const count_friends = await prisma.friends.count({
                                    where: {
                                        OR: [
                                            { idRequest: user.id, level: 2 },
                                            { idIsRequested: user.id, level: 2 },
                                        ],
                                    },
                                });
                                const count_loves = await prisma.lovers.count({ where: { idIsLoved: user.id } });
                                user.mores[0].loverAmount = count_loves;
                                user.mores[0].friendAmount = count_friends;
                                user.mores[0].followingAmount = count_following;
                                user.mores[0].followedAmount = count_followed;
                                resolveF(user);
                            } catch (error) {
                                reject(error);
                            }
                        });
                        console.log(newData, 'user');
                        if (newData) {
                            resolve({ status: 200, user: [newData] });
                        } else {
                            resolve({ status: 1111 });
                        }
                    }
                } else {
                    const user = await prisma.user.findMany({
                        where: { phoneNumberEmail: email },
                        select: {
                            id: true,
                            phoneNumberEmail: true,
                            password: true,
                            avatar: subAccount ? true : false,
                            fullName: true,
                        },
                    });
                    if (user?.length) {
                        resolve({ status: 200, user });
                    } else {
                        resolve({ status: 1111 });
                    }
                }
            } catch (err) {
                reject(err);
            }
        });
    }
    hash(data: string) {
        return new Promise<string>(async (resolve, reject) => {
            try {
                const hashPass = await bcrypt.hashSync(data, hash);
                resolve(hashPass);
            } catch (e) {
                reject(e);
            }
        });
    }
}
export default new Security();
