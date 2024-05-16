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
            const id: string = req.cookies.k_user;
            const id_friend: string = req.body.params.id_friend;
            const key_user: string = id + 'people';
            const key_friend: string = id_friend + 'people';
            const redisClient: Redis = res.redisClient;
            const io = res.io;
            const per = req.body.params.per;
            console.log('Hung');

            const data = await peopleServiceSN.setFriend(id, id_friend, per);
            console.log(data, 'data setFriend');
            io.emit(`Request others?id=${id_friend}`, { ...data, youId: id });
            io.emit(`Request others?id=${id}`, { ...data, youId: id });
            const keyDel = id + 'Get_people_at_';
            // redisClient.del(keyDel + 'yousent', (err: any, count: any) => {
            //     if (err) throw new ServerError('At CTL SetFriend', err);
            // });
            // redisClient.del(keyDel + 'friends', (err: any, count: any) => {
            //     if (err) throw new ServerError('At CTL SetFriend', err);
            // });
            // redisClient.del(keyDel + 'others', (err: any, count: any) => {
            //     if (err) throw new ServerError('At CTL SetFriend', err);
            // });
            // redisClient.get(`${data.id_friend} message`, (err, rs) => {
            //     if (err) console.log(err);
            //     if (data && rs && JSON.parse(rs)) {
            //         redisClient.set(`${data.id_friend} message`, JSON.stringify({ quantity: JSON.parse(rs).quantity + 1 }));
            //     } else {
            //         redisClient.set(`${data.id_friend} message`, JSON.stringify({ quantity: 1 }));
            //     }
            //     redisClient.get(`${data.id_friend} message`, (err, rs) => {
            //         if (err) console.log(err);
            //         if (rs && JSON.parse(rs).quantity > 0) data.quantity = JSON.parse(rs).quantity;
            //         io.emit(`Request others?id=${data.id_friend}`, JSON.stringify(data));
            //     });
            //     redisClient.del(`${data.id_friend} user_message`);
            // });
            return res.status(200).json(data);
        } catch (error) {
            console.log(error);
        }
    };

    getFriends = async (req: any, res: any) => {
        //   redisClient.get(key, async (err: any, data: string) => {
        //       if (err) console.log('get value faild!', err);
        //       const people = JSON.parse(data);
        //       if (people && rl !== 'yes') {
        //           console.log(people, 'redis');
        //           return res.status(200).json(people);
        //       } else {
        //           const datas = await peopleServiceSN.getPeopleAll(id);
        //           console.log('MySQL', datas);
        //           redisClient.set(key, JSON.stringify(datas));
        //           redisClient.lrange(key_Reload, 0, -1, (err: any, items: string[]) => {
        //               if (err) console.log(err);
        //               if (!items.includes(key))
        //                   redisClient.rpush(key_Reload, key, (err: any, length: number) => {
        //                       if (err) console.log(err);
        //                       console.log(`Item added to the list. New length: ${length}`);
        //                   });
        //           });

        //           return res.status(200).json(datas);
        //       }
        //   });
        try {
            const id = req.cookies.k_user;
            const offset = req.query.offset;
            const limit = req.query.limit;
            const type = req.query.type;
            const redisClient: Redis = res.redisClient;
            const key = id + 'Get_Friends' + type;
            redisClient.get(key, async (err, rs) => {
                if (err) throw new ServerError('Redis_Get_Friends', err);
                const friends = rs ? JSON.parse(rs) : [];
                if (friends?.length) {
                    // console.log(friends, 'Redis_Get_' + type);
                    return res.status(200).json(friends);
                } else {
                    const data = await peopleServiceSN.getFriends(id, Number(offset), Number(limit), type);
                    // console.log(data, 'MySQL_Get_' + type);
                    redisClient.set(key, JSON.stringify(data));
                    return res.status(200).json(data);
                }
            });
        } catch (error) {
            console.log(error, 'getFriendAll');
        }
    };
    delete = async (req: any, res: any) => {
        try {
            const id: string = req.cookies.k_user;
            const redisClient: Redis = res.redisClient;
            const id_req = req.body.params.id_req;
            const kindOf = req.body.params.kindOf;
            const io = res.io;
            const per = req.body.params.per;
            const data = await peopleServiceSN.delete(id, id_req, kindOf, per);
            console.log(data, 'delete', 'id_req', id_req);
            if (data) {
                io.emit(`Del request others?id=${id_req}`, {
                    userId: id_req,
                    youId: id,
                    ...data,
                });
                io.emit(`Del request others?id=${id}`, {
                    userId: id_req,
                    youId: id,
                    ...data,
                });
                // redisClient.get(`${data.ok?.idFriend} message`, (err, rs) => {
                //     if (err) console.log(err);
                //     if (data && rs && JSON.parse(rs).quantity > 0) {
                //         redisClient.set(`${data.ok?.idFriend} message`, JSON.stringify({ quantity: JSON.parse(rs).quantity - 1 }));
                //     }
                // });
            }
            // redisClient.get(`${data.ok?.idFriend} message`, (err, rs) => {
            //     if (err) console.log(err);
            //     if (rs) data.ok.quantity = JSON.parse(rs).quantity;
            // });
            // redisClient.del(`${data.ok?.idFriend} user_message`, (err: any) => {
            //     if (err) console.log('Del Value faild!', err);
            // });

            // const keyDel = id + 'Get_Friends';
            // redisClient.del(keyDel + 'yousent', (err: any, count: any) => {
            //     if (err) console.log(err);
            //     console.log(`Set_Friend: Deleted ${count} of You sent key(s)`);
            // });
            // redisClient.del(keyDel + 'friends', (err: any, count: any) => {
            //     if (err) console.log(err);
            //     console.log(`Set_Friend: Deleted ${count} of friends key(s)`);
            // });
            // redisClient.del(keyDel + 'others', (err: any, count: any) => {
            //     if (err) console.log(err);
            //     console.log(`Set_Friend: Deleted ${count} of others sent key(s)`);
            // });
            return res.status(200).json(data);
        } catch (error) {
            console.log(error, 'delete Request');
        }
    };
    setConfirm = async (req: express.Request, res: any) => {
        try {
            const id: string = req.cookies.k_user;
            const kindOf = req.body.params.kindOf;
            const id_fr = req.body.params.id_req;
            const redisClient: Redis = res.redisClient;
            const per = req.body.params.per;
            const io = res.io;
            const atInfo = req.body.params.atInfor;
            console.log('vo', atInfo);
            const data = await peopleServiceSN.setConfirm(id, id_fr, kindOf, per);
            // if (data.ok === 1 && atInfo) {
            //     io.emit(`Confirmed atInfo ${data.id}`, JSON.stringify({ ok: 1, id_fr: data.id, id: data.id_fr }));
            // }
            if (data) {
                io.emit(`Confirmed_friend_${id_fr}`, { ...data, userId: id_fr, youId: id });
                io.emit(`Confirmed_friend_${id}`, { ...data, userId: id_fr, youId: id });
            }
            // redisClient.del(`${data.id_fr} user_message`);

            // const keyDel = id + 'Get_Friends';
            // redisClient.del(keyDel + 'yousent', (err: any, count: any) => {
            //     if (err) console.log(err);
            //     console.log(`Set_Friend: Deleted ${count} of You sent key(s)`);
            // });
            // redisClient.del(keyDel + 'friends', (err: any, count: any) => {
            //     if (err) console.log(err);
            //     console.log(`Set_Friend: Deleted ${count} of friends key(s)`);
            // });
            // redisClient.del(keyDel + 'others', (err: any, count: any) => {
            //     if (err) console.log(err);
            //     console.log(`Set_Friend: Deleted ${count} of others sent key(s)`);
            // });
            return res.status(200).json(data);
        } catch (error) {
            console.log(error, 'setConfrim');
        }
    };
    getStrangers = async (req: any, res: any, next: express.NextFunction) => {
        try {
            const id = req.cookies.k_user;
            const limit = req.query.limit;
            const rel = req.query.rel;
            const redisClient: Redis = res.redisClient;
            const key = id + 'strangers';
            const key_Reload = id + 'Reload';
            const datas: any = await peopleServiceSN.getStrangers(id, Number(limit));
            return res.status(200).json(datas);

            // redisClient.get(key, async (err, data) => {
            //     if (err) throw new ServerError('GetStrangers!', err);
            //     const people = data ? JSON.parse(data) : [];
            //     console.log(people, 'redis', rel, !people?.length && rel, people?.length);

            //     if (rel) {
            //         console.log('MySQL', datas);
            //         redisClient.set(key, JSON.stringify(datas));
            //         redisClient.lrange(key_Reload, 0, -1, (err, items) => {
            //             if (err) throw new ServerError('GetStrangers!', err);
            //             if (items && !items.includes(key)) redisClient.rpush(key_Reload, key);
            //         });
            //         return res.status(200).json(datas);
            //     }
            //     console.log(people, 'redis');
            // });
        } catch (error) {
            next(error);
        }
    };
}
export default new peopleController();
