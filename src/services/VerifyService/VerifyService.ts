import bcrypt from 'bcryptjs';
import moment from 'moment';
import { VerifyMail } from '../../models/mongodb/sendOTPMail';
import { prisma } from '../..';
class VerifyService {
    verifyOTP(phoneMail: string, otp: string) {
        return new Promise(async (resolve, reject) => {
            try {
                const users = await prisma.user.findMany({
                    where: { phoneNumberEmail: phoneMail },
                    select: {
                        id: true,
                    },
                });
                if (!users.length) resolve({ status: 0, message: "Account doesn't exist" });
                const data = await VerifyMail.find({ email: phoneMail }).exec();

                if (data.length > 0) {
                    const d: any = data[data.length - 1].createdAt;
                    const date = new Date(d);
                    const currentDate = new Date();
                    const a = [date.getFullYear(), date.getMonth() + 1, date.getDate(), date.getHours(), date.getMinutes(), date.getSeconds()];
                    const b = [
                        currentDate.getFullYear(),
                        currentDate.getMonth() + 1,
                        currentDate.getDate(),
                        currentDate.getHours(),
                        currentDate.getMinutes(),
                        currentDate.getSeconds(),
                    ];
                    const oldDate = moment(a);
                    const curDate = moment(b);
                    const checkDate: boolean = moment(curDate).diff(oldDate, 'minutes') < 2;
                    const checkOTP = bcrypt.compareSync(otp, data[data.length - 1].otp);
                    if (checkOTP && checkDate) console.log(checkDate, checkOTP, curDate.diff(oldDate));
                    if (checkDate) {
                        if (checkOTP) resolve({ status: 1, message: 'ok', acc: users.length });
                        resolve({ status: 0, message: 'Wrong OTP!' });
                    } else {
                        resolve({ status: 0, message: 'Expired Code!' });
                    }
                } else {
                    resolve({ status: 0, message: 'Expired Code!' });
                }
            } catch (error) {
                reject(error);
            }
        });
    }
}
export default new VerifyService();
