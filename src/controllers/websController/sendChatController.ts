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
            const id_room = req.body.id_room;
            console.log(id_room, 'id_room');
            const files = req.files;
            files.forEach((file: { id: any; metadata: { fileId: any } }) => {
                const fileId = file.id; // Lấy _id của tệp tin
                // Gán _id vào metadata của fileInfo
                file.metadata.fileId = fileId;
            });
            if (id_other && id_) {
                console.log(id_other, 'id_others');

                const data = await SendChatServiceSN.send(id_room, id, id_other, value, files, id_);
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
                    newD._id = newD._id.toString();
                    console.log(newD, 'newD');
                    io.emit(`${id_other}roomChat`, JSON.stringify(newD)); // It's in App.tsx
                    io.emit(`${newD._id + '-' + id}phrase_chatRoom`, JSON.stringify({ id, data: newD })); // It's in Messenger

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
