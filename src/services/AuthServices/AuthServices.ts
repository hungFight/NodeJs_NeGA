import moment from 'moment';
import { v4 as primaryKey } from 'uuid';
import bcrypt from 'bcryptjs';
import 'moment/locale/vi';
import express from 'express';
import Token from '../TokensService/Token';
import Security from './Security';
import UserSecurity from './Security';
import UserIT from '../interface/inTerFaceUser';
import token from '../TokensService/Token';
import { prisma } from '../../';
import { Redis } from 'ioredis';
import Validation from '../../utils/errors/Validation';
import UserServiceSN from '../WebsServices/UserServiceSN';
import { getRedis } from '../../connectDatabase/connect.Redis';
import { PropsUser } from '../../typescript/userType';
import CLassUser from '../../Classes/CLassUser';
moment.locale('vi');
export interface PropsRefreshToken {
    refreshToken: string;
    accept: boolean;
    mac: string;
    userId: string;
    status: { name: 'login' | 'logout' | 'invalid'; dateTime: Date | string; ip: string }[];
    userAgent: string;
}
class AuthServices {
    login = async (
        res: express.Response,
        phoneNumberEmail: string,
        password: string,
        IP_USER: string,
        IP_MAC: string,
        userAgent: string,
        addSubAccount?: boolean,
        id?: string,
        id_other?: string, // an another user login by subAccount
    ): Promise<
        | PropsUser
        | PropsUser[]
        | {
              account: {
                  id: string;
                  fullName: string;
                  phoneNumberEmail: string;
                  avatar: string | null;
                  gender: number;
              };
          }
        | null
    > => {
        return new Promise(async (resolve, reject) => {
            try {
                const userData: any = {};
                const user = await UserSecurity.checkUserEmail(phoneNumberEmail);
                const secret = await Security.hash(primaryKey());
                const jwtid = await Security.hash(primaryKey());

                if (!secret || !jwtid) reject('secret and JWTId is empty!');
                if (user && user?.length) {
                    console.log(user, 'user');
                    await Promise.all(
                        user.map(async (u: any) => {
                            const checkP = bcrypt.compareSync(password, u.password);
                            console.log(checkP, 'checkP');

                            if (checkP) {
                                if (addSubAccount && !id_other) {
                                    // in process add the subAccount
                                    delete u.password;
                                    Object.freeze(u);
                                    if (id && !(id === u.id)) {
                                        // create a new SubAccount
                                        const [sub, subCount] = await Promise.all([
                                            prisma.subAccounts.findFirst({
                                                where: {
                                                    userId: id,
                                                    phoneNumberEmail: phoneNumberEmail,
                                                    accountId: u.id,
                                                },
                                            }),
                                            prisma.subAccounts.count({
                                                where: {
                                                    userId: id,
                                                },
                                            }),
                                        ]);
                                        if (!sub && subCount < 5) {
                                            const resSub = await prisma.subAccounts.create({
                                                data: {
                                                    id: primaryKey(),
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
                                            resolve(resSub); //for sub account in personal page
                                        } else {
                                            resolve(null);
                                        }
                                    } else {
                                        resolve(null);
                                    }
                                } else {
                                    // in process login both
                                    const accessToken = Token.accessTokenF({ id: u.id }, secret, jwtid);
                                    const refreshToken = Token.refreshTokenF({ id: u.id }, secret, jwtid);
                                    delete u.phoneNumberEmail;
                                    delete u.password;
                                    console.log(u, 'uuu');

                                    Object.freeze(u);
                                    // if (id_other) {
                                    //     getRedis().del(id + 'refreshToken', (err, count) => {
                                    //         if (err) {
                                    //             console.log('Error getting refresh token in Redis', err);
                                    //             reject(err);
                                    //         }
                                    //         if (count) {
                                    //             resolve({ status: 200, message: 'Logged out !' });
                                    //         } else {
                                    //             resolve({ status: 401, message: 'unauthorized !' });
                                    //         }
                                    //     });
                                    // }
                                    if (accessToken)
                                        res.cookie('tks', 'Bearer ' + accessToken, {
                                            path: '/',
                                            secure: false, // Set to true if you're using HTTPS
                                            sameSite: 'strict', // Options: 'lax', 'strict', 'none'
                                            expires: new Date(new Date().getTime() + 30 * 86409000), // 30 days
                                            signed: true, // Sign the cookie
                                        });
                                    getRedis().get(u.id + 'refreshToken', (err, data) => {
                                        console.log(data, 'IN AuthService');
                                        if (err) reject(err);
                                        if (data && JSON.parse(data)?.length) {
                                            const newDa: PropsRefreshToken[] = JSON.parse(data);
                                            const foundDa = newDa.find((p) => p.mac === IP_MAC);
                                            if (!foundDa) {
                                                newDa.push({
                                                    refreshToken: refreshToken + '@_@' + secret,
                                                    accept: false,
                                                    mac: IP_MAC,
                                                    userId: u.id,
                                                    status: [{ name: 'login', dateTime: new Date(), ip: IP_USER }],
                                                    userAgent,
                                                });
                                            } else if (['logout', 'invalid'].includes(foundDa.status[foundDa.status.length - 1].name) && foundDa.accept) {
                                                newDa.map((p) => {
                                                    if (p.mac === foundDa.mac) {
                                                        p.status.push({ name: 'login', dateTime: new Date(), ip: IP_USER });
                                                        p.userAgent = userAgent;
                                                        p.refreshToken = refreshToken + '@_@' + secret;
                                                    }
                                                    return p;
                                                });
                                            }
                                            console.log(newDa, 'newDa', newDa[0].status);

                                            getRedis().set(u.id + 'refreshToken', JSON.stringify(newDa), (err: any, res: any) => {
                                                if (err) {
                                                    console.log('Error setting refreshToken', err);
                                                    reject(err);
                                                }
                                                getRedis().expire(u.id + 'refreshToken', 60 * 60); // 1h
                                            });
                                        } else {
                                            getRedis().set(
                                                u.id + 'refreshToken',
                                                JSON.stringify([
                                                    {
                                                        refreshToken: refreshToken + '@_@' + secret,
                                                        accept: true,
                                                        mac: IP_MAC,
                                                        userId: u.id,
                                                        status: [{ name: 'login', dateTime: new Date(), ip: IP_USER }],
                                                        userAgent,
                                                    },
                                                ]),
                                                (err: any, res: any) => {
                                                    if (err) {
                                                        console.log('Error setting refreshToken', err);
                                                        reject(err);
                                                    }
                                                    getRedis().expire(u.id + 'refreshToken', 60 * 60);
                                                },
                                            );
                                        }
                                    });
                                    if (addSubAccount && id) resolve(await CLassUser.getOtherById(u.id, id));
                                    else resolve(await CLassUser.getById(u.id));
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
    logOut = (req: any, res: any, IP_MAC: string, IP_USER: string) => {
        return new Promise(async (resolve, reject) => {
            try {
                const userId = req.cookies.k_user;
                console.log(req.cookies, '123456');
                getRedis().get(userId + 'refreshToken', (err, preData) => {
                    if (err) {
                        console.log('Error getting refresh token in Redis', err);
                        resolve({ status: 404, message: 'Error getting refresh token in Redis' });
                    }
                    if (preData) {
                        const parsed: PropsRefreshToken[] = JSON.parse(preData);
                        const currentDate = moment(new Date()).format('YYYY-MM-DD HH:mm:ss');
                        parsed.map((p) => {
                            if (p.mac === IP_MAC) {
                                p.refreshToken = '';
                                p.status.push({ ip: IP_USER, dateTime: currentDate, name: 'logout' });
                            }
                            return p;
                        });
                        getRedis().set(userId + 'refreshToken', JSON.stringify(parsed), (e) => {
                            if (e) resolve({ status: 401, message: 'Error in Redis!' });
                        });
                        getRedis().set(`online_duration: ${userId}`, currentDate, () => {
                            getRedis().expire(`online_duration: ${userId}`, 24 * 60 * 60);
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
                if (isNaN(data.phoneMail)) {
                    if (!Validation.validEmail(data.phoneMail)) resolve({ check: 5, message: 'Email invalid' });
                } else {
                    if (!Validation.validLength(data.phoneMail, 9, 11)) resolve({ check: 5, message: 'Phone Number must 9 - 11 characters' });
                }
                if (!Validation.validLength(data.password, 6, 100)) resolve({ check: 5, message: 'Password must be greater than 6 characters and less than 100' });
                const checkPhoneNumberEmail = await prisma.user.findMany({
                    where: { phoneNumberEmail: data.phoneMail },
                });
                const checkPassword = checkPhoneNumberEmail.map((User: any) => {
                    const checkP = bcrypt.compareSync(data.password, User.password);
                    return checkP;
                });
                if (checkPhoneNumberEmail.length >= 2) {
                    resolve({ result: 'Create failed', check: 2, acc: checkPhoneNumberEmail.length }); // limit
                    return;
                } else if (checkPassword.includes(true) === true) {
                    resolve({ result: 'Account is existed', check: 2, acc: checkPhoneNumberEmail.length });
                    return;
                } else {
                    try {
                        const password = await Security.hash(data.password);
                        const _id = primaryKey();
                        if (!_id) {
                            resolve({ result: 'Id is empty!', check: 2, acc: checkPhoneNumberEmail.length });
                            return;
                        }
                        const res = await prisma.user.create({
                            data: {
                                id: _id,
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
