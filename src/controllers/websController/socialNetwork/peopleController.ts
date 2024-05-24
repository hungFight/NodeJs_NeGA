import express from 'express';
import peopleServiceSN from '../../../services/WebsServices/SocialNetwork/peopleServiceSN';
import ServerError from '../../../utils/errors/ServerError';
import { Redis } from 'ioredis';
// yousent, friends, others;
class peopleController {
    getPeopleAll = async (req: any, res: any) => {
        try {
            const id = req.cookies.k_user;
            const key: string = id + 'people';
            const key_Reload: string = id + 'Reload';
            const rl = req.query.rl;
            console.log('params', req.query);
        } catch (error) {
            console.log(error);
        }
    };
    setFriend = async (req: any, res: any) => {
        try {
            // use Redis caching to save notification
            const id: string = req.cookies.k_user,
                id_friend: string = req.body.params.id_friend,
                key_user: string = id + 'people',
                key_friend: string = id_friend + 'people',
                io = res.io,
                per = req.body.params.per;
            const data = await peopleServiceSN.setFriend(id, id_friend, per);
            console.log(data, 'data setFriend');
            io.emit(`Request others?id=${id_friend}`, { ...data, youId: id });
            io.emit(`Request others?id=${id}`, { ...data, youId: id });
            return res.status(200).json(data);
        } catch (error) {
            console.log(error);
        }
    };

    getFriends = async (req: any, res: any) => {
        try {
            const id = req.cookies.k_user,
                offset = req.query.offset,
                limit = req.query.limit,
                type = req.query.type,
                key = id + 'Get_Friends' + type;
            const data = await peopleServiceSN.getFriends(id, Number(offset), Number(limit), type);
            // console.log(data, 'MySQL_Get_' + type);
            // redisClient.set(key, JSON.stringify(data));
            return res.status(200).json(data);
            //     }
            // });
        } catch (error) {
            console.log(error, 'getFriendAll');
        }
    };
    delete = async (req: any, res: any) => {
        try {
            const id: string = req.cookies.k_user,
                id_req = req.body.params.id_req,
                kindOf = req.body.params.kindOf,
                io = res.io,
                per = req.body.params.per;
            const data = await peopleServiceSN.delete(id, id_req, req.body.params.params, req.body.params.mores, kindOf, per);
            console.log(data, 'delete', 'id_req', id_req);
            if (data)
                io.emit(`Del request others?id=${id}`, {
                    userId: id_req,
                    ...data,
                });

            return res.status(200).json(data);
        } catch (error) {
            console.log(error, 'delete Request');
        }
    };
    setConfirm = async (req: express.Request, res: any) => {
        try {
            const id: string = req.cookies.k_user,
                kindOf = req.body.params.kindOf,
                id_fr = req.body.params.id_req,
                per = req.body.params.per,
                io = res.io,
                atInfo = req.body.params.atInfor;
            const data = await peopleServiceSN.setConfirm(id, id_fr, kindOf, req.body.params.params, req.body.params.mores, per);
            if (data) {
                io.emit(`Confirmed_friend_${id_fr}`, { ...data, userId: id_fr, youId: id });
                io.emit(`Confirmed_friend_${id}`, { ...data, userId: id_fr, youId: id });
            }
            return res.status(200).json(data);
        } catch (error) {
            console.log(error, 'setConfrim');
        }
    };
    getStrangers = async (req: any, res: any, next: express.NextFunction) => {
        try {
            const id = req.cookies.k_user,
                limit = req.query.limit,
                rel = req.query.rel,
                key = id + 'strangers',
                key_Reload = id + 'Reload';
            const datas: any = await peopleServiceSN.getStrangers(id, Number(limit));
            return res.status(200).json(datas);
        } catch (error) {
            next(error);
        }
    };
}
export default new peopleController();
