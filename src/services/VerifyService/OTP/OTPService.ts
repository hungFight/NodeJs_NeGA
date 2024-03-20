import nodemailer from 'nodemailer';
import { google } from 'googleapis';
import { Prohibit, VerifyMail } from '../../../models/mongodb/sendOTPMail';
import Security from '../../AuthServices/Security';
import moment from 'moment';
import { prisma } from '../../..';

class OTPService {
    sendOTP = async (phoneMail: string) => {
        return new Promise(async (resolve, reject) => {
            const users = await prisma.user.findMany({
                where: { phoneNumberEmail: phoneMail },
                select: {
                    id: true,
                },
            });
            if (!users.length) {
                resolve({ status: 0, message: "Account doesn't exist" });
            } else {
                const otp = Math.floor(Math.random() * (999999 - 100000) + 100000);
                const CLIENT_ID = process.env.CLIENT_ID;
                const CLIENT_SECRET = process.env.CLIENT_SECRET;
                const REDIRECT_URL = process.env.REDIRECT_URL;
                const REFRESH_TOKEN = process.env.REFRESH_TOKEN;
                const EMAIL_ADDRESS = process.env.EMAIL_ADDRESS;
                const OAUTH2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URL);

                OAUTH2Client.setCredentials({ refresh_token: REFRESH_TOKEN });

                // Download the helper library from https://www.twilio.com/docs/node/install
                // Set environment variables for your credentials
                // Read more at http://twil.io/secure
                const client = require('twilio')(process.env.ACCOUNTSID, process.env.TWILIO_AUTH_TOKEN);
                if (isNaN(Number(phoneMail))) {
                    try {
                        const otpHash = await Security.hash(String(otp));
                        const data: any = await Prohibit.findOne({ email: phoneMail });
                        const date = new Date(data?.createdAt);
                        const currentDate = new Date();
                        const a = [date.getFullYear(), date.getMonth() + 1, date.getDate()];
                        const b = [currentDate.getFullYear(), currentDate.getMonth() + 1, currentDate.getDate()];
                        const oldDate = moment(a);
                        const curDate = moment(b);
                        const checkDate: boolean = curDate.diff(oldDate) > 2592000000;
                        if (data?.sended <= 4 || !data || checkDate) {
                            const dbSend = await VerifyMail.create({
                                email: phoneMail,
                                otp: otpHash,
                            });
                            if (data?.sended > 0) {
                                await Prohibit.findOne({ email: data.email }).updateOne({
                                    $inc: { sended: +1 },
                                });
                            } else {
                                await Prohibit.create({
                                    email: dbSend.email,
                                    sended: 1,
                                });
                            }
                            const accessToken = await OAUTH2Client.getAccessToken();
                            const transporter = nodemailer.createTransport({
                                service: 'gmail',
                                auth: {
                                    type: 'OAuth2',
                                    user: String(EMAIL_ADDRESS),
                                    clientId: String(CLIENT_ID),
                                    clientSecret: String(CLIENT_SECRET),
                                    refreshToken: String(REFRESH_TOKEN),
                                    accessToken: String(accessToken),
                                },
                            });
                            const html = `<div style=" width: '100%', text-align: 'center' ">
                                                <p>Which is OTP Code to Verify Your Email. Please Enter your code to verify</p>
                                                <h3 style="padding: '50px', background-color: '#cdcbc8' ">${otp}</h3>
                                            </div>`;

                            transporter.sendMail(
                                {
                                    from: 'hungsendemail@gmail.com',
                                    to: phoneMail,
                                    subject: 'Verify Email',
                                    html: html,
                                },
                                (err, info) => {
                                    if (err) {
                                        reject(err);
                                    } else {
                                        console.log(err, info);
                                        resolve({ status: 1, message: 'Sended Successful!' });
                                    }
                                },
                            );
                        } else if (data?.sended > 4 && !checkDate) {
                            resolve({
                                status: 0,
                                message: 'You sended too 5 OTP, please wait until after the next 1 month. Thank you!',
                            });
                        }
                    } catch (error) {
                        reject(error);
                    }
                    console.log('no!');
                } else {
                    console.log(phoneMail);

                    client.messages
                        .create({ body: 'Hi there', from: '+84974034981', to: `+84${Number(phoneMail)}` })
                        .then((message: { sid: any }) => console.log(message.sid));

                    // .then(() => {
                    //     const readline = require('readline').createInterface({
                    //         input: process.stdin,
                    //         output: process.stdout,
                    //     });
                    //     readline.question('Please enter the OTP:', (otpCode: any) => {
                    //         client.verify.v2
                    //             .services(verifySid)
                    //             .verificationChecks.create({ to: '+84974034981', code: otpCode })
                    //             .then((verification_check: { status: any }) =>
                    //                 console.log('2', verification_check.status),
                    //             )
                    //             .then(() => readline.close());
                    //     });
                    // });
                    console.log('yes, absolutely');
                }
            }
        });
    };
}
export default new OTPService();
