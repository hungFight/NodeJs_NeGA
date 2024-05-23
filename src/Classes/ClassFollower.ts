import { prisma } from '..';

class ClassFollower {
    public create = (id_follower: string, idFollowing: string, idIsFollowed: string) =>
        prisma.followers.create({
            data: {
                id: id_follower,
                idFollowing,
                idIsFollowed,
                following: 2,
                followed: 1,
            },
        });
    public getIdFollowing_idIsFollowed = (id: string, id_fl: string) =>
        prisma.followers.findFirst({
            where: {
                OR: [
                    { idFollowing: id_fl, idIsFollowed: id },
                    { idFollowing: id, idIsFollowed: id_fl },
                ],
            },
        });
    public deleteIdFollowing_idIsFollowed = async (id: string, id_fl: string) => {
        const data = await this.getIdFollowing_idIsFollowed(id, id_fl);
        if (data) return prisma.followers.delete({ where: { id: data.id } });
        return null;
    };
    public getById = (id: string) =>
        prisma.followers.findUnique({
            where: {
                id,
            },
        });
    public getCountFollowed = (id: string) =>
        prisma.followers.count({
            where: {
                OR: [
                    { idFollowing: id, followed: 2 }, // idIsFollowing's user is other people are following, the under is opposite too
                    { idIsFollowed: id, following: 2 },
                ],
            },
        });
    public getCountFollowing = (id: string) =>
        prisma.followers.count({
            where: {
                OR: [
                    { idFollowing: id, following: 2 }, // idIsFollowing's user is other people are following, the under is opposite too
                    { idIsFollowed: id, followed: 2 },
                ],
            },
        });
    public deleteIf = async (id: string) => {
        if (await this.getById(id))
            return prisma.followers.delete({
                where: {
                    id,
                },
            });
        return null;
    };
    public delete = (id: string) => {
        return prisma.followers.delete({
            where: {
                id,
            },
        });
    };
    public updateLevelFollowing = (id: string, level: 1 | 2) =>
        prisma.followers.update({
            where: {
                id: id,
            },
            data: {
                following: level,
                updatedAt: new Date(),
            },
        });
    public updateLevelFollowed = (id: string, level: 1 | 2) =>
        prisma.followers.update({
            where: {
                id: id,
            },
            data: {
                followed: level,
                updatedAt: new Date(),
            },
        });
    public getCountTwo = (otherId: string, youId: string) =>
        Promise.all([this.getCountFollowed(youId), this.getCountFollowing(youId), this.getCountFollowed(otherId), this.getCountFollowing(otherId)]);
}
export default new ClassFollower();
