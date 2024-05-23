import { prisma } from '..';

class ClassSubAccount {
    public getById = (id: string) =>
        prisma.subAccounts.findUnique({
            where: {
                id,
            },
        });
    public getFirst = (ownId: string, phoneOrEmail: string, id: string) =>
        prisma.subAccounts.findFirst({
            where: {
                userId: ownId,
                phoneNumberEmail: phoneOrEmail,
                accountId: id,
            },
        });
    public delete = async (id: string) => {
        if (await this.getById(id)) return prisma.subAccounts.delete({ where: { id: id } });
        return null;
    };
}
export default new ClassSubAccount();
