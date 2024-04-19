import { RoomChats, Rooms } from '../../models/mongodb/chats';
import DateTime from '../../DateTimeCurrent/DateTimeCurrent';
import { prisma } from '../..';
import XOAuth2 from 'nodemailer/lib/xoauth2';
import { v4 as primaryKey } from 'uuid';
import { Types } from 'mongoose';
const { ObjectId } = require('mongodb');
export interface PropsInfoFile {
    id: string;
    type: string;
    tail: string;
    name: string;
    title?: string;
    id_sort?: number;
    width?: string;
    height?: string;
}

export interface PropsRoomChat {
    _id: any;
    id_us: string[];
    background: string;
    miss: number;
    users: {
        id: string;
        avatar: any;
        fullName: string;
        gender: number;
    }[];
    user: {
        id: string;
        avatar: any;
        fullName: string;
        gender: number;
    };
    rooms: {
        _id: string;
        chatId: string;
        full: boolean;
        index: number;
        count: number;
        filter: {
            _id: string;
            count: number;
            full: boolean;
            index: number;
            data: {
                _id: string;
                text: { icon: string; t: string };
                imageOrVideos: { v: string; icon: string; _id: string }[];
                seenBy: string[];
                createdAt: string;
                secondary?: string;
                // user: { avatar: any; fullName: string; gender: number; id: string };
            }[];
        }[];
    };
    createdAt: string;
}

