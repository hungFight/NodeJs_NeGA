import express from 'express';
import authServices from '../../services/AuthServices/AuthServices';
import Token from '../../services/TokensService/Token';

import Forbidden from '../../utils/errors/Forbidden';
import NotFound from '../../utils/errors/NotFound';
import { Redis } from 'ioredis';
import getMAC, { isMAC } from 'getmac';
class authController {
    login = async (req: express.Request, res: any, next: express.NextFunction) => {
        try {
            const error = ['<script></script>', '<script>', '</script>'];
            const phoneNumberEmail = req.body.params.nameAccount;
            const password = req.body.params.password;
            const redisClient: Redis = res.redisClient;
            const IP_MAC = getMAC();
            const userAgent = req.headers['user-agent'] ?? '';
            const IP_USER = req.socket.remoteAddress ?? req.ip;
            console.log(getMAC(), 'x-mac-address');
            if (isMAC(IP_MAC)) {
                if (!phoneNumberEmail || !password || phoneNumberEmail.includes(error) || password.includes(error)) {
                    throw new NotFound('Login', 'Please enter your Account!');
                } else {
                    const userData: any = await authServices.login(redisClient, phoneNumberEmail, password, IP_USER, IP_MAC, userAgent);
                    if (userData) {
                        return res.status(200).json(userData);
                    }
                    throw new NotFound('Login', userData);
                }
            }
            throw new NotFound('Login', 'Please enter your Account! !');
        } catch (error) {
            next(error);
        }
    };
    subLogin = async (req: express.Request, res: any, next: express.NextFunction) => {
        try {
            const error = ['<script></script>', '<script>', '</script>'];
            const phoneNumberEmail = req.body.nameAccount;
            const password = req.body.password;
            const id_you = req.cookies.k_user;
            const redisClient: Redis = res.redisClient;
            const id_other = req.body.id;
            const IP_USER = req.socket.remoteAddress ?? req.ip;
            const IP_MAC = getMAC();
            const userAgent = req.headers['user-agent'] ?? '';

            if (!phoneNumberEmail || !password || phoneNumberEmail.includes(error) || password.includes(error) || !isMAC(IP_MAC)) {
                throw new NotFound('Login', 'Please enter your Account!');
            } else {
                const userData: any = await authServices.login(
                    redisClient,
                    phoneNumberEmail,
                    password,
                    IP_USER,
                    IP_MAC,
                    userAgent,
                    true,
                    id_you,
                    id_other,
                );
                return res.status(200).json(userData);
            }
        } catch (error) {
            next(error);
        }
    };
    logOut = async (req: express.Request, res: any, next: express.NextFunction) => {
        try {
            console.log('allright');
            const id = req.cookies.k_user;
            const redisClient: Redis = res.redisClient;
            const key_Reload = id + 'Reload';
            const data: any = await authServices.logOut(req, res, redisClient);
            if (data?.status === 200) {
                redisClient.lrange(key_Reload, 0, -1, (err, items) => {
                    if (err) console.log(err);
                    items?.forEach((item) => {
                        redisClient.del(item, (err: any, count: any) => {
                            if (err) console.log(err);
                            console.log(`Deleted ${count} key(s)`);
                        });
                    });
                });
                redisClient.del(key_Reload, (err, count) => {
                    if (err) console.log(err);
                    console.log(`Deleted ${count} key(s)`);
                });
                Token.deleteToken(res);
                return res.status(200).json(data);
            }
            throw new Forbidden('LogOut', data);
        } catch (error) {
            next(error);
        }
    };
    register = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
        try {
            console.log('body', req.body);

            const message: any = await authServices.add(req.body.params);
            console.log(message, 'dayyyyyyyyyyyyyyyyyy');

            return res.status(200).json(message);
        } catch (err) {
            console.log('addUser', err);
        }
    };
}
export default new authController();
