import { prisma } from '..';
import ClassFollower from './ClassFollower';
import ClassFriend from './ClassFriend';
import ClassLover from './ClassLover';
export const params: {
    [address: string]: boolean;
    biography: boolean;
    birthday: boolean;
    active: boolean;
    hobby: boolean;
    skill: boolean;
    occupation: boolean;
    schoolName: boolean;
    firstPage: boolean;
    secondPage: boolean;
    thirdPage: boolean;
} = {
    address: true,
    biography: true,
    birthday: true,
    active: true,
    hobby: true,
    skill: true,
    occupation: true,
    schoolName: true,
    firstPage: true,
    secondPage: true,
    thirdPage: true,
};
export const mores: {
    [position: string]: boolean;
    star: boolean;
    loverAmount: boolean;
    friendAmount: boolean;
    visitorAmount: boolean;
    followedAmount: boolean;
    followingAmount: boolean;
    relationship: boolean;
    language: boolean;
    createdAt: boolean;
    privacy: boolean;
} = {
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
};
export interface PropsUser {
    readonly id: string;
    avatar: any;
    fullName: string;
    gender: number;
    occupation: string | null;
    background: any;
    biography: string | null;
    firstPage: string;
    secondPage: string;
    thirdPage: string;
    active: boolean;
}
export interface PropsMores {
    id: string;
    followedAmount: number;
    followingAmount: number;
    friendAmount: number;
    loverAmount: number;
    position: string;
    star: number;
    language: string[];
    relationship: string;
    visitorAmount: number;
    privacy: {
        [position: string]: 'everyone' | 'friends' | 'only';
        address: 'everyone' | 'friends' | 'only';
        birthday: 'everyone' | 'friends' | 'only';
        relationship: 'everyone' | 'friends' | 'only';
        gender: 'everyone' | 'friends' | 'only';
        schoolName: 'everyone' | 'friends' | 'only';
        occupation: 'everyone' | 'friends' | 'only';
        hobby: 'everyone' | 'friends' | 'only';
        skill: 'everyone' | 'friends' | 'only';
        language: 'everyone' | 'friends' | 'only';
        subAccount: 'everyone' | 'friends' | 'only';
    };
    updatedAt: string;
    createdAt: string;
}
export interface PropsUserPer {
    readonly id: string;
    avatar: any;
    fullName: string;
    address: string;
    gender: number;
    birthday: string;
    background: any;
    biography: string;
    active: boolean;
    occupation: string;
    schoolName: string;
    skill: string[];
    hobby: string[];
    firstPage: string;
    secondPage: string;
    thirdPage: string;
    mores: PropsMores[];
    userRequest:
        | {
              id: string;
              idRequest: string;
              idIsRequested: string;
              level: number;
              createdAt: string | Date;
              updatedAt: string | Date;
          }[];
    userIsRequested:
        | {
              id: string;
              idRequest: string;
              idIsRequested: string;
              level: number;
              createdAt: string | Date;
              updatedAt: string | Date;
          }[];
    isLoved:
        | {
              id: string;
              userId: string;
              idIsLoved: string;
              createdAt: string | Date;
          }[];
    loved:
        | {
              id: string;
              userId: string;
              idIsLoved: string;
              createdAt: string | Date;
          }[];
    followings:
        | {
              id: string;
              idFollowing: string;
              idIsFollowed: string;
              following: number;
              followed: number;
              createdAt: string | Date;
          }[];
    followed:
        | {
              id: string;
              idFollowing: string;
              idIsFollowed: string;
              following: number;
              followed: number;
              createdAt: string | Date;
          }[];
    accountUser: {
        account: {
            id: string;
            fullName: string;
            avatar: string | null;
            gender: number;
            phoneNumberEmail: string;
        };
    }[];
}
class ClassUser {
    public getById = (id: string): Promise<PropsUser | null> =>
        prisma.user.findUnique({
            where: { id: id },
            select: {
                id: true,
                fullName: true,
                gender: true,
                avatar: true,
                background: true,
                ...params,
                password: false,
                phoneNumberEmail: false,
            },
        });
    public getLess = (id: string) =>
        prisma.user.findUnique({
            where: { id: id },
            select: { id: true, avatar: true, fullName: true, gender: true },
        });
    public getLessManyIn = (id: string[], skip?: number, take?: number) =>
        prisma.user.findMany({
            where: { id: { in: id } },
            skip,
            take,
            select: {
                id: true,
                avatar: true,
                fullName: true,
                gender: true,
            },
        });
    public getMore_userRequest_uerIsRequested = (id: string, id_fr: string) =>
        prisma.user.findUnique({
            where: { id: id },
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
                            { idRequest: id, idIsRequested: id_fr },
                            { idRequest: id_fr, idIsRequested: id },
                        ],
                    },
                },
                userIsRequested: {
                    where: {
                        OR: [
                            { idRequest: id_fr, idIsRequested: id },
                            { idRequest: id, idIsRequested: id_fr },
                        ],
                    },
                },
            },
        });
    public getMore_userRequest_uerIsRequestedIn = (id: string[], id_fr: string) =>
        prisma.user.findMany({
            where: { id: { in: id } },
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
                            { idRequest: id_fr, idIsRequested: { in: id } },
                            { idRequest: { in: id }, idIsRequested: id_fr },
                        ],
                    },
                },
                userIsRequested: {
                    where: {
                        OR: [
                            { idRequest: { in: id }, idIsRequested: id_fr },
                            { idRequest: id_fr, idIsRequested: { in: id } },
                        ],
                    },
                },
            },
        });
    public getByPrivacy = async (
        id: string,
        youId: string,
        level: 1 | 2 | number,
        privates: {
            [position: string]: string;
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
        },
    ): Promise<PropsUserPer> => {
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
        if (id !== youId) {
            Object.keys(params).forEach((key: any) => {
                params[key] = privates[key] === 'everyone' || (level === 2 && privates[key] !== 'only') ? true : false;
            });
            Object.keys(mores).forEach((key: any) => {
                mores[key] = privates[key] === 'everyone' || (level === 2 && privates[key] !== 'only') ? true : false;
            });
            if (privates.subAccount !== 'everyone' || !(level === 2)) {
                accountUser = false;
            }
        }
        const newUs: any = await prisma.user.findUnique({
            where: {
                id: id,
            },
            select: {
                id: true,
                fullName: true,
                gender: true,
                avatar: true,
                background: true,
                ...params,
                password: false,
                phoneNumberEmail: false,
                mores: {
                    select: {
                        ...mores,
                        privacy: true,
                    },
                },
                userRequest: {
                    where: {
                        OR: [
                            { idRequest: youId, idIsRequested: id },
                            { idRequest: id, idIsRequested: youId },
                        ],
                    },
                },
                userIsRequested: {
                    where: {
                        OR: [
                            { idRequest: id, idIsRequested: youId },
                            { idRequest: youId, idIsRequested: id },
                        ],
                    },
                },
                followings: {
                    where: {
                        OR: [
                            { idFollowing: youId, idIsFollowed: id },
                            { idFollowing: id, idIsFollowed: youId },
                        ],
                    },
                },
                followed: {
                    where: {
                        OR: [
                            { idFollowing: id, idIsFollowed: youId },
                            { idFollowing: youId, idIsFollowed: id },
                        ],
                    },
                },
                isLoved: {
                    where: {
                        userId: youId,
                    },
                },
                accountUser,
            },
        });
        if (newUs?.mores) {
            const [count_friends, count_following, count_followed, count_loves] = await Promise.all([
                ClassFriend.getCountFriend(id),
                ClassFollower.getCountFollowing(id),
                ClassFollower.getCountFollowed(id),
                ClassLover.getCount(id),
            ]);
            newUs.mores[0].followingAmount = count_following;
            newUs.mores[0].followedAmount = count_followed;
            newUs.mores[0].friendAmount = count_friends;
            newUs.mores[0].loverAmount = count_loves;
        }
        return newUs;
    };

    public async getOtherById(id: string[], youId: string): Promise<PropsUserPer[]> {
        const data = await this.getMore_userRequest_uerIsRequestedIn(id, youId);
        const newData = await Promise.all(
            data.map((us: { mores: { privacy: any }[]; id: string; userRequest: { level: number }[]; userIsRequested: { level: number }[] }) => {
                const privacy: any = us.mores[0].privacy;
                return this.getByPrivacy(us.id, youId, us.userRequest[0]?.level ?? us.userIsRequested[0]?.level, privacy);
            }),
        );
        return newData;
    }
}
export default new ClassUser();
