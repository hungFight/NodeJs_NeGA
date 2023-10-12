import express from 'express';
import SendChatServiceSN, { PropsRoomChat } from '../../services/WebsServices/SendChatServiceSN';
import { redisClient } from '../..';
import ServerError from '../../utils/errors/ServerError';
import NotFound from '../../utils/errors/NotFound';
import Forbidden from '../../utils/errors/Forbidden';

class SendChat {
    sendChat = async (req: any, res: any, next: express.NextFunction) => {
        try {
            const id = req.cookies.k_user;
            const io = res.io;
            const value = req.body.value;
            const id_other = req.body.id_others;
            const id_room = req.body.id_room;
            console.log(id_room, 'id_room');
            const files = req.files;
            files.forEach((file: { id: any; metadata: { fileId: any } }) => {
                const fileId = file.id; // Lấy _id của tệp tin
                // Gán _id vào metadata của fileInfo
                file.metadata.fileId = fileId;
            });
            if (id_other) {
                console.log(id_other, 'id_others');

                const data = await SendChatServiceSN.send(id_room, id, id_other, value, files);
                const key_redis = id_other + '-' + 'AmountMessageIsNotSeen' + '-' + data._id;

                if (data) {
                    const newD = await new Promise<PropsRoomChat>((resolve, reject) => {
                        try {
                            redisClient.get(key_redis, (err, result) => {
                                if (err) throw new ServerError('Error getting data from redis at CTL SendChat', err);
                                redisClient.set(key_redis, result ? JSON.parse(result) + 1 : 1);
                                data.miss = result ? JSON.parse(result) + 1 : 0;
                                resolve(data);
                            });
                        } catch (error) {
                            reject(error);
                        }
                    });
                    io.emit(`${id_other}roomChat`, JSON.stringify(newD)); // It's in App.tsx
                    io.emit(`${newD._id + '-' + id}phrase`, JSON.stringify(newD)); // It's in Messenger
                    return res.status(200).json({ ...data, miss: 0 });
                }
                return res.status(404).json('Send message failed!');
            }
            throw new NotFound('Send', 'id_other not found');
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
            const offset = req.query.offset;
            const moreChat = req.query.moreChat;

            if (id_other) {
                const data = await SendChatServiceSN.getChat(
                    id_room,
                    id,
                    id_other,
                    Number(limit),
                    Number(offset),
                    moreChat,
                );
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
            const userIdCur = req.cookies.k_user;
            if (!roomId || !chatId) throw new NotFound('delChatAll', 'roomId or chatId or userId not provided');
            if (chatId === userIdCur) {
                const data = await SendChatServiceSN.delChatAll(roomId, chatId);
            }
            throw new Forbidden('DelChatALL', 'You are no allowed!');
        } catch (error) {
            next(error);
        }
    };
}
export default new SendChat();
