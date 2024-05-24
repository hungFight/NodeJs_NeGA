import { prisma } from '..';

class ClassFriend {
    public getById = (id: string) =>
        prisma.friends.findUnique({
            where: {
                id,
            },
        });
    public getFriendBoth = (id: string, id_other: string) =>
        prisma.friends.findFirst({
            where: {
                OR: [
                    { idRequest: id, idIsRequested: id_other, level: 2 },
                    { idRequest: id_other, idIsRequested: id, level: 2 },
                ],
            },
        });
    public getFriendMany = (id: string) =>
        prisma.friends.findMany({
            where: {
                OR: [
                    { idRequest: id, level: 2 },
                    { idIsRequested: id, level: 2 },
                ],
            },
        });
    public getManyIdRequest = (id: string, level: 1 | 2) =>
        prisma.friends.findMany({
            where: {
                idRequest: id,
                level, // 1 not friend just request other, 2 is friend
            },
        });
    public getManyIdISRequest = (id: string, level: 1 | 2) =>
        prisma.friends.findMany({
            where: {
                idIsRequested: id,
                level,
            },
        });
    public getByIdRequest_IdIsRequested = (id: string, id_friend: string) =>
        prisma.friends.findFirst({
            where: {
                OR: [
                    { idRequest: id, idIsRequested: id_friend },
                    { idRequest: id_friend, idIsRequested: id },
                ],
            },
        });
    public getByIdRequest__IdIsRequested = (id: string, id_friend: string, level: number) =>
        prisma.friends.findFirst({
            where: {
                idRequest: id,
                idIsRequested: id_friend,
                level,
            },
        });
    public getCountFriend = (id: string) =>
        prisma.friends.count({
            where: {
                OR: [
                    { idRequest: id, level: 2 }, // idIsFollowing's user is other people are following, the under is opposite too
                    { idIsRequested: id, level: 2 },
                ],
            },
        });
    public create = (id_mess: string, id: string, id_friend: string) =>
        prisma.friends.create({
            data: {
                id: id_mess,
                idRequest: id,
                idIsRequested: id_friend,
                level: 1,
            },
        });
    public update = (id: string, level: number, checkLevel: number) =>
        prisma.friends.update({
            where: {
                id,
                level: checkLevel,
            },
            data: {
                level,
            },
        });
    public deleteIf = async (id: string) => {
        if (await this.getById(id)) return prisma.friends.delete({ where: { id: id } });
        return null;
    };
}
export default new ClassFriend();
