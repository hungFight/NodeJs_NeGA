import bcrypt from 'bcryptjs';
import moment from 'moment';
import { VerifyMail } from '../../models/mongodb/sendOTPMail';
import { prisma } from '../..';
import { getRedis } from '../../connectDatabase/connect.Redis';
class VerifyService {
    verifyOTP(phoneMail: string, otp: string, whatKind: 'register' | 'changePassword') {
        return new Promise(async (resolve, reject) => {
            try {
                const key = `OTP_${phoneMail}`;
                function handle(userCount?: number) {
                    getRedis().get(key, (err, data) => {
                        if (err) reject(err);
                        if (data) {
                            const otpSaved = JSON.parse(data);
                            const checkDate: boolean = moment(otpSaved.createdAt).diff(moment(new Date()), 'minutes') <= 2;
                            if (checkDate) {
                                const checkOTP = bcrypt.compareSync(otp, otpSaved.key);
                                if (checkOTP) resolve({ status: 1, message: 'ok', acc: userCount });
                                else resolve({ status: 0, message: 'Wrong OTP!' });
                            } else resolve({ status: 0, message: 'Expired Code!' });
                        } else resolve({ status: 0, message: 'Expired Code!' });
                    });
                }
                if (whatKind === 'register') handle();
                else {
                    const users = await prisma.user.count({
                        where: { phoneNumberEmail: phoneMail },
                    });
                    if (!users) resolve({ status: 0, message: "Account doesn't exist" });
                    handle(users);
                }
            } catch (error) {
                reject(error);
            }
        });
    }
}
export default new VerifyService();
