import { prisma } from '../..';
import Security from '../AuthServices/Security';
import bcrypt from 'bcryptjs';

class Account {
    get(phoneMail: string) {
        return new Promise(async (resolve, reject) => {
            try {
                const user = await prisma.user.findMany({
                    where: { phoneNumberEmail: phoneMail },
                    select: {
                        id: true,
                        fullName: true,
                        avatar: true,
                        gender: true,
                    },
                });
                if (user.length > 0) {
                    resolve(user);
                } else {
                    reject(false);
                }
            } catch (error) {
                reject(error);
            }
        });
    }
    delete(idUser: string) {
        return new Promise(async (resolve, reject) => {
            try {
                const user = await prisma.user.findUnique({ where: { id: idUser } });
                if (user) {
                    const checkDU = await prisma.user.delete({
                        where: { id: idUser },
                    });
                    if (checkDU) {
                        resolve('Delete Successful!');
                    } else {
                        resolve('Delete Failed!');
                    }
                }
            } catch (err) {
                reject(err);
            }
        });
    }
    changePassword(id: string, password: string) {
        return new Promise(async (resolve, reject) => {
            try {
                const pre = await prisma.user.findUnique({ where: { id: id }, select: { password: true } });
                if (pre && pre.password) {
                    const check = await bcrypt.compareSync(password, pre.password);
                    console.log(check);

                    if (!check) {
                        const pass = await Security.hash(password);
                        const user = await prisma.user.update({ where: { id: id }, data: { password: pass } });
                        console.log(user);
                        if (user) resolve(1);
                    }
                    resolve(3);
                }
                resolve(0);
            } catch (error) {
                reject(error);
            }
        });
    }
}
export default new Account();
