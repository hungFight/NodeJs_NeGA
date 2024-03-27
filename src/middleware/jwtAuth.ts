import express from 'express';
import jwt from 'jsonwebtoken';
import token from '../services/TokensService/Token';
import moment from 'moment';
import ServerError from '../utils/errors/ServerError';
import { Redis } from 'ioredis';
moment.locale('vi');
// status = 0 is login again
// status = 9999 is server busy
// status = 8888 is Unauthorized
class JWTVERIFY {
    verifyToken = async (req: express.Request, res: any, next: express.NextFunction) => {
        try {
            const userId = req.cookies.k_user;
            const authHeader = req.cookies.tks;
            const redisClient: Redis = res.redisClient;
            const userAgent = req.headers['user-agent'];
            const dateTime = moment().format('HH:mm:ss DD-MM-YYYY');
            console.log('User Agent:', userAgent);
            const warning = JSON.stringify({
                id: 0,
                message: 'There was an person trying to login to your Account from an another site!',
            });
            console.log('JWTVERIFY');
            const IP_USER = req.socket.remoteAddress || req.ip;
            redisClient.get(userId + 'refreshToken', (err, dataRD) => {
                console.log('JWTVERIFY', userId, dataRD);

                // save token into redis
                if (err) {
                    return res.status(404).json('Error getting refresh token: ' + err);
                }
                if (dataRD) {
                    const newDataD: { refreshToken: string; accepted?: string; awaiting?: string }[] =
                        JSON.parse(dataRD);
                    newDataD?.forEach((dataRes) => {
                        const my = dataRes.refreshToken.split('@_@');
                        const [refreshToken, code] = my;
                        if (authHeader && userId && refreshToken) {
                            const tokenc = authHeader && authHeader.split(' ')[1];
                            if (!tokenc) {
                                return res.status(401).json({ status: 8888, message: 'Unauthorized!' });
                            } else {
                                try {
                                    jwt.verify(tokenc, code, (err: any, user: any) => {
                                        // user: {id:string;  iat: number; exp: number}
                                        if (err || user.id !== userId) {
                                            token.deleteToken(res);
                                            return res.status(403).json({ status: 0, message: 'Token is not valid' });
                                        }
                                        console.log(user, 'user');
                                        jwt.verify(refreshToken, code, (err, data: any) => {
                                            // data: {id:string; IP_USER:string, iat: number; exp: number}
                                            if (err) {
                                                token.deleteToken(res);
                                                return res
                                                    .status(403)
                                                    .json({ status: 0, message: 'Token is not valid' });
                                            }
                                            if (data.id === userId) {
                                                if (
                                                    !data?.IP_USER.includes(IP_USER) || // nothing is match
                                                    dataRes.awaiting === IP_USER ||
                                                    dataRes.accepted !== IP_USER
                                                ) {
                                                    redisClient.set(
                                                        userId + 'warning_login_by_an_another_site',
                                                        warning,
                                                        (err) => {
                                                            if (err) throw new ServerError('JWTAuth', err);
                                                        },
                                                    );
                                                }
                                            } else {
                                                token.deleteToken(res);
                                                return res.status(401).json({ status: 8888, message: 'Unauthorized!' });
                                            }
                                            next();
                                        });
                                    });
                                } catch (error) {
                                    console.log(error);
                                    return res.status(403);
                                }
                            }
                        } else {
                            token.deleteToken(res);
                            return res.status(401).json({ status: 0, message: "You're not authenticated!" });
                        }
                    });
                } else {
                    token.deleteToken(res);
                    return res.status(401).json({ status: 0, message: 'Expires refreshToken!' });
                }
            });
        } catch (error) {
            next(error);
        }
    };
    verifyTokenDelete = async (req: any, res: any, next: any) => {
        await this.verifyToken(req, res, () => {
            console.log('a', req.user.id, req.params.id, 'req.body.id', req.body.id);
            console.log('b', req.user, req.params);
            if (req.user.id === req.body.id || req.user.admin === req.params.admin) {
                next();
            } else {
                return res.status(401).json({ status: 0, message: "Your're not allowed to  DELETE other" });
            }
        });
    };
}
export default new JWTVERIFY();