class SendChatService {
    send(
        conversationId: string,
        id: string,
        id_other: string,
        value: string,
        valueInfoFile: PropsInfoFile[],
        _id_room: string,
        id_sOrReply?:
            | string
            | {
                  id_reply: string;
                  id_replied: string;
                  text: string;
                  imageOrVideos: {
                      _id: string;
                      v: any;
                      icon: string;
                      type: string;
                  }[];
                  byWhoCreatedAt: string;
              },
    ) {
        return new Promise<PropsRoomChat>(async (resolve, reject) => {
            try {
                const imageOrVideos: {
                    _id: string;
                    icon: string;
                    type: string;
                    tail: string;
                }[] = [];
                valueInfoFile.forEach((f) => {
                    imageOrVideos.push({ _id: f.id, icon: '', tail: f.tail, type: f.type });
                }),
                    console.log(imageOrVideos, 'imagesOrVideos');
                const res: any = conversationId
                    ? await RoomChats.findOne({
                          _id: conversationId,
                          id_us: { $all: [id, id_other] },
                      })
                    : await RoomChats.findOne({
                          // set any to set createdAt below
                          $and: [{ id_us: { $all: [id, id_other] } }, { id_us: { $size: 2 } }],
                      }).select('-room');

                if (!res) {
                    // create if it doesn't exist
                    const friend = await prisma.friends.findFirst({
                        where: {
                            OR: [
                                { idRequest: id, idIsRequested: id_other, level: 2 },
                                { idRequest: id_other, idIsRequested: id, level: 2 },
                            ],
                        },
                    });

                    const roomChat: any = await RoomChats.create({
                        id_us: [id, id_other],
                        status: friend ? 'isFriend' : 'isNotFriend',
                        pin: [],
                        users: [],
                        createdAt: DateTime(),
                    });
                    if (roomChat) {
                        const room = await Rooms.create({
                            chatId: roomChat._id,
                            count: 1,
                            full: false,
                            filter: [
                                {
                                    index: 1,
                                    full: false,
                                    count: 1,
                                    data: [
                                        {
                                            userId: id,
                                            _id: _id_room,
                                            text: {
                                                t: value,
                                            },
                                            imageOrVideos,
                                            createdAt: DateTime(),
                                            secondary: typeof id_sOrReply === 'string' ? id_sOrReply : '',
                                        },
                                    ],
                                },
                            ],
                        });
                        const user = await prisma.user.findUnique({
                            where: { id: id },
                            select: { id: true, avatar: true, fullName: true, gender: true },
                        });
                        resolve({ ...roomChat._doc, user: user, room: room.filter[0], miss: 0 });
                    }
                } else {
                    //update it still exist
                    const chat: any = {
                        text: {
                            t: value,
                            icon: '',
                        },
                        userId: id,
                        _id: _id_room,
                        seenBy: [],
                        imageOrVideos: imageOrVideos,
                        createdAt: DateTime(),
                        reply: id_sOrReply,
                    };

                    const roomUpdate = await Rooms.findOne({
                        chatId: res._id,
                        full: false,
                        count: { $lt: 10 },
                    });
                    if (roomUpdate) {
                        roomUpdate.filter.map((f) => {
                            if (f.count >= f.index * 2 && !f.full) {
                                f.full = true;
                                roomUpdate.filter.push({
                                    count: f.count + 1,
                                    full: false,
                                    index: f.index + 1,
                                    data: [chat],
                                });
                                roomUpdate.count += 1;
                            } else if (!f.full) {
                                f.data.push(chat);
                                roomUpdate.count += 1;
                                f.count += 1;
                            }
                            return f;
                        });
                        console.log('yesss');
                        await roomUpdate.save();
                        const user = await prisma.user.findUnique({
                            where: { id: id },
                            select: { id: true, avatar: true, fullName: true, gender: true },
                        });
                        resolve({ ...res._doc, user: user, room: chat, miss: 0 });
                    } else {
                        // const room = await Rooms.create({
                        //     chatId: roomChat._id,
                        //     count: 1,
                        //     full: false,
                        //     filter: [
                        //         {
                        //             index: 1,
                        //             full: false,
                        //             count: 1,
                        //             data: [
                        //                 {
                        //                     userId: id,
                        //                     _id: _id_room,
                        //                     text: {
                        //                         t: value,
                        //                     },
                        //                     imageOrVideos,
                        //                     createdAt: DateTime(),
                        //                     secondary: typeof id_sOrReply === 'string' ? id_sOrReply : '',
                        //                 },
                        //             ],
                        //         },
                        //     ],
                        // });
                    }
                }
            } catch (error) {
                reject(error);
            }
        });
    }
    getRoom(id: string, limit: number, offset: number) {
        return new Promise<PropsRoomChat[]>(async (resolve, reject) => {
            try {
                const roomChat = await RoomChats.find(
                    { id_us: id }, // Lọc theo điều kiện tương ứng với _id của document
                );
                const newD: any = await Promise.all(
                    roomChat.map(async (d) => {
                        const rooms = await Rooms.findOne({ chatId: d._id, full: false }, { filter: { $slice: -1 } });
                        await Promise.all(
                            d.id_us.map(async (id_u: any) => {
                                if (id_u !== id) {
                                    const user: any = await prisma.user.findUnique({
                                        where: {
                                            id: id_u,
                                        },
                                        select: {
                                            id: true,
                                            avatar: true,
                                            fullName: true,
                                            gender: true,
                                        },
                                    });
                                    if (user) {
                                        d.user = user;
                                    }
                                }
                            }),
                        );
                        if (rooms) {
                            rooms.filter[0].data = [rooms.filter[0].data[rooms.filter[0].data.length - 1]];
                            d.rooms = [rooms];
                        }
                        return d;
                    }),
                );
                console.log(newD[0], newD[0].rooms, newD[0].rooms[0].filter[0], 'roomChat');
                resolve(newD);
                //     try {
                //         await Promise.all(
                //             roomChat.map(async (rs, index) => {
                //                 const dd: any = await new Promise(async (resolve3, reject) => {
                //                     try {
                //                         const sd = await Promise.all(
                //                             rs.id_us.map(async (id_u: any) => {
                //                                 if (id_u !== id) {
                //                                     const df = await prisma.user.findUnique({
                //                                         where: {
                //                                             id: id_u,
                //                                         },
                //                                         select: {
                //                                             id: true,
                //                                             avatar: true,
                //                                             fullName: true,
                //                                             gender: true,
                //                                         },
                //                                     });
                //                                     if (Array.isArray(roomChat[index].users)) {
                //                                         roomChat[index].users.push(df);
                //                                     } else {
                //                                         roomChat[index].users = [df];
                //                                     }
                //                                 }
                //                             }),
                //                         );
                //                         resolve3(roomChat);
                //                     } catch (error) {
                //                         reject(error);
                //                     }
                //                 });
                //             }),
                //         );
                //         resolve2(roomChat);
                //     } catch (error) {
                //         reject(error);
                //     }
                // });

                // resolve(newData);
            } catch (error) {
                reject(error);
            }
        });
    }
    getChat(conversationId: string, id: string, id_other: string, limit: number, offset: number, indexRef: number, moreChat: string) {
        return new Promise(async (resolve, reject) => {
            try {
                console.log(conversationId, id, id_other, limit, offset, ' get  chats');
                const data = {
                    _id: '',
                    id_us: [],
                    pins: [],
                    user: {},
                    status: '',
                    rooms: [{ count: 1, index: 1, full: false, filter: [] }],
                    deleted: [],
                    createdAt: '',
                };
                if (conversationId && id_other) {
                    const seenBy = await Rooms.findOneAndUpdate(
                        { chatId: conversationId, index: indexRef },
                        {
                            $addToSet: {
                                'filter.$[fil].data.$[oth].seenBy': id, //push all elements in the seenBy document and uniqueroom: { id: id_other }
                            },
                        },
                        { arrayFilters: [{ 'fil.index': offset }, { 'oth.id': id_other }] },
                    );
                } else {
                    const seenBy = await RoomChats.findOneAndUpdate(
                        {
                            id_us: { $all: [id, id_other] },
                        },
                        {
                            $addToSet: {
                                'filter.$[fil].data.$[oth].seenBy': id, //push all elements in the seenBy document and uniqueroom: { id: id_other }
                            },
                        },
                        { arrayFilters: [{ 'fil.index': offset }, { 'oth.id': id_other }] },
                    );
                    console.log(seenBy, 'seenBy');
                }

                const user: any = await prisma.user.findUnique({
                    where: {
                        id: id_other,
                    },
                    select: {
                        id: true,
                        avatar: true,
                        fullName: true,
                        gender: true,
                    },
                });
                if (conversationId) {
                    const roomCh: any = await RoomChats.findOne({ _id: conversationId });
                    let check = false;
                    let createdAt = '';
                    roomCh?.deleted.forEach((d: { id: string; createdAt: string }) => {
                        if (d.id === id) {
                            check = true;
                            createdAt = d.createdAt;
                        }
                    });

                    if (check && createdAt) {
                        const rooms = await Rooms.aggregate([
                            {
                                $match: {
                                    chatId: roomCh._id,
                                    index: indexRef,
                                },
                            },
                            {
                                $project: {
                                    filter: {
                                        $filter: {
                                            input: '$filter',
                                            as: 'item',
                                            cond: { $eq: ['$$item.index', offset] },
                                        },
                                    },
                                },
                            },
                        ]);
                        // const roomChat = await RoomChats.aggregate([
                        //     { $match: { _id: conversationId } }, // Match the document with the specified roomId
                        //     { $unwind: '$room' }, // Unwind the room array
                        //     { $match: { 'room.createdAt': { $gt: createdAt } } }, // get data by date
                        //     { $sort: { 'room.createdAt': -1 } }, // Sort by createdAt field in descending order
                        //     { $skip: offset }, // Skip the specified number of documents
                        //     { $limit: limit }, // Limit the number of documents to retrieve
                        //     {
                        //         $group: Group,
                        //     }, // Group the documents and reconstruct the room array
                        // ]);

                        if (rooms.length) {
                            if (!offset) {
                                roomCh.user = user;
                                roomCh.rooms = rooms;
                            }
                            resolve(roomCh);
                        }
                        roomCh.user = user;
                        roomCh.room = [];
                        resolve(roomCh);
                    } else {
                        console.log(ObjectId(roomCh._id), ' ObjectId(roomCh._id)');

                        const rooms = await Rooms.aggregate([
                            {
                                $match: {
                                    chatId: ObjectId(roomCh._id),
                                    index: indexRef,
                                },
                            },
                            {
                                $project: {
                                    filter: {
                                        $filter: {
                                            input: '$filter',
                                            as: 'item',
                                            cond: { $eq: ['$$item.index', offset] },
                                        },
                                    },
                                },
                            },
                        ]);

                        if (rooms.length) {
                            roomCh.rooms = rooms;
                            roomCh.user = user;
                            if (!offset) {
                                resolve(roomCh);
                            }
                            resolve(roomCh);
                        }
                        roomCh.user = user;
                        roomCh.room = [];
                        resolve(roomCh);
                    }
                } else {
                    let check = false;
                    let createdAt: Date | string = '';
                    if (!id_other) resolve(false);
                    const id_roomChat = await RoomChats.findOne({
                        // set any to set createdAt below
                        $and: [{ id_us: { $all: [id, id_other] } }, { id_us: { $size: 2 } }],
                    });

                    id_roomChat?.deleted.forEach((d) => {
                        // check deleted watch who deleted that room, another area is the same
                        if (d.id === id) {
                            check = true;
                            createdAt = d.createdAt;
                        }
                    });
                    if (check && createdAt) {
                        if (id_roomChat) {
                            // const roomChat = await RoomChats.aggregate([
                            //     { $match: { _id: id_roomChat?._id } }, // Match the document with the specified roomId
                            //     { $unwind: '$room' }, // Unwind the room array
                            //     { $match: { 'room.createdAt': { $gt: createdAt } } },
                            //     { $sort: { 'room.createdAt': -1 } }, // Sort by createdAt field in descending order
                            //     { $skip: offset }, // Skip the specified number of documents
                            //     { $limit: limit }, // Limit the number of documents to retrieve
                            //     {
                            //         $lookup: {
                            //             from: 'infoFile',
                            //             localField: 'room.imageOrVideos._id',
                            //             foreignField: 'id',
                            //             as: 'infoFile',
                            //         },
                            //     },
                            //     {
                            //         $group: Group,
                            //     }, // Group the documents and reconstruct the room array
                            // ]);
                            const rooms = await Rooms.aggregate([
                                {
                                    $match: {
                                        chatId: id_roomChat._id,
                                        index: indexRef,
                                    },
                                },
                                {
                                    $project: {
                                        filter: {
                                            $filter: {
                                                input: '$filter',
                                                as: 'item',
                                                cond: { $eq: ['$$item.index', offset] },
                                            },
                                        },
                                    },
                                },
                            ]);
                            console.log(rooms, rooms[0].filter, 'roomChat0 rr');
                            console.log(id_roomChat, 'roomChat2s', moreChat);
                            if (id_roomChat) {
                                id_roomChat.user = user;
                                id_roomChat.rooms = rooms;
                                resolve(id_roomChat);
                            }
                            if (moreChat === 'false') {
                                // if rooms is empty
                                id_roomChat.user = user;
                                id_roomChat.rooms = [];
                                resolve(id_roomChat);
                            } else {
                                resolve(null);
                            }
                        } else {
                            resolve({ ...data, user });
                        }
                    } else {
                        if (id_roomChat) {
                            // const roomChat = await RoomChats.aggregate([
                            //     { $match: { _id: id_roomChat._id } }, // Match the document with the specified roomId
                            //     { $unwind: '$room' }, // Unwind the room array
                            //     { $sort: { 'room.createdAt': -1 } }, // Sort by createdAt field in descending order
                            //     { $skip: offset }, // Skip the specified number of documents
                            //     { $limit: limit }, // Limit the number of documents to retrieve
                            //     {
                            //         $lookup: {
                            //             from: 'infoFile',
                            //             localField: 'room.imageOrVideos._id',
                            //             foreignField: 'id',
                            //             as: 'infoFile',
                            //         },
                            //     },
                            //     {
                            //         $group: Group,
                            //     }, // Group the documents and reconstruct the room array
                            // ]);
                            const rooms = await Rooms.aggregate([
                                {
                                    $match: {
                                        chatId: id_roomChat._id,
                                        index: indexRef,
                                    },
                                },
                                {
                                    $project: {
                                        filter: {
                                            $filter: {
                                                input: '$filter',
                                                as: 'item',
                                                cond: { $eq: ['$$item.index', offset] },
                                            },
                                        },
                                    },
                                },
                            ]);
                            console.log(rooms, 'roomChat6s');

                            if (id_roomChat) {
                                id_roomChat.user = user;
                                id_roomChat.rooms = rooms;
                                resolve(id_roomChat);
                            } else {
                                data.rooms = [];
                                data.user = user;
                                resolve(data);
                            }
                        } else {
                            data.rooms = [];
                            resolve({ ...data, user });
                        }
                    }
                }
            } catch (error) {
                reject(error);
            }
        });
    }

