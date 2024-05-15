import { prisma } from '../../..';
import { PropsParams } from '../../../services/WebsServices/UserServiceSN';
class xPrismaF {
    getFriendAsync = async (id: string, id_friend: string) =>
        await prisma.friends.findFirst({
            where: {
                OR: [
                    { idRequest: id, idIsRequested: id_friend },
                    { idRequest: id_friend, idIsRequested: id },
                ],
            },
        });
    getFriend = (id: string, id_friend: string) =>
        prisma.friends.findFirst({
            where: {
                OR: [
                    { idRequest: id, idIsRequested: id_friend },
                    { idRequest: id_friend, idIsRequested: id },
                ],
            },
        });
    getFollowerAsync = async (id: string, id_fl: string) =>
        await prisma.followers.findFirst({
            where: {
                OR: [
                    { idFollowing: id_fl, idIsFollowed: id },
                    { idFollowing: id, idIsFollowed: id_fl },
                ],
            },
        });
    getFollower = (id: string, id_fl: string) =>
        prisma.followers.findFirst({
            where: {
                OR: [
                    { idFollowing: id_fl, idIsFollowed: id },
                    { idFollowing: id, idIsFollowed: id_fl },
                ],
            },
        });
    countFollowedAsync = async (id: string) =>
        await prisma.followers.count({
            where: {
                OR: [
                    { idFollowing: id, followed: 2 }, // idIsFollowing's user is other people are following, the under is opposite too
                    { idIsFollowed: id, following: 2 },
                ],
            },
        });
    countFollowed = (id: string) =>
        prisma.followers.count({
            where: {
                OR: [
                    { idFollowing: id, followed: 2 }, // idIsFollowing's user is other people are following, the under is opposite too
                    { idIsFollowed: id, following: 2 },
                ],
            },
        });
    countFollowingAsync = async (id: string) =>
        await prisma.followers.count({
            where: {
                OR: [
                    { idFollowing: id, following: 2 }, // idIsFollowing's user is other people are following, the under is opposite too
                    { idIsFollowed: id, followed: 2 },
                ],
            },
        });
    countFollowing = (id: string) =>
        prisma.followers.count({
            where: {
                OR: [
                    { idFollowing: id, following: 2 }, // idIsFollowing's user is other people are following, the under is opposite too
                    { idIsFollowed: id, followed: 2 },
                ],
            },
        });
}
export default new xPrismaF();
