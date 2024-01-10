import moment from 'moment';
import { v4 as primaryKey } from 'uuid';
import bcrypt from 'bcryptjs';
import 'moment/locale/vi';

import Token from '../TokensService/Token';
import Security from './Security';
import UserSecurity from './Security';
import UserIT from '../interface/inTerFaceUser';
import token from '../TokensService/Token';
import { prisma, redisClient } from '../../';
moment.locale('vi');
class AuthServices {
    login = async (
        phoneNumberEmail: string,
        password: string,
        IP_USER: string,
        subAccount?: boolean,
        id?: string,
        id_other?: string,
    ) => {
        return new Promise(async (resolve, reject) => {
            try {
                const userData: any = {};
                const isExist = await UserSecurity.checkUserEmail(phoneNumberEmail, subAccount, id_other, id);
                const { status, user } = isExist;
                const code = primaryKey();
                const secret: any = await Security.hash(code);
                if (status === 200 && user && user.length) {
                    await Promise.all(
                        user.map(async (u: any) => {
                            if (u.password) {
                                const checkP = bcrypt.compareSync(password, u.password);
                                if (checkP) {
                                    if (subAccount && !id_other) {
                                        // in process add the subAccount
                                        delete u.password;
                                        Object.freeze(u);
                                        if (id && !(id === u.id)) {
                                            // create a new SubAccount
                                            const sub = await prisma.subAccounts.findFirst({
                                                //find the account
                                                where: {
                                                    userId: id,
                                                    phoneNumberEmail: phoneNumberEmail,
                                                    accountId: u.id,
                                                },
                                            });
                                            const subCount = await prisma.subAccounts.count({
                                                where: {
                                                    userId: id,
                                                },
                                            });
                                            if (!sub && subCount < 5) {
                                                const resSub = await prisma.subAccounts.create({
                                                    // create
                                                    data: {
                                                        userId: id,
                                                        phoneNumberEmail: phoneNumberEmail,
                                                        accountId: u.id,
                                                    },
                                                    include: {
                                                        account: {
                                                            select: {
                                                                id: true,
                                                                fullName: true,
                                                                avatar: true,
                                                                gender: true,
                                                                phoneNumberEmail: true,
                                                            },
                                                        },
                                                    },
                                                });
                                                console.log('SubLogin', resSub);
                                                resolve(resSub);
                                            } else {
                                                resolve(null);
                                            }
                                        } else {
                                            resolve(null);
                                        }
                                    } else {
                                        // in process login both
                                        const accessToken = Token.accessTokenF(u.id, secret);
                                        const refreshToken = Token.refreshTokenF(
                                            { id: u.id, IP_USER: IP_USER + u.id },
                                            secret,
                                        );
                                        delete u.phoneNumberEmail;
                                        delete u.password;
                                        Object.freeze(u);
                                        if (id_other) {
                                            redisClient.del(id + 'refreshToken', (err, count) => {
                                                if (err) {
                                                    console.log('Error getting refresh token in Redis', err);
                                                    resolve({
                                                        status: 404,
                                                        message: 'Error getting refresh token in Redis',
                                                    });
                                                }
                                                if (count) {
                                                    resolve({ status: 200, message: 'Logged out !' });
                                                } else {
                                                    resolve({ status: 401, message: 'unauthorized !' });
                                                }
                                            });
                                        }
                                        redisClient.set(
                                            u.id + 'refreshToken',
                                            refreshToken + '@_@' + secret,
                                            (err: any, res: any) => {
                                                if (err) {
                                                    console.log('Error setting refreshToken', err);
                                                    resolve(null);
                                                }
                                                redisClient.expire(u.id + 'refreshToken', 15 * 24 * 60 * 60);
                                            },
                                        );
                                        resolve({ ...u, accessToken });
                                    }
                                }
                            }
                        }),
                    );
                }
                resolve(null);
            } catch (err) {
                reject(err);
            }
        });
    };
    logOut = (req: any, res: any) => {
        return new Promise(async (resolve, reject) => {
            try {
                const userId = req.cookies.k_user;
                console.log(req.cookies, '123456');
                redisClient.del(userId + 'refreshToken', (err, count) => {
                    if (err) {
                        console.log('Error getting refresh token in Redis', err);
                        resolve({ status: 404, message: 'Error getting refresh token in Redis' });
                    }
                    if (count) {
                        const currentDate = moment(new Date()).format('YYYY-MM-DD HH:mm:ss');
                        redisClient.set(`online_duration: ${userId}`, currentDate, () => {
                            redisClient.expire(`online_duration: ${userId}`, 24 * 60 * 60);
                        });
                        resolve({ status: 200, message: 'Logged out !' });
                    } else {
                        resolve({ status: 401, message: 'unauthorized !' });
                    }
                });
            } catch (error) {
                reject(error);
            }
        });
    };
    add = async (data: UserIT) => {
        return new Promise(async (resolve, reject) => {
            if (data) {
                const validateEmail = /^\w+([\\.-]?\w+)*@\w+([\\.-]?\w+)*(\.\w{2,5})+$/;
                if (isNaN(data.phoneMail)) {
                    if (!validateEmail.test(data.phoneMail)) resolve({ check: 5, message: 'Email invalid' });
                } else {
                    if (data.phoneMail.length <= 11 && data.phoneMail.length >= 9)
                        resolve({ check: 5, message: 'Phone Number must 9 - 11 characters' });
                }
                if (data.password.length <= 5)
                    resolve({ check: 5, message: 'Password must be greater than 6 characters' });
                const checkPhoneNumberEmail = await prisma.user.findMany({
                    where: { phoneNumberEmail: data.phoneMail },
                });
                const checkPassword = checkPhoneNumberEmail.map((User: any) => {
                    const checkP = bcrypt.compareSync(data.password, User.password);
                    return checkP;
                });
                if (checkPhoneNumberEmail.length >= 15) {
                    resolve({ result: 'Create failed', check: 2, acc: checkPhoneNumberEmail.length }); // limit
                    return;
                } else if (checkPassword.includes(true) === true) {
                    resolve({ result: 'Account is existed', check: 2, acc: checkPhoneNumberEmail.length });
                    return;
                } else {
                    try {
                        const password = await Security.hash(data.password);
                        const res = await prisma.user.create({
                            data: {
                                id: primaryKey(),
                                fullName: data.name,
                                password: password,
                                phoneNumberEmail: data.phoneMail,
                                gender: data.gender,
                                birthday: data.date,
                            },
                        });
                        if (res) {
                            const IsItExisting = await prisma.mores.findUnique({
                                where: {
                                    id: res.id,
                                },
                            });
                            console.log(IsItExisting, 'IsItExisting');

                            if (!IsItExisting) {
                                const mores = await prisma.mores.create({
                                    data: {
                                        id: res.id,
                                        privacy: {
                                            position: 'friends',
                                            address: 'friends',
                                            birthday: 'friends',
                                            relationship: 'friends',
                                            gender: 'friends',
                                            job: 'friends',
                                            schoolName: 'friends',
                                            occupation: 'friends',
                                            hobby: 'friends',
                                            skill: 'friends',
                                            language: 'friends',
                                            subAccount: 'friends',
                                        },
                                    },
                                });
                                if (mores) {
                                    resolve({
                                        result: 'ok, Created Successful',
                                        check: 1,
                                        acc: checkPhoneNumberEmail.length + 1,
                                    });
                                }
                            }
                        }
                        resolve({ result: 'ok, Created Failed', check: 0, acc: checkPhoneNumberEmail.length });
                    } catch (err) {
                        reject(err);
                    }
                }
            }
        });
    };
}
export default new AuthServices();
