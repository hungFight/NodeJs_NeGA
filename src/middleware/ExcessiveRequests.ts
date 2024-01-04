import { Reject } from 'twilio/lib/twiml/VoiceResponse';
import { redisClient } from '..';
import Token from '../services/TokensService/Token';
import express from 'express';
import ServerError from '../utils/errors/ServerError';
import moment from 'moment';
class ExcessiveRequests {
    ip = async (req: express.Request, res: any, next: any) => {
        try {
            const id = req.cookies.k_user;
            const ip_User = req.socket.remoteAddress || req.ip;
            if (id) {
                await new Promise<void>((resolve, reject) => {
                    redisClient.get('_prohibited_request_ID_' + id, async (errGet, prohibit) => {
                        // true or false
                        if (errGet)
                            reject(new ServerError('Increment by Redis in MiddleWare ExcessiveRequests', errGet));
                        if (prohibit && prohibit === 'true') {
                            reject(
                                new ServerError('ExcessiveRequests', {
                                    status: 9999, // 9999 is busy
                                    message: 'Server is busy!',
                                }),
                            );
                        } else {
                            await new Promise((resolve, _) => {
                                redisClient.incr(':ExcessiveRequests_ID:' + id, async (err, mun) => {
                                    // increment by 1
                                    redisClient.get(':ExcessiveRequests_DateTime_ID:' + id, (errGet, prohibit) => {
                                        console.log(moment(prohibit).second(), ':ExcessiveRequests_DateTime:');
                                        if (!prohibit)
                                            redisClient.set(':ExcessiveRequests_DateTime_ID:' + id, String(new Date()));
                                    });

                                    redisClient.expire(
                                        ':ExcessiveRequests_ID:' + id,
                                        Number(process.env.REDIS_EXCESSIVE_TIME_AT_INCREMENT),
                                        (err, sTime) => {
                                            //second
                                            // per minute only to be requested up to 25
                                            if (err)
                                                reject(
                                                    new ServerError(
                                                        'Expiration by Redis in MiddleWare ExcessiveRequests',
                                                        err,
                                                    ),
                                                );
                                        },
                                    );
                                    if (err)
                                        throw new ServerError(
                                            'Increment by Redis in MiddleWare ExcessiveRequests',
                                            err,
                                        );
                                    console.log(mun, 'redisClient');

                                    if (mun && mun >= Number(process.env.REDIS_EXCESSIVE)) {
                                        redisClient.set('_prohibited_request_ID_' + id, 'true', (err) => {
                                            if (err)
                                                reject(
                                                    new ServerError(
                                                        'Expire by Redis in MiddleWare ExcessiveRequests',
                                                        err,
                                                    ),
                                                );
                                            redisClient.expire(
                                                '_prohibited_request_ID_' + id,
                                                Number(process.env.REDIS_EXCESSIVE_TIME_AT_PROHIBITED),
                                                (err) => {
                                                    if (err)
                                                        reject(
                                                            new ServerError(
                                                                'Expire ip_User + _prohibited by Redis in MiddleWare ExcessiveRequests',
                                                                err,
                                                            ),
                                                        );
                                                },
                                            );
                                        });
                                    }
                                    next();
                                });
                            });
                        }
                    });
                });
            } else {
                await new Promise<void>((resolve, reject) => {
                    redisClient.get('_prohibited_request_IP_' + ip_User, async (errGet, prohibit) => {
                        // true or false
                        if (errGet)
                            reject(new ServerError('Increment by Redis in MiddleWare ExcessiveRequests', errGet));
                        if (prohibit && prohibit === 'true') {
                            reject(
                                new ServerError('ExcessiveRequests', {
                                    status: 9999, // 9999 is busy
                                    message: 'Server is busy!',
                                }),
                            );
                        } else {
                            await new Promise((resolve, _) => {
                                redisClient.incr(':ExcessiveRequests_IP:' + ip_User, async (err, mun) => {
                                    // increment by 1
                                    redisClient.get(':ExcessiveRequests_DateTime_IP:' + ip_User, (errGet, prohibit) => {
                                        console.log(moment(prohibit).second(), ':ExcessiveRequests_DateTime:');
                                        if (!prohibit)
                                            redisClient.set(
                                                ':ExcessiveRequests_DateTime_IP:' + ip_User,
                                                String(new Date()),
                                            );
                                    });

                                    redisClient.expire(
                                        ':ExcessiveRequests_IP:' + ip_User,
                                        Number(process.env.REDIS_EXCESSIVE_TIME_AT_INCREMENT),
                                        (err, sTime) => {
                                            //second
                                            // per minute only to be requested up to 25
                                            if (err)
                                                reject(
                                                    new ServerError(
                                                        'Expiration by Redis in MiddleWare ExcessiveRequests',
                                                        err,
                                                    ),
                                                );
                                        },
                                    );
                                    if (err)
                                        throw new ServerError(
                                            'Increment by Redis in MiddleWare ExcessiveRequests',
                                            err,
                                        );
                                    console.log(mun, 'redisClient');

                                    if (mun && mun >= Number(process.env.REDIS_EXCESSIVE)) {
                                        redisClient.set('_prohibited_request_IP_' + ip_User, 'true', (err) => {
                                            if (err)
                                                reject(
                                                    new ServerError(
                                                        'Expire by Redis in MiddleWare ExcessiveRequests',
                                                        err,
                                                    ),
                                                );
                                            redisClient.expire(
                                                '_prohibited_request_IP_' + ip_User,
                                                Number(process.env.REDIS_EXCESSIVE_TIME_AT_PROHIBITED),
                                                (err) => {
                                                    if (err)
                                                        reject(
                                                            new ServerError(
                                                                'Expire ip_User + _prohibited by Redis in MiddleWare ExcessiveRequests',
                                                                err,
                                                            ),
                                                        );
                                                },
                                            );
                                        });
                                    }
                                    next();
                                });
                            });
                        }
                    });
                });
            }
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
