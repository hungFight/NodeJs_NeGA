import express from 'express';
import ServerError from '../utils/errors/ServerError';
import moment from 'moment';
import { Redis } from 'ioredis';
import { getRedis } from '../connectDatabase/connect.Redis';
import getMAC from 'getmac';
class ExcessiveRequests {
    ip = async (req: express.Request, res: any, next: any) => {
        try {
            const IP_MAC = getMAC();
            const id = req.cookies.k_user;
            if (id) {
                const keyFirst = `prohibited_request_ID_${id}_url_${req.url}`;
                await new Promise<void>((resolve, reject) => {
                    getRedis().get(keyFirst, async (errGet, prohibit) => {
                        // true or false
                        if (errGet) reject(new ServerError('Increment by Redis in MiddleWare ExcessiveRequests', errGet));
                        if (prohibit && prohibit === 'true') {
                            reject(
                                new ServerError('ExcessiveRequests', {
                                    status: 9, // 9999 is busy
                                    message: 'Server is busy!',
                                }),
                            );
                        } else {
                            await new Promise((resolve, _) => {
                                const keyCount = `:CountExcessiveRequests_ID_${id}_url_${req.url}`;
                                getRedis().incr(keyCount, async (err, mun) => {
                                    // increment by 1
                                    getRedis().expire(keyCount, Number(process.env.REDIS_EXCESSIVE_TIME_AT_INCREMENT), (err) => {
                                        if (err) reject(new ServerError('expire by Redis in MiddleWare ExcessiveRequests', err));
                                    });
                                    if (err) throw new ServerError('Increment by Redis in MiddleWare ExcessiveRequests', err);
                                    if (mun && mun >= Number(process.env.REDIS_EXCESSIVE)) {
                                        getRedis().set(keyFirst, 'true', (err) => {
                                            if (err) reject(new ServerError('Expire by Redis in MiddleWare ExcessiveRequests', err));

                                            getRedis().expire(keyFirst, Number(process.env.REDIS_EXCESSIVE_TIME_AT_PROHIBITED), (err) => {
                                                if (err) reject(new ServerError('Expire ip_User + _prohibited by Redis in MiddleWare ExcessiveRequests', err));
                                            });
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
                    const keyFirst = `prohibited_request_url_${req.url}_MAC_${IP_MAC}`;
                    getRedis().get(keyFirst, async (errGet, prohibit) => {
                        // true or false
                        if (errGet) reject(new ServerError('Increment by Redis in MiddleWare ExcessiveRequests', errGet));
                        if (prohibit && prohibit === 'true') {
                            reject(
                                new ServerError('ExcessiveRequests', {
                                    status: 9, // 9999 is busy
                                    message: 'Server is busy!',
                                }),
                            );
                        } else {
                            await new Promise((resolve, reject) => {
                                const keyCount = `:CountExcessiveRequests_url_${req.url}_MAC_${IP_MAC}`;
                                getRedis().incr(keyCount, async (err, mun) => {
                                    // increment by 1
                                    getRedis().expire(keyCount, Number(process.env.REDIS_EXCESSIVE_TIME_AT_INCREMENT), (err) => {
                                        if (err) reject(new ServerError('expire by Redis in MiddleWare ExcessiveRequests', err));
                                    });
                                    if (err) reject(new ServerError('Increment by Redis in MiddleWare ExcessiveRequests', err));
                                    if (mun && mun >= Number(process.env.REDIS_EXCESSIVE)) {
                                        getRedis().set(keyFirst, 'true', (err) => {
                                            if (err) reject(new ServerError('Expire by Redis in MiddleWare ExcessiveRequests', err));

                                            getRedis().expire(keyFirst, Number(process.env.REDIS_EXCESSIVE_TIME_AT_PROHIBITED), (err) => {
                                                if (err) reject(new ServerError('Expire ip_User + _prohibited by Redis in MiddleWare ExcessiveRequests', err));
                                            });
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

    changeText = (req: express.Request, res: any, next: express.NextFunction) => {
        const redisClient: Redis = res.redisClient;
        const id = req.cookies.k_user;
        // const params = req.query.params;
        // if (params.fullName) {
        //    getRedis().get(`${id} update Name`, (err, data) => {
        //         if (err)
        //             throw new ServerError('Update FullName: Limit times changeText by MiddleWare changeText ', err);
        //         if (data) {
        //             return res.status(200).json(data);
        //         } else {
        //             next();
        //         }
        //     });
        // } else if (params.nickName) {
        //    getRedis().get(`${id} update Nick Name`, (err, data) => {
        //         if (err)
        //             throw new ServerError('Update NickName: Limit times changeText by MiddleWare changeText ', err);
        //         if (data && JSON.parse(data)?.length >= 10) {
        //             return res.status(200).json(JSON.parse(data));
        //         } else {
        //             next();
        //         }
        //     });
        // } else {
        //     next();
        // }
        next();
    };
}
export default new ExcessiveRequests();
