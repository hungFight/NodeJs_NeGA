import Token from './Token';
import jwt from 'jsonwebtoken';
import token from './Token';
import express from 'express';
import ServerError from '../../utils/errors/ServerError';
import getMAC, { isMAC } from 'getmac';
import { Redis } from 'ioredis';
class RefreshTokenCookie {
    refreshToken = async (req: express.Request, res: any, next: express.NextFunction) => {
        try {
            const userId = req.cookies.k_user;
            const accessToken = req.cookies.tks;
            const redisClient: Redis = res.redisClient;
            const IP_MAC = getMAC();
            const IP_USER = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
            const warning = JSON.stringify({
                id: 0,
                message: 'There was an person trying to login to your Account!',
            });
            redisClient.get(userId + 'refreshToken', (err, data) => {
                if (err) {
                    return res.status(500).json('Error getting refresh token: ' + err);
                }
                if (data) {
                    const newData: {
                        refreshToken: string;
                        accept: boolean;
                        ip: string;
                        mac: string;
                        id_user: string;
                    }[] = JSON.parse(data);
                    console.log(newData, 'newDataD');
                    const newDataFiltered = newData.filter((g) => g.id_user === userId && g.mac === IP_MAC);
                    if (newDataFiltered.length) {
                        console.log(newData, 'newData - newData');
                        const de = newDataFiltered[0];
                        const my = de.refreshToken.split('@_@');
                        const [refreshToken, code] = my;
                        if (!refreshToken || !userId || !accessToken || !code) {
                            token.deleteToken(res);
                            return res.status(403).json({ status: 0, message: "You're not Authenticated" });
                        }
                        jwt.verify(refreshToken, code, (err: any, user: any) => {
                            // {id:string; iat: number; exp: number}
                            if (err || userId !== user.id || user.iss !== process.env.REACT_URL || user.aud !== process.env.REACT_URL) {
                                token.deleteToken(res);
                                return res.status(401).json({ status: 8888, message: 'Unauthorized' });
                            }
                            delete user.iat;
                            const newAccessToken = Token.accessTokenF({ id: user.id }, code);
                            const newRefreshToken = Token.refreshTokenF({ id: user.id }, code);
                            redisClient.set(
                                userId + 'refreshToken',
                                JSON.stringify(
                                    newData.map((re) => {
                                        if (re.refreshToken === refreshToken + '@_@' + code && re.id_user === user.id && re.ip === IP_USER) {
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
                    } else {
                        token.deleteToken(res);
                        return res.status(401).json({ status: 0, message: 'Unauthorized' });
                    }
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
