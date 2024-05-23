import { prisma } from '..';

class ClassLover {
    public getCount = (id: string) =>
        prisma.lovers.count({
            where: { idIsLoved: id },
        });
}
export default new ClassLover();
