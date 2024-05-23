import { prisma } from '..';

class ClassMore {
    public getPrivacyById = (id: string) =>
        prisma.mores.findUnique({
            where: { id },
            select: {
                id: true,
                privacy: true,
            },
        });
}
export default new ClassMore();
