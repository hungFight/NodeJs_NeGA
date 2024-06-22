import express from 'express';
import { Prohibit, VerifyMail } from '../../../models/mongodb/sendOTPMail';
import Security from '../../AuthServices/Security';
import moment from 'moment';
import { prisma } from '../../..';
import Validation from '../../../utils/errors/Validation';
import twilio from 'twilio';
import { getRedis } from '../../../connectDatabase/connect.Redis';
import NotFound from '../../../utils/errors/NotFound';
import nodemailer from 'nodemailer';
import ServerError from '../../../utils/errors/ServerError';
// status = 0 is failed
class OTPService {
    sendOTP = async (phoneMail: string, codeId: string, macIP: string, res: express.Response, whatKind: 'register' | 'changePassword') => {
        return new Promise(async (resolve, reject) => {
            try {
                if (whatKind === 'register') {
                    handle();
                } else {
                    const users = await prisma.user.findMany({
                        where: { phoneNumberEmail: phoneMail },
                        select: {
                            id: true,
                        },
                    });
                    if (!users.length) resolve({ status: 0, message: "Account doesn't exist" });
                    handle();
                }

                function handle() {
                    const otp = String(Math.floor(Math.random() * (999999 - 100000) + 100000));
                    if (Validation.validPhoneNumber(phoneMail)) {
                        const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;
                        const TWILIO_SID = process.env.TWILIO_SID;
                        const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;

                        if (TWILIO_SID && TWILIO_AUTH_TOKEN && TWILIO_PHONE_NUMBER) {
                            const otpHashed = Security.hash(otp);
                            const client = twilio(TWILIO_SID, TWILIO_AUTH_TOKEN);
                            const key = `OTP_${phoneMail}`;
                            console.log(key, macIP);
                            const date = new Date();
                            return client.messages
                                .create({ body: `NeGA. Here is your code: ${otp} and expired in 1 minute`, from: TWILIO_PHONE_NUMBER, to: phoneMail })
                                .then((data) => {
                                    getRedis().set(key, JSON.stringify({ key: otpHashed, createdAt: date }), (err) => {
                                        if (err) {
                                            console.error('Redis set error:', err);
                                            reject(err);
                                        }
                                        getRedis().expire(key, 70, (expireErr) => {
                                            if (expireErr) {
                                                console.error('Redis expire error:', expireErr);
                                                reject(expireErr);
                                            }
                                        });
                                        getRedis().incr(`control_sendOTP_${phoneMail}`, (Err) => {
                                            if (Err) {
                                                console.error('Redis incr error:', Err);
                                                reject(Err);
                                            }
                                            getRedis().expire(key, 5 * 60, (expireErr) => {
                                                if (expireErr) {
                                                    console.error('Redis expire incr error:', expireErr);
                                                    reject(expireErr);
                                                }
                                            });
                                        });
                                        return res.status(200).json({ status: 1, phoneEmail: phoneMail, id: codeId });
                                    });
                                })
                                .catch((err) => reject(err));
                        }
                    } else if (Validation.validEmail(phoneMail)) {
                        const MAILER_USER = process.env.MAILER_USER;
                        const MAILER_PASSWORD = process.env.MAILER_PASSWORD;
                        if (otp && MAILER_USER && MAILER_PASSWORD) {
                            const otpHashed = Security.hash(otp);
                            const key = `OTP_${phoneMail}`;
                            console.log(key, macIP);
                            const date = new Date();
                            const transporter = nodemailer.createTransport({
                                service: 'gmail',
                                auth: {
                                    user: MAILER_USER,
                                    pass: MAILER_PASSWORD,
                                },
                            });
                            const mailOptions = {
                                from: MAILER_USER,
                                to: phoneMail,
                                subject: `NeGA code: ${otp} and expired in 1 minute`,
                                text: `NeGA. Here is your code: ${otp} and expired in 1 minute`,
                            };
                            return transporter.sendMail(mailOptions, function (error: any, info: { response: string }) {
                                if (error) {
                                    reject(error);
                                } else {
                                    return getRedis().set(key, JSON.stringify({ key: otpHashed, createdAt: date }), (err) => {
                                        if (err) {
                                            console.error('Redis set error:', err);
                                            reject(err);
                                        }
                                        getRedis().expire(key, 60 * 60, (expireErr) => {
                                            if (expireErr) {
                                                console.error('Redis expire error:', expireErr);
                                                reject(expireErr);
                                            }
                                        });
                                        return res.status(200).json({ status: 1, phoneEmail: phoneMail, id: codeId });
                                    });
                                }
                            });
                        }
                    } else {
                        throw new NotFound('SendOTP', 'Invalid data');
                    }
                }
            } catch (error) {
                reject(error);
            }
        });
    };
}
export default new OTPService();
