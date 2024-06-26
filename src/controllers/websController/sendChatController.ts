import express from 'express';

import SendChatServiceSN from '../../services/WebsServices/SendChatServiceSN';
import ServerError from '../../utils/errors/ServerError';
import NotFound from '../../utils/errors/NotFound';
import Forbidden from '../../utils/errors/Forbidden';
import { Types } from 'mongoose';
import { Redis } from 'ioredis';
import { DefaultEventsMap } from 'socket.io/dist/typed-events';
import { Server } from 'socket.io';
import Validation from '../../utils/errors/Validation';
import { PropsRoomChat, PropsRooms } from '../../typescript/senChatType';
import { io } from '../..';
import { getRedis } from '../../connectDatabase/connect.Redis';
class SendChat {
    sendChat = async (req: any, res: any, next: express.NextFunction) => {
        try {
            const id = req.cookies.k_user,
                value = req.body.value,
                id_other = req.body.id_others,
                id_data = req.body.id_data,
                id_secondary = req.body.id_secondary,
                valueInfoFile = req.body.valueInfoFile,
                io: Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any> = res.io,
                reply = req.body.reply,
                conversationId = req.body.conversationId,
                indexRoom = req.body.indexRoom;
            if (!Validation.validUUID([id_data, id, id_other]) || (conversationId && !Validation.validMongoID(conversationId))) throw new NotFound('SendChatController', 'Invalid regex');
            if (id_other && id_data) {
                const data = await SendChatServiceSN.send(conversationId, id, id_other, value, valueInfoFile, id_data, indexRoom, reply ? JSON.parse(reply) : id_secondary);
                const key_redis = id_other + '-' + 'AmountMessageIsNotSeen' + '-' + data._id;
                if (data) {
                    // const newD = await new Promise<PropsRoomChat>((resolve, reject) => {
                    //     try {
                    //         getRedis().get(key_redis, (err, result) => {
                    //             if (err) throw new ServerError('Error getting data from redis at CTL SendChat', err);
                    //             getRedis().set(key_redis, result ? JSON.parse(result) + 1 : 1);
                    //             data.miss = result ? JSON.parse(result) + 1 : 0;
                    //             resolve(data);
                    //         });
                    //     } catch (error) {
                    //         reject(error);
                    //     }
                    // });
                    data._id = data._id.toString();
                    console.log(data, 'data');
                    io.emit(`${id_other}roomChat`, JSON.stringify(data)); // It's in App.tsx
                    if (!conversationId) io.emit(`${id + '-' + id_other}phrase_chatRoom`, { userId: id, data: data }); // It's in Messenger
                    else io.emit(`${data._id}phrase_chatRoom`, { userId: id, data: data }); // It's in Messenger

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
            if (!Validation.validUUID(id)) throw new NotFound('GetRoom', 'Invalid id regex!');
            const limit = req.query.limit,
                offset = req.query.offset;
            const data = await SendChatServiceSN.getRoom(id, Number(limit), Number(offset));
            await Promise.all(
                data.map(async (r) => {
                    const key_redis = id + '-' + 'AmountMessageIsNotSeen' + '-' + r._id;
                    const amount = await new Promise<number>((resolve, reject) => {
                        try {
                            getRedis().get(key_redis, (err, result) => {
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
            const id = req.cookies.k_user,
                conversationId = req.query.conversationId,
                id_other = req.query.id_other,
                indexRef = req.query.indexRef,
                io: Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any> = res.io,
                indexQuery: number = req.query.indexQuery,
                moreChat = req.query.moreChat;
            if (!Validation.validUUID([id, id_other]) || (conversationId && !Validation.validMongoID(conversationId))) throw new NotFound('GetChat', 'Invalid id regex!');
            if (id_other) {
                const data: PropsRoomChat & PropsRooms = await SendChatServiceSN.getChat(conversationId, id, id_other, Number(indexQuery), Number(indexRef), moreChat);
                return res.status(200).json(data);
            }
            throw new NotFound('GetChat', 'Not Found id_room or id_other');
        } catch (error) {
            next(error);
        }
    };
    delete = async (req: any, res: express.Response, next: express.NextFunction) => {
        try {
            const id = req.cookies.k_user,
                id_room = req.query.id_room;
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
            const conversationId = req.body.conversationId,
                roomId = req.body.roomId,
                dataId = req.body.dataId,
                filterId = req.body.filterId,
                userId = req.body.userId,
                userIdCur = req.cookies.k_user,
                io: Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any> = res.io;
            if (!conversationId || !dataId || !userId || !roomId || !filterId) throw new NotFound('delChatAll', 'conversationId, userId or chatId or userId not provided');
            if (userId === userIdCur) {
                const data = await SendChatServiceSN.delChatAll(roomId, filterId, dataId, userId);
                if (data) {
                    io.emit(`Conversation_chat_deleteAll_${conversationId}`, { userId, updatedAt: data, roomId, filterId, dataId });
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
            const conversationId = req.body.conversationId,
                roomId = req.body.roomId,
                dataId = req.body.dataId,
                filterId = req.body.filterId,
                userIdCur = req.cookies.k_user;
            if (!conversationId || !filterId || !dataId || !userIdCur || !roomId) throw new NotFound('delChatAll', 'conversationId, filterId, userIdCur, roomId or dataId or userId not provided');
            const data = await SendChatServiceSN.delChatSelf(roomId, filterId, dataId, userIdCur);
            return res.status(200).json(data);
        } catch (error) {
            next(error);
        }
    };
    updateChat = async (req: express.Request, res: any, next: express.NextFunction) => {
        try {
            const conversationId: string = req.body.conversationId,
                roomId: string = req.body.roomId,
                filterId: string = req.body.filterId,
                dataId: string = req.body.dataId,
                value: string = req.body.value,
                userIdCur = req.cookies.k_user,
                userId: string = req.body.userId,
                id_other: string = req.body.id_other,
                files = req.body.filesId;

            const io: Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any> = res.io;
            if (!conversationId || !dataId || !id_other || !filterId || !roomId || !Validation.validMongoID([conversationId, filterId, roomId]))
                throw new NotFound('updateChat UP', 'conversationId, filterId, roomId, userId, id_other or dataId or userId not provided');
            if (userId === userIdCur) {
                const data = await SendChatServiceSN.updateChat(roomId, filterId, dataId, userId, id_other, value, files);
                if (data) {
                    io.emit(`Conversation_chat_update_${conversationId}`, { data, dataId, userId, roomId, filterId });
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
            const conversationId: string = req.body.conversationId,
                chatId: string = req.body.chatId,
                userId = req.body.userId,
                io: Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any> = res.io,
                roomId = req.body.roomId,
                filterId = req.body.filterId;

            if (!Validation.validMongoID([conversationId, roomId, filterId]) || !Validation.validUUID([chatId, userId]))
                throw new NotFound('Pin chat', 'conversationId, userId, chatId, latestChatId or chatId or userId not provided');
            const data = await SendChatServiceSN.pin(conversationId, roomId, filterId, chatId, userId);
            if (data) io.emit(`conversation_pins_room_${conversationId}`, data);
            return res.status(200).json(data);
        } catch (error) {
            next(error);
        }
    };
    getPins = async (req: any, res: any, next: express.NextFunction) => {
        try {
            const conversationId = req.query.conversationId,
                pins = req.query.pins,
                io: Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any> = res.io;
            if (!conversationId || !pins?.length) throw new NotFound('getPin chat', 'conversationId, pins  not provided');
            const data = await SendChatServiceSN.getPins(conversationId, pins);
            return res.status(200).json(data);
        } catch (error) {
            next(error);
        }
    };
    deletePin = async (req: any, res: any, next: express.NextFunction) => {
        try {
            const conversationId = req.query.conversationId,
                pinId = req.query.pinId,
                roomId = req.query.roomId,
                io: Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any> = res.io;
            if (!conversationId || !pinId || !roomId) throw new NotFound('deletePin chat', 'conversationId, pinId, roomId  not provided');
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
            const conversationId = req.body.conversationId,
                userId = req.cookies.k_user,
                dataId = req.body.dataId,
                id_file = req.body.id_file,
                io: Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any> = res.io;

            if (!Validation.validMongoID(conversationId) || !Validation.validUUID([userId, dataId]) || !id_file) throw new NotFound('setBackground chat', 'invalid regex!');
            const data = await SendChatServiceSN.setBackground(conversationId, id_file, userId, dataId);
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
            const conversationId = req.body.conversationId,
                userId = req.cookies.k_user,
                dataId = req.body.dataId,
                io: Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any> = res.io;

            if (!conversationId) throw new NotFound('delBackground chat', 'conversationId not provided');
            const data = await SendChatServiceSN.delBackground(conversationId, userId, dataId);
            if (data) {
                io.emit(`conversation_deleteBG_room_${conversationId}`, data);
            }
            return res.status(200).json(data);
        } catch (error) {
            next(error);
        }
    };
    getConversationBalloon = async (req: any, res: any, next: express.NextFunction) => {
        try {
            const conversationId: string[] = req.body.conversationId,
                userId = req.cookies.k_user;
            if (!conversationId) throw new NotFound('delBackground chat', 'conversationId not provided');
            getRedis().get(`managerFactory_balloon_${userId}`, async (err, dataB) => {
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
                        console.log('redis b', JSON.stringify(dd.state), JSON.stringify(conversationId), JSON.stringify(dd.state) === JSON.stringify(conversationId));
                        return res.status(200).json(dd.newRes);
                    }
                }
                const data = await SendChatServiceSN.getConversationBalloon(conversationId, userId);
                console.log('mysql b');

                getRedis().set(`managerFactory_balloon_${userId}`, JSON.stringify({ state: conversationId, newRes: data }));
                return res.status(200).json(data);
            });
        } catch (error) {
            next(error);
        }
    };
    setSeenBy = async (req: any, res: any, next: express.NextFunction) => {
        try {
            const param = req.body.param,
                userId = req.cookies.k_user,
                conversationId = req.body.conversationId;
            if (!Validation.validMongoID(conversationId)) throw new NotFound('SetSeenBy', 'invalid Id!');
            const date = new Date();
            io.emit(`conversation_see_chats_${conversationId}`, { param, userId, createdAt: date });
            const data = await SendChatServiceSN.setSeenBy(param, userId, date);
            return res.status(200).json(data);
        } catch (error) {
            next(error);
        }
    };
}
export default new SendChat();
