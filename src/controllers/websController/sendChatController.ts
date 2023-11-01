import express from 'express';
import SendChatServiceSN, { PropsRoomChat } from '../../services/WebsServices/SendChatServiceSN';
import { io, redisClient } from '../..';
import ServerError from '../../utils/errors/ServerError';
import NotFound from '../../utils/errors/NotFound';
import Forbidden from '../../utils/errors/Forbidden';
import { RoomChats } from '../../models/mongodb/chats';

class SendChat {
    sendChat = async (req: any, res: any, next: express.NextFunction) => {
        try {
            const id = req.cookies.k_user;
            const value = req.body.value;
            const id_other = req.body.id_others;
            const id_ = req.body.id_;
            const id_s = req.body.id_s;
            const id_room = req.body.id_room;
            console.log(id_room, 'id_room');
            const files = req.files;

            if (id_other && id_) {
                console.log(id_other, 'id_others');

                const data = await SendChatServiceSN.send(id_room, id, id_other, value, files, id_, id_s);
                const key_redis = id_other + '-' + 'AmountMessageIsNotSeen' + '-' + data._id;

                if (data) {
                    // const newD = await new Promise<PropsRoomChat>((resolve, reject) => {
                    //     try {
                    //         redisClient.get(key_redis, (err, result) => {
                    //             if (err) throw new ServerError('Error getting data from redis at CTL SendChat', err);
                    //             redisClient.set(key_redis, result ? JSON.parse(result) + 1 : 1);
                    //             data.miss = result ? JSON.parse(result) + 1 : 0;
                    //             resolve(data);
                    //         });
                    //     } catch (error) {
                    //         reject(error);
                    //     }
                    // });
                    data._id = data._id.toString();
                    console.log(data.room, 'data');
                    io.emit(`${id_other}roomChat`, JSON.stringify(data)); // It's in App.tsx
                    if (data.room?.secondary) {
                        io.emit(`${id + '-' + id_other}phrase_chatRoom`, JSON.stringify({ id, data: data })); // It's in Messenger
                    } else {
                        io.emit(`${data._id + '-' + id}phrase_chatRoom`, JSON.stringify({ id, data: data })); // It's in Messenger
                    }

                    return res.status(200).json({ ...data, miss: 0 });
                }
                return res.status(404).json('Send message failed!');
            }
            throw new NotFound('Send', 'id_other or id_ not found');
        } catch (error) {
            next(error);
        }
    };
    getRoom = async (req: any, res: express.Response) => {
        try {
            const id = req.cookies.k_user;
            const limit = req.query.limit;
            const offset = req.query.offset;
            const data = await SendChatServiceSN.getRoom(id, Number(limit), Number(offset));
            await Promise.all(
                data.map(async (r) => {
                    const key_redis = id + '-' + 'AmountMessageIsNotSeen' + '-' + r._id;
                    const amount = await new Promise<number>((resolve, reject) => {
                        try {
                            redisClient.get(key_redis, (err, result) => {
                                if (err) throw new ServerError('Error getting data from redis at CTL getRoom', err);
                                resolve(result ? JSON.parse(result) : 0);
                            });
                        } catch (error) {
                            reject(error);
                        }
                    });
                    r.miss = amount;
                    return r;
                }),
            );
            return res.status(200).json(data);
        } catch (error) {
            console.log(error);
        }
    };
    getChat = async (req: any, res: express.Response, next: express.NextFunction) => {
        try {
            const id = req.cookies.k_user;
            const id_room = req.query.id_room;
            const id_other = req.query.id_other;
            const limit = req.query.limit;
            const offset: number = req.query.offset;
            const moreChat = req.query.moreChat;

            if (id_other) {
                const data: any = await SendChatServiceSN.getChat(
                    id_room,
                    id,
                    id_other,
                    Number(limit),
                    Number(offset),
                    moreChat,
                );
                if (Number(offset) === 0 && data._id) {
                    // get and send seenBy to other
                    for (let i = 0; i < data.room.length; i++) {
                        if (data.room[i].id === id_other) {
                            io.emit(`phrase_chatRoom_response_${data?._id}_${data?.user?.id}`, data?.room[i]?._id);
                            break;
                        }
                    }
                }
                console.log('come phrase_chatRoom_response', data._id, offset);

                return res.status(200).json(data);
            }
            throw new NotFound('GetChat', 'Not Found id_room or id_other');
        } catch (error) {
            next(error);
        }
    };
    delete = async (req: any, res: express.Response, next: express.NextFunction) => {
        try {
            const id = req.cookies.k_user;
            const id_room = req.query.id_room;
            console.log(id, id_room, 'delete room');
            if (!id_room) throw new NotFound('Delete Room', 'id_room not found', { id_room: id_room });
            const data = await SendChatServiceSN.delete(id_room, id);
            if (!data) throw new NotFound('Delete Room', 'Delete failed');
            return res.status(200).json(data);
        } catch (error) {
            next(error);
        }
    };
    undo = async (req: any, res: express.Response, next: express.NextFunction) => {
        try {
            const id = req.cookies.k_user;
            const id_room = req.body.params.id_room;
            console.log(id, id_room, 'Undo room');
            if (!id_room) throw new NotFound('Undo Room', 'id_room not found', { id_room: id_room });
            const data = await SendChatServiceSN.undo(id_room, id);
            if (!data) throw new NotFound('Undo Room', 'Undo failed');
            return res.status(200).json(data);
        } catch (error) {
            next(error);
        }
    };
    delChatAll = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
        try {
            const roomId = req.body.roomId;
            const chatId = req.body.chatId;
            const userId = req.body.userId;
            const userIdCur = req.cookies.k_user;
            console.log(roomId, chatId, userId);

            if (!roomId || !chatId || !userId)
                throw new NotFound('delChatAll', 'roomId, userId or chatId or userId not provided');
            if (userId === userIdCur) {
                const data = await SendChatServiceSN.delChatAll(roomId, chatId, userId);
                return res.status(200).json(data);
            }
            throw new Forbidden('DelChatALL', 'You are no allowed!');
        } catch (error) {
            next(error);
        }
    };
    delChatSelf = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
        try {
            const roomId = req.body.roomId;
            const chatId = req.body.chatId;
            const userId = req.body.userId;
            const userIdCur = req.cookies.k_user;
            console.log(roomId, chatId, userId);

            if (!roomId || !chatId || !userId)
                throw new NotFound('delChatAll', 'roomId, userId or chatId or userId not provided');
            if (userId === userIdCur) {
                const data = await SendChatServiceSN.delChatSelf(roomId, chatId, userId);
                return res.status(200).json(data);
            }
            throw new Forbidden('DelChatALL', 'You are no allowed!');
        } catch (error) {
            next(error);
        }
    };
    updateChat = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
        try {
            const roomId: string = req.body.roomId;
            const chatId: string = req.body.id_chat;
            const value: string = req.body.value;
            const userIdCur = req.cookies.k_user;
            const userId: string = req.body.userId;
            const id_other: string = req.body.id_other;
            const files = req.files;
            console.log(roomId, chatId);

            if (!roomId || !chatId || !id_other)
                throw new NotFound('updateChat UP', 'roomId, userId, id_other or chatId or userId not provided');
            if (userId === userIdCur) {
                const data = await SendChatServiceSN.updateChat(roomId, chatId, userId, id_other, value, files);
                return res.status(200).json(data);
            }
            throw new Forbidden('updateChat Down', 'You are no allowed!');
        } catch (error) {
            next(error);
        }
    };
}
export default new SendChat();
