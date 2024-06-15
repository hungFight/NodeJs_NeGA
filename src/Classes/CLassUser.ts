import { prisma } from '..';
import { PropsSelectUser, PropsUser, PropsUserPer } from '../typescript/userType';
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

class ClassUser {
    public getById = (id: string, select?: PropsSelectUser): Promise<PropsUser | null> =>
        prisma.user.findUnique({
            where: { id: id },
            select: {
                id: true,
                fullName: true,
                gender: true,
                avatar: true,
                background: true,
                ...select,
                password: false,
                phoneNumberEmail: false,
            },
        });
    public getByAccount = (account: string, select?: PropsSelectUser): Promise<PropsUser | null> =>
        prisma.user.findFirst({
            where: { phoneNumberEmail: account },
            select: {
                id: true,
                fullName: true,
                gender: true,
                avatar: true,
                background: true,
                ...select,
                password: false,
                phoneNumberEmail: false,
            },
        });
    public getManyByAccount = (account: string, select?: PropsSelectUser): Promise<PropsUser[] | null> =>
        prisma.user.findMany({
            where: { phoneNumberEmail: account },
            select: {
                id: true,
                fullName: true,
                gender: true,
                avatar: true,
                background: true,
                ...select,
                password: select?.password ?? false,
                phoneNumberEmail: false,
            },
        });
    public getManyInById = (id: string[], skip?: number, take?: number) =>
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
