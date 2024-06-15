import bcrypt from 'bcryptjs';
import { prisma } from '../..';
import ClassFollower from '../../Classes/ClassFollower';
import ClassFriend from '../../Classes/ClassFriend';
import ClassLover from '../../Classes/ClassLover';
import CLassUser from '../../Classes/CLassUser';
import { PropsUser } from '../../typescript/userType';
const hash = bcrypt.genSaltSync(10);

class Security {
    checkUserEmail(account: string) {
        return new Promise<PropsUser[] | null>(async (resolve, reject) => {
            try {
                const user = await CLassUser.getManyByAccount(account, { password: true });
                if (user?.length) resolve(user);
                else resolve(null);
            } catch (err) {
                reject(err);
            }
        });
    }
    hash(data: string) {
        return bcrypt.hashSync(data, hash);
    }
}
export default new Security();
