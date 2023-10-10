import { prisma } from '../../..';
import { PropsParams } from '../../../services/WebsServices/UserServiceSN';
class xPrismaF {
    follower = async (id: string, id_fl: string) =>
        await prisma.followers.findFirst({
            where: {
                OR: [
                    { idFollowing: id_fl, idIsFollowed: id },
                    { idFollowing: id, idIsFollowed: id_fl },
                ],
            },
        });
}
export default new xPrismaF();
