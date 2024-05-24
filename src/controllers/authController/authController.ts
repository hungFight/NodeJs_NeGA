import express from 'express';
import authServices from '../../services/AuthServices/AuthServices';
import Token from '../../services/TokensService/Token';

import Forbidden from '../../utils/errors/Forbidden';
import NotFound from '../../utils/errors/NotFound';
import { Redis } from 'ioredis';
import getMAC, { isMAC } from 'getmac';
import Validation from '../../utils/errors/Validation';
import { getRedis } from '../../connectDatabase/connect.Redis';
class authController {
    login = async (req: express.Request, res: any, next: express.NextFunction) => {
        try {
            const phoneNumberEmail = req.body.params.nameAccount,
                password = req.body.params.password,
                IP_MAC = getMAC(),
                userAgent = req.headers['user-agent'] ?? '',
                IP_USER = req.socket.remoteAddress ?? req.ip;
            if (isMAC(IP_MAC)) {
                if (!Validation.validEmail(phoneNumberEmail) || !password) {
                    throw new NotFound('Login', 'Please enter your Account!');
                } else {
                    const userData: any = await authServices.login(res, phoneNumberEmail, password, IP_USER, IP_MAC, userAgent);
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
            const phoneNumberEmail = req.body.nameAccount,
                password = req.body.password,
                id_you = req.cookies.k_user,
                id_other = req.body.id,
                IP_USER = req.socket.remoteAddress ?? req.ip,
                IP_MAC = getMAC(),
                userAgent = req.headers['user-agent'] ?? '';

            if (!Validation.validEmail(phoneNumberEmail) || !isMAC(IP_MAC)) {
                throw new NotFound('Login', 'Please enter your Account!');
            } else {
                const userData: any = await authServices.login(res, phoneNumberEmail, password, IP_USER, IP_MAC, userAgent, true, id_you, id_other);
                return res.status(200).json(userData);
            }
        } catch (error) {
            next(error);
        }
    };
    logOut = async (req: express.Request, res: any, next: express.NextFunction) => {
        try {
            const id = req.cookies.k_user,
                key_Reload = id + 'Reload',
                IP_MAC = getMAC(),
                IP_USER = req.socket.remoteAddress ?? req.ip;
            if (!isMAC(IP_MAC)) throw new NotFound('Logout', 'Invalid MAC');
            const data: any = await authServices.logOut(req, res, IP_MAC, IP_USER);
            if (data?.status === 200) {
                getRedis().lrange(key_Reload, 0, -1, (err, items) => {
                    if (err) console.log(err);
                    items?.forEach((item) => {
                        getRedis().del(item, (err: any, count: any) => {
                            if (err) console.log(err);
                            console.log(`Deleted ${count} key(s)`);
                        });
                    });
                });
                getRedis().del(key_Reload, (err, count) => {
                    if (err) console.log(err);
                    console.log(`Deleted ${count} key(s)`);
                });
                Token.deleteToken(res, id, IP_MAC, IP_USER);
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