    delete(id_room: string, id: string) {
        return new Promise(async (resolve, reject) => {
            try {
                const chats: any = await RoomChats.findOne({
                    _id: id_room,
                });
                if (chats?.deleted.some((c: { id: string }) => c.id === id)) {
                    const res = await RoomChats.findOneAndUpdate(
                        {
                            _id: id_room,
                            'deleted.id': id,
                        },
                        {
                            $set: { 'deleted.$.createdAt': DateTime(), 'deleted.$.show': true },
                        },
                    ).select('deleted');
                    resolve(res);
                } else {
                    const res = await RoomChats.findOneAndUpdate(
                        {
                            _id: id_room,
                        },
                        {
                            $addToSet: { deleted: { id: id, createdAt: DateTime(), show: true } as any }, // push with unique
                        },
                        { new: true },
                    ).select('deleted');
                    resolve(res);
                }
            } catch (error) {
                reject(error);
            }
        });
    }
    undo(id_room: string, id: string) {
        return new Promise(async (resolve, reject) => {
            try {
                const res = await RoomChats.findOneAndUpdate(
                    {
                        _id: id_room,
                    },
                    {
                        $pull: { deleted: { id: id } as any },
                    },
                    { new: true },
                ).select('-room');
                // if (res) {
                //     const roomChat = await RoomChats.aggregate([
                //         { $match: { _id: res._id } }, // Match the document with the specified roomId
                //         { $unwind: '$room' }, // Unwind the room array
                //         { $sort: { 'room.createdAt': -1 } }, // Sort by createdAt field in descending order
                //         { $skip: 0 }, // Skip the specified number of documents
                //         { $limit: 20 }, // Limit the number of documents to retrieve
                //         {
                //             $group: {
                //                 _id: '$_id',
                //                 room: { $push: '$room' },
                //             },
                //         }, // Group the documents and reconstruct the room array
                //     ]);
                //     res.room = roomChat[0].room;
                //     const user: any = await prisma.user.findUnique({
                //         // one
                //         where: {
                //             id: res.id_us.filter((f) => f !== id)[0],
                //         },
                //         select: {
                //             id: true,
                //             avatar: true,
                //             fullName: true,
                //             gender: true,
                //         },
                //     });
                //     if (user) res.user = user;
                //     resolve(res);
                // }
                resolve(false);
            } catch (error) {
                reject(error);
            }
        });
    }
    delChatAll(conversationId: string, chatId: string, userId: string) {
        // delete both side
        return new Promise(async (resolve, reject) => {
            try {
                const date = new Date();
                const res = await RoomChats.updateOne(
                    { _id: conversationId, 'room._id': chatId, 'room.id': userId },
                    {
                        $set: {
                            'room.$[delete].text': { t: '' },
                            'room.$[delete].imageOrVideos': [],
                            'room.$[delete].delete': 'all',
                            'room.$[delete].updatedAt': date,
                        },
                    },
                    {
                        new: true,
                        arrayFilters: [
                            {
                                'delete._id': chatId,
                                'delete.id': userId, // Replace with the specific element ID you want to update
                            },
                        ],
                    },
                );
                if (res.acknowledged) {
                    resolve(date);
                } else {
                    resolve(null);
                }
            } catch (error) {
                reject(error);
            }
        });
    }
    delChatSelf(conversationId: string, chatId: string, userId: string) {
        // delete both side
        return new Promise(async (resolve, reject) => {
            try {
                const date = new Date();
                const res = await RoomChats.updateOne(
                    { _id: conversationId, 'room._id': chatId },
                    {
                        $set: {
                            'room.$[delete].delete': userId,
                            'room.$[delete].updatedAt': date,
                        },
                    },
                    {
                        new: true,
                        arrayFilters: [
                            {
                                'delete._id': chatId,
                            },
                        ],
                    },
                );
                if (res.acknowledged) {
                    resolve(date);
                }
                resolve(null);
                // const res = await RoomChats.updateOne(
                //     { _id: conversationId },
                //     { $pull: { room: { _id: chatId, id: userId } } },
                // );
            } catch (error) {
                reject(error);
            }
        });
    }
    updateChat(conversationId: string, chatId: string, userId: string, id_other: string, value: string, files: PropsInfoFile[]) {
        // delete both side
        return new Promise(async (resolve, reject) => {
            try {
                const imageOrVideos: {
                    readonly _id: string;
                    readonly icon: string;
                    readonly type: string;
                    readonly tail: string;
                }[] = [];
                files.forEach((f) => {
                    imageOrVideos.push({ _id: f.id, icon: '', tail: f.tail, type: f.type });
                });
                const res: any = await RoomChats.findOne({ _id: conversationId, 'room._id': chatId }, { 'room.$': 1 }); // it's an array
                if (res?.room.length) {
                    if (imageOrVideos.length || value) {
                        const seenBy: string[] = res.room[0].seenBy ?? [];
                        let $set = {};
                        if (value && !imageOrVideos.length) {
                            $set = {
                                'room.$[roomId].text.t': value,
                                'room.$[roomId].update': seenBy.includes(id_other) ? userId : 'changed',
                                'room.$[roomId].updatedAt': new Date(),
                            };
                        }
                        if (imageOrVideos.length && !value) {
                            $set = {
                                'room.$[roomId].imageOrVideos': imageOrVideos,
                                'room.$[roomId].update': seenBy.includes(id_other) ? userId : 'changed',
                                'room.$[roomId].updatedAt': new Date(),
                            };
                        }
                        if (value && imageOrVideos.length) {
                            $set = {
                                'room.$[roomId].text.t': value,
                                'room.$[roomId].imageOrVideos': imageOrVideos,
                                'room.$[roomId].update': seenBy.includes(id_other) ? userId : 'changed',
                                'room.$[roomId].updatedAt': new Date(),
                            };
                        }
                        const re = await RoomChats.updateOne(
                            { _id: conversationId, 'room._id': chatId, 'room.id': userId },
                            { $set },
                            {
                                new: true,
                                arrayFilters: [
                                    {
                                        'roomId._id': chatId,
                                        'roomId.id': userId, // Replace with the specific element ID you want to update
                                    },
                                ],
                            },
                        );
                        if (re.acknowledged) {
                            const rec: any = await RoomChats.findOne({ _id: conversationId, 'room._id': chatId }, { 'room.$': 1 });
                            resolve(rec.room[0]);
                        } else {
                            resolve(null);
                        }
                    }
                }
            } catch (error) {
                reject(error);
            }
        });
    }
    pin(conversationId: string, chatId: string, userId: string, latestChatId: string) {
        // delete both side
        return new Promise(async (resolve, reject) => {
            try {
                const date = new Date();
                const _id = primaryKey();
                const res = await RoomChats.updateOne(
                    { _id: conversationId, 'pins.chatId': { $ne: chatId } }, // $ne check chatId in pins, did it exist? if yes it won't be updated
                    {
                        $addToSet: { pins: { chatId, userId, createdAt: date, latestChatId, _id } }, // push an element into pins
                    },

                    {
                        new: true,
                    },
                );
                if (res.acknowledged) {
                    resolve({ chatId, userId, createdAt: date, latestChatId, _id });
                }
                resolve(null);
            } catch (error) {
                reject(error);
            }
        });
    }
    getPins(conversationId: string, pins: string[]) {
        // delete both side
        return new Promise(async (resolve, reject) => {
            try {
                const res = await RoomChats.aggregate([
                    // Match documents with the specified conversationId
                    {
                        $match: {
                            _id: ObjectId(conversationId), // Convert to ObjectId if not already
                        },
                    },
                    // Unwind the 'room' array to work with its elements
                    {
                        $unwind: '$room',
                    },
                    // Filter 'room' elements where '_id' is in the 'pins' array
                    {
                        $match: {
                            'room._id': { $in: pins },
                        },
                    },
                    // Group the filtered elements back into an array
                    {
                        $group: {
                            _id: '$_id', // Group by the conversation document's _id
                            room: { $push: '$room' },
                        },
                    },
                ]);
                if (res?.length) {
                    resolve(res[0].room);
                }
                resolve(null);
            } catch (error) {
                reject(error);
            }
        });
    }
    deletePin(conversationId: string, pinId: string) {
        // delete both side
        return new Promise(async (resolve, reject) => {
            try {
                const res = await RoomChats.updateOne(
                    {
                        _id: conversationId,
                    },
                    { $pull: { pins: { _id: pinId } } },
                    { new: true },
                );
                resolve(res.acknowledged);
            } catch (error) {
                reject(error);
            }
        });
    }
    delBackground(conversationId: string) {
        // delete both side
        return new Promise(async (resolve, reject) => {
            try {
                const res = await RoomChats.updateOne(
                    {
                        _id: conversationId,
                    },
                    {
                        $set: {
                            background: null,
                        },
                    },
                    { new: true },
                );
                resolve(res.acknowledged);
            } catch (error) {
                reject(error);
            }
        });
    }
    setBackground(conversationId: string, id_file: { id: string; type: string }, latestChatId: string, userId: string) {
        // delete both side
        return new Promise(async (resolve, reject) => {
            try {
                const ids_file = {
                    type: id_file.type,
                    v: id_file.id,
                    id: id_file.id,
                    userId,
                    latestChatId,
                };
                const res = await RoomChats.updateOne(
                    {
                        _id: conversationId,
                    },
                    {
                        $set: {
                            background: ids_file,
                        },
                    },
                    { new: true },
                );
                if (res.acknowledged) {
                    resolve(ids_file);
                }
                resolve(null);
            } catch (error) {
                reject(error);
            }
        });
    }
    getConversationBalloon(conversationId: string[], userId: string) {
        // delete both side
        return new Promise(async (resolve, reject) => {
            try {
                const res = await RoomChats.find({
                    _id: { $in: conversationId },
                }).select('id_us user');
                const newRes: {
                    _id: Types.ObjectId;
                    userId: string;
                    user?: {
                        id: string;
                        avatar: any;
                        fullName: string;
                        gender: number;
                    };
                }[] = res.map((r) => ({ _id: r._id, userId: r.id_us.filter((u) => u !== userId)[0] }));
                console.log(newRes, 'newRes old');

                const allData = await new Promise(async (resolve, reject) => {
                    try {
                        await Promise.all(
                            newRes.map(async (r) => {
                                const user = await prisma.user.findUnique({
                                    where: { id: r.userId },
                                    select: {
                                        id: true,
                                        avatar: true,
                                        fullName: true,
                                        gender: true,
                                    },
                                });
                                if (user) r.user = user;
                            }),
                        );
                        resolve(newRes);
                    } catch (error) {
                        reject(error);
                    }
                });

                // more than 2
                //    await Promise.all(res.map(async(r) => {
                //     await Promise.all(r.id_us.map(async(u) => {
                //         if(u !== userId){

                //         }
                //     }));
                //    }));
                resolve(allData);
            } catch (error) {
                reject(error);
            }
        });
    }
}
export default new SendChatService();
