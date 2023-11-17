import { Reject } from 'twilio/lib/twiml/VoiceResponse';
import { redisClient } from '..';
import Token from '../services/TokensService/Token';
import express from 'express';
import ServerError from '../utils/errors/ServerError';
class ExcessiveRequests {
    ip = async (req: express.Request, res: any, next: any) => {
        try {
            const id = req.cookies.k_user;
            const ip_User = req.socket.remoteAddress || req.ip;
            await new Promise<void>((resolve, reject) => {
                redisClient.get(ip_User + '_prohibited', async (errGet, prohibit) => {
                    if (errGet) reject(new ServerError('Increment by Redis in MiddleWare ExcessiveRequests', errGet));
                    if (prohibit && prohibit === 'true') {
                        reject(
                            new ServerError('ExcessiveRequests', {
                                status: 9999, // 9999 is busy
                                message: 'Server is busy!',
                            }),
                        );
                    } else {
                        await new Promise((resolve, _) => {
                            redisClient.incr(ip_User + ':' + id, async (err, mun) => {
                                redisClient.expire(ip_User, 60, (err, sTime) => {
                                    // per minute only to be requested up to 25
                                    if (err)
                                        reject(new ServerError('Expire by Redis in MiddleWare ExcessiveRequests', err));
                                });
                                if (err)
                                    throw new ServerError('Increment by Redis in MiddleWare ExcessiveRequests', err);
                                console.log(mun, 'redisClient');

                                if (mun && mun >= Number(process.env.REDIS_EXCESSIVE)) {
                                    redisClient.set(ip_User + '_prohibited', 'true', (err) => {
                                        if (err)
                                            reject(
                                                new ServerError('Expire by Redis in MiddleWare ExcessiveRequests', err),
                                            );
                                        redisClient.expire(ip_User + '_prohibited', 120, (err) => {
                                            if (err)
                                                reject(
                                                    new ServerError(
                                                        'Expire ip_User + _prohibited by Redis in MiddleWare ExcessiveRequests',
                                                        err,
                                                    ),
                                                );
                                        });
                                    });
                                }
                                next();
                            });
                        });
                    }
                });
            });
        } catch (error) {
            next(error);
        }
    };

    changeText = (req: express.Request, res: express.Response, next: express.NextFunction) => {
        const id = req.cookies.k_user;
        const params = req.body.params.params;
        if (params.fullName) {
            redisClient.get(`${id} update Name`, (err, data) => {
                if (err)
                    throw new ServerError('Update FullName: Limit times changeText by MiddleWare changeText ', err);
                if (data) {
                    return res.status(200).json(data);
                } else {
                    next();
                }
            });
        } else if (params.nickName) {
            redisClient.get(`${id} update Nick Name`, (err, data) => {
                if (err)
                    throw new ServerError('Update NickName: Limit times changeText by MiddleWare changeText ', err);
                if (data && JSON.parse(data)?.length >= 10) {
                    return res.status(200).json(JSON.parse(data));
                } else {
                    next();
                }
            });
        } else {
            next();
        }
    };
}
export default new ExcessiveRequests();
