import express from 'express';
import moment from 'moment';
import UserServiceSN from '../../services/WebsServices/UserServiceSN';
import Validation from '../../utils/errors/Validation';
import NotFound from '../../utils/errors/NotFound';
import ServerError from '../../utils/errors/ServerError';
import { Redis } from 'ioredis';
class userController {
    getById = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
        try {
            const id: string = req.cookies.k_user;
            const id_reqs: string[] = req.body.id; // getting personal page
            const first = req.body.first;
            const valid = new Validation();
            if (!valid.validUUID(id)) throw new Validation('getById', 'Invalid Id of uuid');
            const userData = await UserServiceSN.getById(id, id_reqs, req.body.params, req.body.mores, first);
            if (userData) return res.status(200).json(userData);
            throw new NotFound('GetById', 'login again', { status: 0 });
        } catch (error) {
            next(error);
        }
    };
    getByName = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
        try {
            const id = req.cookies.k_user;
            const name: string = req.body.name;
            const searchMore: string = req.body.searchMore;
            const cateMore: string = req.body.cateMore;
            if (!name) throw new Validation('getByName', 'Name Not Found');
            const data = await UserServiceSN.getByName(id, name, cateMore, searchMore, req.body.params);
            if (data.status === 0) throw new Validation('getByName', 'Getting failed');
            return res.status(200).json(data.data);
        } catch (error) {
            next(error);
        }
    };
    setLg = async (req: express.Request, res: express.Response) => {
        try {
            const id: string = req.body.id;
            const lg: string = req.body.lg;
            const data: any = await UserServiceSN.setLg(id, lg);
            return res.status(200).json(data);
        } catch (error) {
            console.log(error);
        }
    };
    setActive = async (req: express.Request, res: express.Response) => {
        try {
            const active: boolean = req.body.active;
            const id = req.cookies.k_user;
            const data: any = await UserServiceSN.setAs(active, id);
            return res.status(200).json(data);
        } catch (error) {
            console.log(error);
        }
    };
    getNewMes = async (req: express.Request, res: express.Response) => {
        try {
            const id = req.cookies.k_user;
            // redisClient.get(`${id} user_message`, (err, rsu) => {
            //     if (err) throw new ServerError('Get message failed at GetNewMes',err)
            //     redisClient.get(`${id} message`, async (err, result) => {
            //         if (err) console.log(err);
            //         if (rsu && JSON.parse(rsu)?.user.length > 0) {
            //             const ys = JSON.parse(rsu);
            //                 ys.quantity = JSON.parse(result)?.quantity;
            //                 return res.status(200).json(ys);
            //         } else {
            //             const data: any = await UserServiceSN.getNewMes(id);
            //             redisClient.set(`${id} user_message`, JSON.stringify(data));
            //             data.quantity = JSON.parse(result)?.quantity;
            //             return res.status(200).json(data);
            //         }
            //     });
            // });
        } catch (error) {
            console.log(error);
        }
    };
    delMessage = async (req: express.Request | any, res: any) => {
        try {
            const id = req.cookies.k_user;
            const redisClient: Redis = res.redisClient;
            redisClient.get(`${id} message`, (err, rs) => {
                if (err) console.log(err);
                if (rs && JSON.parse(rs).quantity > 0)
                    redisClient.set(`${id} message`, JSON.stringify({ quantity: 0 }));
            });
            return res.status(200).json({ ok: true });
        } catch (error) {
            console.log(error);
        }
    };
    delSubAccount = async (req: express.Request, res: express.Response) => {
        try {
            const id = req.body.id;
            const ownId = req.cookies.k_user;
            const phoneOrEmail = req.cookies.phoneOrEmail;
            const data: boolean = await UserServiceSN.delSubAccount(id, ownId, phoneOrEmail);
            return res.status(200).json(data);
        } catch (error) {
            console.log(error);
        }
    };
    changesOne = async (req: express.Request | any, res: any, next: express.NextFunction) => {
        try {
            const dateTime = moment().format('HH:mm:ss DD-MM-YYYY');
            const id = req.body.params.id;
            const id_req = req.cookies.k_user;
            const params = req.body.params.params;
            const redisClient: Redis = res.redisClient;
            const value = req.body.params.value;
            console.log('heeeee', params);
            if (params.fullName === 'fullName') {
                const fullName = `${id} update Name`;
                redisClient.get(fullName, async (err, data) => {
                    if (err) throw new ServerError('ChangesOne at Redis update Name in CTL user', err);
                    if (!data) {
                        const data: any = await UserServiceSN.changesOne(id, id_req, value, params);
                        console.log('data full name', data);
                        if (data) {
                            redisClient.set(fullName, dateTime);
                            redisClient.expire(fullName, 2592000);
                        }
                        return res.status(200).json(data);
                    } else {
                        return res.status(200).json(false);
                    }
                });
            } else {
                const data: any = await UserServiceSN.changesOne(id, id_req, value, params);
                return res.status(200).json('data');
            }
        } catch (error) {
            next(error);
        }
    };
    changesMany = async (req: express.Request | any, res: express.Response, next: express.NextFunction) => {
        try {
            const dateTime = moment().format('HH:mm:ss DD-MM-YYYY');
            const id = req.cookies.k_user;
            const params = req.body.params.params;
            const mores = req.body.params.mores;
            const privacy = req.body.params.privacy;
            const data: any = await UserServiceSN.changesMany(id, params, mores, privacy);
            return res.status(200).json(data);
        } catch (error) {
            next(error);
        }
    };
    follow = async (req: express.Request, res: any) => {
        try {
            const id_fl = req.cookies.k_user;
            const id = req.body.params.id;
            const follow = req.body.params.follow;
            const data = await UserServiceSN.follow(id, id_fl, follow);
            console.log(data, 'nooo');

            return res.status(200).json(data);
        } catch (error) {
            console.log(error);
        }
    };
    Unfollow = async (req: express.Request, res: any) => {
        try {
            const id_fl = req.cookies.k_user;
            const id = req.body.params.id;
            const Unfollow = req.body.params.unfollow;
            const data = await UserServiceSN.Unfollow(id, id_fl, Unfollow);
            console.log(data, 'contr');
            return res.status(200).json(data);
        } catch (error) {
            console.log(error);
        }
    };
    getMore = async (req: express.Request, res: any) => {
        try {
            const id = req.cookies.k_user;
            const limit = req.query.limit;
            const offset = req.query.offset;
            const data = await UserServiceSN.getMore(id, Number(offset), Number(limit));
            console.log(data, 'more');
            return res.status(200).json(data);
        } catch (error) {
            console.log(error);
        }
    };
    setHistory = async (req: express.Request, res: any, next: express.NextFunction) => {
        try {
            const id = req.cookies.k_user;
            const history = req.body.params.data;
            const redisClient: Redis = res.redisClient;
            console.log(history, 'more');
            redisClient.get(id + 'history_search', (err, results) => {
                if (err) throw new ServerError('setHistory at Redis in CTL user', err);

                if (results) {
                    const data = JSON.parse(results);
                    let check = false;
                    const newData = data.filter((v: any) => v.id !== history.id);
                    newData.push(history);
                    console.log(newData, 'ooo');

                    redisClient.set(id + 'history_search', JSON.stringify(newData));
                } else {
                    redisClient.set(id + 'history_search', JSON.stringify([history]));
                }
            });
            return res.status(200).json(true);
        } catch (error) {
            next(error);
        }
    };
    getHistorySearch = (req: express.Request, res: any, next: express.NextFunction) => {
        try {
            const id = req.cookies.k_user;
            const redisClient: Redis = res.redisClient;
            redisClient.get(id + 'history_search', (err, results) => {
                const newData = [];
                if (err) throw new ServerError('getHistorySearch at Redis in CTL user', err);
                if (results) {
                    for (let i = JSON.parse(results).length - 1; i >= 0; i--) {
                        newData.push(JSON.parse(results)[i]);
                    }
                }
                return res.status(200).json(newData);
            });
        } catch (error) {
            next(error);
        }
    };
    getActiveStatus = (req: express.Request, res: any, next: express.NextFunction) => {
        try {
            const id_other = req.query.id_other;
            const redisClient: Redis = res.redisClient;
            if (!id_other) throw new NotFound('getActiveStatus', 'Id_other is empty');
            redisClient.get(`online_duration: ${id_other}`, (err, results) => {
                if (err) throw new ServerError('getActiveStatus at Redis in CTL user', err);
                return res.status(200).json(results);
            });
        } catch (error) {
            next(error);
        }
    };
}
export default new userController();
