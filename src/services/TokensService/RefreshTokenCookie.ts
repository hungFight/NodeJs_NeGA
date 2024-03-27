import Token from './Token';
import jwt from 'jsonwebtoken';
import token from './Token';
import express from 'express';
import ServerError from '../../utils/errors/ServerError';
import { Redis } from 'ioredis';
class RefreshTokenCookie {
    refreshToken = async (req: express.Request, res: any, next: express.NextFunction) => {
        try {
            const userId = req.cookies.k_user;
            const accessToken = req.cookies.tks;
            const redisClient: Redis = res.redisClient;
            const IP_USER = req.socket.remoteAddress || req.ip;
            const warning = JSON.stringify({
                id: 0,
                message: 'There was an person trying to login to your Account!',
            });
            redisClient.get(userId + 'refreshToken', (err, data) => {
                if (err) {
                    return res.status(500).json('Error getting refresh token: ' + err);
                }
                if (data) {
                    const newData: { refreshToken: string; accepted?: string; awaiting?: string }[] = JSON.parse(data);
                    let check = false;
                    newData.forEach((de) => {
                        if (de?.accepted === IP_USER) {
                            check = true;
                            const my = de.refreshToken.split('@_@');
                            const [refreshToken, code] = my;
                            if (!refreshToken || !userId || !accessToken || !code) {
                                token.deleteToken(res);
                                return res.status(403).json({ status: 0, message: "You're not Authenticated" });
                            }
                            jwt.verify(refreshToken, code, (err: any, user: any) => {
                                // {id:string; IP_USER:string, iat: number; exp: number}
                                if (
                                    err ||
                                    userId !== user.id ||
                                    user.iss !== process.env.REACT_URL ||
                                    user.aud !== process.env.REACT_URL
                                ) {
                                    token.deleteToken(res);
                                    return res.status(403).json({ status: 0, message: 'Unauthorized' });
                                }
                                // jwt.verify(refreshToken, code, (err, data: any) => { // check ip is valid
                                //     // data: {id:string; IP_USER:string, iat: number; exp: number}
                                //     if (err) {
                                //         token.deleteToken(res);
                                //         return res.status(403).json({ status: 0, message: 'Token is not valid' });
                                //     }
                                //     if (!(data?.IP_USER + data?.id === IP_USER + userId)) { // check ip in refreshToken
                                //         redisClient.set(IP_USER + 'warning' + userId, warning, (err) => {
                                //             if (err) throw new ServerError('JWTAuth', err);
                                //         });
                                //         token.deleteToken(res);
                                //         return res.status(401).json({ status: 8888, message: 'Unauthorized!' });
                                //     }

                                //     console.log(user, 'user', data);
                                //     next();
                                // });
                                delete user.iat;
                                const newAccessToken = Token.accessTokenF({ id: user.id, IP_USER: IP_USER }, code);
                                const newRefreshToken = Token.refreshTokenF({ id: user.id, IP_USER: IP_USER }, code);
                                console.log(newAccessToken, 'newAccessToken_ re');

                                redisClient.set(
                                    userId + 'refreshToken',
                                    JSON.stringify(
                                        newData.map((re) => {
                                            if (re.refreshToken === refreshToken + '@_@' + code) {
                                                re.refreshToken = newRefreshToken + '@_@' + code;
                                            }
                                            return re;
                                        }),
                                    ),
                                    (err, apply) => {
                                        if (err || !apply) {
                                            console.log('Error setting and expire refreshToken');
                                            return res.status(404).json('Can not set refreshToken in redis');
                                        }
                                        redisClient.expire(userId + 'refreshToken', 15 * 24 * 60 * 60); // 15days
                                    },
                                );
                                return res.status(200).json({ newAccessToken: newAccessToken });
                            });
                        }
                    });
                    if (!check) return res.status(403).json({ status: 0, message: "You're not Authenticated" });
                } else {
                    Token.deleteToken(res);
                    return res.status(404).json({ status: 0, message: 'Expired refresh token' });
                }
            });
        } catch (error) {
            next(error);
        }
    };
}
export default new RefreshTokenCookie();
