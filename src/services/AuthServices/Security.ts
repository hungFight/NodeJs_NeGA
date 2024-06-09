import bcrypt from 'bcryptjs';
import { prisma } from '../..';
import ClassFollower from '../../Classes/ClassFollower';
import ClassFriend from '../../Classes/ClassFriend';
import ClassLover from '../../Classes/ClassLover';
import CLassUser from '../../Classes/CLassUser';
import { PropsUser } from '../../typescript/userType';
const hash = bcrypt.genSaltSync(10);

class Security {
    checkUserEmail(account: string, subAccount?: boolean, id_other?: string, id?: string) {
        return new Promise<PropsUser[] | null>(async (resolve, reject) => {
            try {
                if (id_other) {
                    // login in personal page to add subAccount
                    const user = await prisma.user.findFirst({
                        where: { id: id_other, phoneNumberEmail: account },
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
                        const [count_following, count_followed, count_friends, count_loves] = await Promise.all([
                            ClassFollower.getCountFollowing(user.id),
                            ClassFollower.getCountFollowed(user.id),
                            ClassFriend.getCountFriend(user.id),
                            ClassLover.getCount(user.id),
                        ]);
                        user.mores[0].loverAmount = count_loves;
                        user.mores[0].friendAmount = count_friends;
                        user.mores[0].followingAmount = count_following;
                        user.mores[0].followedAmount = count_followed;

                        console.log(user, 'user');
                        if (user) resolve([user]);
                        else resolve(null);
                    }
                } else {
                    const user = await CLassUser.getManyByAccount(account);
                    if (user?.length) resolve(user);
                    else resolve(null);
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
