import express from 'express';
import SendChatServiceSN, { PropsRoomChat } from '../../services/WebsServices/SendChatServiceSN';
import ServerError from '../../utils/errors/ServerError';
import NotFound from '../../utils/errors/NotFound';
import Forbidden from '../../utils/errors/Forbidden';
import { RoomChats } from '../../models/mongodb/chats';
import { Types } from 'mongoose';
import { Redis } from 'ioredis';
import { DefaultEventsMap } from 'socket.io/dist/typed-events';
import { Server } from 'socket.io';

class SendChat {
    sendChat = async (req: any, res: any, next: express.NextFunction) => {
        try {
            const id = req.cookies.k_user;
            const value = req.body.value;
            const id_other = req.body.id_others;
            const id_room = req.body.id_room;
            const id_s = req.body.id_s;
            const id_files = req.body.id_files ? JSON.parse(req.body.id_files) : [];
            const io: Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any> = res.io;
            const reply = req.body.reply;
            const conversationId = req.body.conversationId;
            console.log(conversationId, 'conversationId');
            const files = req.files;

            if (id_other && id_room) {
                console.log(id_other, 'id_others');

                const data = await SendChatServiceSN.send(
                    conversationId,
                    id,
                    id_other,
                    value,
                    id_files,
                    id_room,
                    reply ? JSON.parse(reply) : id_s,
                );
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
            throw new NotFound('Send', 'id_other or id_room not found');
        } catch (error) {
            next(error);
        }
    };
    getRoom = async (req: any, res: any) => {
        try {
            const id = req.cookies.k_user;
            const limit = req.query.limit;
            const redisClient: Redis = res.redisClient;
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
    getChat = async (req: any, res: any, next: express.NextFunction) => {
        try {
            const id = req.cookies.k_user;
            const id_room = req.query.id_room;
            const id_other = req.query.id_other;
            const limit = req.query.limit;
            const io: Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any> = res.io;
            const offset: number = req.query.offset;
            const moreChat: string = req.query.moreChat;

            if (id_other) {
                const data: any = await SendChatServiceSN.getChat(
                    id_room,
                    id,
                    id_other,
                    Number(limit),
                    Number(offset),
                    moreChat,
                );

                if (data) {
                    if (Number(offset) === 0) {
                        // get and send seenBy to other
                        if (moreChat === 'false') {
                            for (let i = 0; i < data.room.length; i++) {
                                if (data.room[i].id === id_other) {
                                    io.emit(`phrase_chatRoom_response_${data._id}_${data.user.id}`, data?.room[i]._id);
                                    break;
                                }
                            }
                        }
                    }
                    return res.status(200).json(data);
                }
                throw new NotFound('GetChat', 'Conversation is Not Found ');
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
    delChatAll = async (req: express.Request, res: any, next: express.NextFunction) => {
        try {
            const conversationId = req.body.conversationId;
            const chatId = req.body.chatId;
            const userId = req.body.userId;
            const userIdCur = req.cookies.k_user;
            console.log(conversationId, chatId, userId);
            const io: Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any> = res.io;
            if (!conversationId || !chatId || !userId)
                throw new NotFound('delChatAll', 'conversationId, userId or chatId or userId not provided');
            if (userId === userIdCur) {
                const data = await SendChatServiceSN.delChatAll(conversationId, chatId, userId);
                if (data) {
                    io.emit(`Conversation_chat_deleteAll_${conversationId}`, { userId, updatedAt: data, chatId });
                }
                return res.status(200).json(data);
            }
            throw new Forbidden('DelChatALL', 'You are no allowed!');
        } catch (error) {
            next(error);
        }
    };
    delChatSelf = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
        try {
            const conversationId = req.body.conversationId;
            const chatId = req.body.chatId;
            const userId = req.body.userId;
            console.log(conversationId, chatId, userId);

            if (!conversationId || !chatId || !userId)
                throw new NotFound('delChatAll', 'conversationId, userId or chatId or userId not provided');
            const data = await SendChatServiceSN.delChatSelf(conversationId, chatId, userId);
            return res.status(200).json(data);
        } catch (error) {
            next(error);
        }
    };
    updateChat = async (req: express.Request, res: any, next: express.NextFunction) => {
        try {
            const conversationId: string = req.body.conversationId;
            const chatId: string = req.body.id_chat;
            const value: string = req.body.value;
            const userIdCur = req.cookies.k_user;
            const userId: string = req.body.userId;
            const id_other: string = req.body.id_other;
            const files = req.files;
            const io: Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any> = res.io;
            console.log(conversationId, chatId);

            if (!conversationId || !chatId || !id_other)
                throw new NotFound(
                    'updateChat UP',
                    'conversationId, userId, id_other or chatId or userId not provided',
                );
            if (userId === userIdCur) {
                const data = await SendChatServiceSN.updateChat(conversationId, chatId, userId, id_other, value, files);
                if (data) {
                    io.emit(`Conversation_chat_update_${conversationId}`, { data, chatId, userId });
                }
                return res.status(200).json(data);
            }
            throw new Forbidden('updateChat Down', 'You are no allowed!');
        } catch (error) {
            next(error);
        }
    };
    pin = async (req: express.Request, res: any, next: express.NextFunction) => {
        try {
            const conversationId: string = req.body.conversationId;
            const chatId: string = req.body.chatId;
            const userId: string = req.body.userId;
            const io: Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any> = res.io;
            const latestChatId: string = req.body.latestChatId;

            if (!conversationId || !chatId || !userId || !latestChatId)
                throw new NotFound(
                    'Pin chat',
                    'conversationId, userId, chatId, latestChatId or chatId or userId not provided',
                );
            const data = await SendChatServiceSN.pin(conversationId, chatId, userId, latestChatId);
            if (data) {
                io.emit(`conversation_pins_room_${conversationId}`, data);
            }
            return res.status(200).json(data);
        } catch (error) {
            next(error);
        }
    };
    getPins = async (req: any, res: any, next: express.NextFunction) => {
        try {
            const conversationId = req.query.conversationId;
            const pins = req.query.pins;
            const io: Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any> = res.io;
            if (!conversationId || !pins?.length)
                throw new NotFound('getPin chat', 'conversationId, pins  not provided');
            const data = await SendChatServiceSN.getPins(conversationId, pins);
            return res.status(200).json(data);
        } catch (error) {
            next(error);
        }
    };
    deletePin = async (req: any, res: any, next: express.NextFunction) => {
        try {
            const conversationId = req.query.conversationId;
            const pinId = req.query.pinId;
            const roomId = req.query.roomId;
            const io: Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any> = res.io;
            if (!conversationId || !pinId || !roomId)
                throw new NotFound('deletePin chat', 'conversationId, pinId, roomId  not provided');
            const data = await SendChatServiceSN.deletePin(conversationId, pinId);
            if (data) {
                io.emit(`conversation_deletedPin_room_${conversationId}`, { pinId, roomId });
            }
            return res.status(200).json(data);
        } catch (error) {
            next(error);
        }
    };
    setBackground = async (req: any, res: any, next: express.NextFunction) => {
        try {
            const conversationId = req.body.conversationId;
            const latestChatId = req.body.latestChatId;
            const userId = req.body.userId;
            const files = req.files;
            const io: Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any> = res.io;
            console.log(files, 'files');

            if (!conversationId || !files || !latestChatId || !userId)
                throw new NotFound('setBackground chat', 'conversationId, files, latestChatId, userId not provided');
            const data = await SendChatServiceSN.setBackground(conversationId, files, latestChatId, userId);
            if (data) {
                io.emit(`conversation_changeBG_room_${conversationId}`, data);
            }
            return res.status(200).json(data);
        } catch (error) {
            next(error);
        }
    };
    delBackground = async (req: any, res: any, next: express.NextFunction) => {
        try {
            const conversationId = req.body.conversationId;
            const io: Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any> = res.io;
            if (!conversationId) throw new NotFound('delBackground chat', 'conversationId not provided');
            const data = await SendChatServiceSN.delBackground(conversationId);
            if (data) {
                io.emit(`conversation_deleteBG_room_${conversationId}`);
            }
            return res.status(200).json(data);
        } catch (error) {
            next(error);
        }
    };
    getConversationBalloon = async (req: any, res: any, next: express.NextFunction) => {
        try {
            const conversationId: string[] = req.body.conversationId;
            const userId = req.cookies.k_user;
            const redisClient: Redis = res.redisClient;
            if (!conversationId) throw new NotFound('delBackground chat', 'conversationId not provided');
            redisClient.get(`managerFactory_balloon_${userId}`, async (err, dataB) => {
                if (dataB) {
                    const dd: {
                        state: string[];
                        newRes: {
                            _id: Types.ObjectId;
                            userId: string;
                            user: {
                                id: string;
                                avatar: any;
                                fullName: string;
                                gender: number;
                            };
                        }[];
                    } = JSON.parse(dataB);
                    if (JSON.stringify(dd.state) === JSON.stringify(conversationId)) {
                        console.log(
                            'redis b',
                            JSON.stringify(dd.state),
                            JSON.stringify(conversationId),
                            JSON.stringify(dd.state) === JSON.stringify(conversationId),
                        );
                        return res.status(200).json(dd.newRes);
                    }
                }
                const data = await SendChatServiceSN.getConversationBalloon(conversationId, userId);
                console.log('mysql b');

                redisClient.set(
                    `managerFactory_balloon_${userId}`,
                    JSON.stringify({ state: conversationId, newRes: data }),
                );
                return res.status(200).json(data);
            });
        } catch (error) {
            next(error);
        }
    };
}
export default new SendChat();
