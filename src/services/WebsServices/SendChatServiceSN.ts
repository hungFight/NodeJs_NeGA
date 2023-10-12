import { RoomChats } from '../../models/mongodb/chats';
import DateTime from '../../DateTimeCurrent/DateTimeCurrent';
import { prisma } from '../..';
const { ObjectId } = require('mongodb');

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
    room: {
        _id: string;
        text: { icon: string; t: string };
        imageOrVideos: { v: string; icon: string; _id: string }[];
        seenBy: string[];
        createdAt: string;
        // user: { avatar: any; fullName: string; gender: number; id: string };
    };
    createdAt: string;
}

class SendChatService {
    send(id_room: string, id: string, id_other: string, value: string, files: any) {
        return new Promise<PropsRoomChat>(async (resolve, reject) => {
            try {
                const ids_file: any = files.map((f: any) => f.metadata.id_file.toString());
                const imagesOrVideos: { v: any; icon: string }[] = [];
                console.log('zooo');

                const res = id_room
                    ? await RoomChats.findOne({
                          _id: id_room,
                          id_us: { $all: [id, id_other] },
                      })
                    : await RoomChats.findOne({
                          // set any to set createdAt below
                          $and: [{ id_us: { $all: [id, id_other] } }, { id_us: { $size: 2 } }],
                      }).select('-room');
                console.log(res, 'send res', id_room, id, id_other);

                if (ids_file) {
                    for (let id of ids_file) {
                        console.log(id);
                        imagesOrVideos.push({ v: id, icon: '' });
                    }
                }
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

                    const room: any = await RoomChats.create({
                        id_us: [id, id_other],
                        status: friend ? 'isFriend' : 'isNotFriend',
                        background: '',
                        users: [],
                        room: [
                            {
                                _id: id,
                                text: {
                                    t: value,
                                },
                                imageOrVideos: imagesOrVideos,
                                createdAt: DateTime(),
                            },
                        ],
                        createdAt: DateTime(),
                    });
                    const user = await prisma.user.findUnique({
                        where: { id: id },
                        select: { id: true, avatar: true, fullName: true, gender: true },
                    });
                    resolve({ ...room._doc, user: user, room: room.room[0], miss: 0 });
                } else {
                    //update it still exist
                    const chat: any = {
                        text: {
                            t: value,
                            icon: '',
                        },
                        _id: id,
                        seenBy: [],
                        imageOrVideos: imagesOrVideos,
                        createdAt: DateTime(),
                    };

                    const roomUpdate: any = await RoomChats.findOneAndUpdate(
                        {
                            _id: id_room,
                            id_us: { $all: [id, id_other] }, // only id and id_other
                        },
                        { $push: { room: chat }, $set: { 'deleted.$[elm].show': false } }, // set show to false

                        { new: true, arrayFilters: [{ 'elm.id': id }] },
                    ).select('-room');
                    if (roomUpdate) {
                        const user = await prisma.user.findUnique({
                            where: { id: id },
                            select: { id: true, avatar: true, fullName: true, gender: true },
                        });
                        resolve({ ...roomUpdate._doc, user: user, room: chat, miss: 0 });
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
                const roomChat = await RoomChats.aggregate([
                    { $match: { id_us: id, 'deleted.show': { $ne: true } } }, // Lọc theo điều kiện tương ứng với _id của document
                    { $unwind: '$room' }, // Tách mỗi phần tử trong mảng room thành một document riêng
                    { $sort: { 'room.createdAt': -1 } }, // Sắp xếp theo trường createdAt trong mỗi phần tử room

                    {
                        $group: {
                            _id: '$_id',
                            createdAt: { $first: '$createdAt' },
                            id_us: { $first: '$id_us' },
                            users: { $first: '$users' },
                            room: { $first: '$room' },
                            deleted: { $first: '$deleted' },
                        },
                    }, // Gom các document thành một mảng room
                    { $sort: { 'room.createdAt': -1 } },
                ]);
                console.log(roomChat, 'roomChat');

                const newData = await new Promise<PropsRoomChat[]>(async (resolve2, reject) => {
                    try {
                        await Promise.all(
                            roomChat.map(async (rs, index) => {
                                const dd: any = await new Promise(async (resolve3, reject) => {
                                    try {
                                        const sd = await Promise.all(
                                            rs.id_us.map(async (id_u: any) => {
                                                if (id_u !== id) {
                                                    const df = await prisma.user.findUnique({
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
                                                    if (Array.isArray(roomChat[index].users)) {
                                                        roomChat[index].users.push(df);
                                                    } else {
                                                        roomChat[index].users = [df];
                                                    }
                                                }
                                            }),
                                        );
                                        resolve3(roomChat);
                                    } catch (error) {
                                        reject(error);
                                    }
                                });
                            }),
                        );
                        resolve2(roomChat);
                    } catch (error) {
                        reject(error);
                    }
                });

                resolve(newData);
            } catch (error) {
                reject(error);
            }
        });
    }
    getChat(id_room: string, id: string, id_other: string, limit: number, offset: number, moreChat: boolean) {
        return new Promise(async (resolve, reject) => {
            try {
                console.log(id_room, id, id_other, limit, offset, ' get  chats');
                const data = {
                    _id: '',
                    id_us: [],
                    user: {},
                    status: '',
                    background: '',
                    room: [
                        {
                            _id: '',
                            text: {
                                t: '',
                                icon: '',
                            },
                            imageOrVideos: [],
                            sending: '',
                            seenBy: [id],
                            createdAt: '',
                        },
                    ],
                    deleted: [],
                    createdAt: '',
                };
                if (id_room && id_other) {
                    const seenBy = await RoomChats.findByIdAndUpdate(
                        { _id: id_room, room: { _id: id_other } },
                        {
                            $addToSet: {
                                'room.$[].seenBy': id, //push all elements in the seenBy document
                            },
                        },
                    );
                    console.log(seenBy, 'seenBy');
                }

                const user = await prisma.user.findUnique({
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
                console.log(user, 'user chats', id_other);

                const Group = moreChat
                    ? {
                          _id: '$_id',
                          room: { $push: '$room' },
                      }
                    : {
                          _id: '$_id',
                          id_us: { $first: '$id_us' },
                          background: { $first: '$background' },
                          status: { $first: '$status' },
                          room: { $push: '$room' },
                          deleted: { $first: '$deleted' },
                          createdAt: { $first: '$createdAt' },
                      };
                if (id_room) {
                    const roomCh: any = await RoomChats.findOne({ _id: id_room }).select('-room');
                    let check = false;
                    let createdAt = '';
                    roomCh?.deleted.forEach((d: { id: string; createdAt: string }) => {
                        if (d.id === id) {
                            check = true;
                            createdAt = d.createdAt;
                        }
                    });
                    if (check && createdAt) {
                        const roomChat = await RoomChats.aggregate([
                            { $match: { _id: id_room } }, // Match the document with the specified roomId
                            { $unwind: '$room' }, // Unwind the room array
                            { $match: { 'room.createdAt': { $gt: createdAt } } },
                            { $sort: { 'room.createdAt': -1 } }, // Sort by createdAt field in descending order
                            { $skip: offset }, // Skip the specified number of documents
                            { $limit: limit }, // Limit the number of documents to retrieve
                            {
                                $group: Group,
                            }, // Group the documents and reconstruct the room array
                        ]);
                        console.log(roomChat, 'get greater createdAt', createdAt);

                        if (roomChat.length) {
                            if (!offset) {
                                roomChat[0].user = user;
                            }
                            resolve(roomChat[0]);
                        }
                        roomCh.user = user;
                        roomCh.room = data.room;
                        resolve(roomCh);
                    } else {
                        const roomChat = await RoomChats.aggregate([
                            { $match: { _id: roomCh._id } }, // Match the document with the specified roomId
                            { $unwind: '$room' }, // Unwind the room array
                            { $sort: { 'room.createdAt': -1 } }, // Sort by createdAt field in descending order
                            { $skip: offset }, // Skip the specified number of documents
                            { $limit: limit }, // Limit the number of documents to retrieve
                            {
                                $group: Group,
                            }, // Group the documents and reconstruct the room array
                        ]);
                        if (roomChat.length) {
                            if (!offset) {
                                resolve({ ...roomChat[0], user: user });
                            }
                            resolve(roomChat[0]);
                        }
                        roomCh.user = user;
                        roomCh.room = data.room;
                        resolve(roomCh);
                    }
                } else {
                    console.log('two data chat pending');
                    let check = false;
                    let createdAt = '';
                    if (!id_other) resolve(false);
                    const id_roomChat: any = await RoomChats.findOne({
                        // set any to set createdAt below
                        $and: [{ id_us: { $all: [id, id_other] } }, { id_us: { $size: 2 } }],
                    }).select('-room');
                    console.log('one data chat pending', id_roomChat);
                    id_roomChat?.deleted.forEach((d: { id: string; createdAt: string }) => {
                        // check deleted watch who deleted that room, another area is the same
                        if (d.id === id) {
                            check = true;
                            createdAt = d.createdAt;
                        }
                    });
                    if (check && createdAt) {
                        if (id_roomChat) {
                            const roomChat = await RoomChats.aggregate([
                                { $match: { _id: id_roomChat._id } }, // Match the document with the specified roomId
                                { $unwind: '$room' }, // Unwind the room array
                                { $match: { 'room.createdAt': { $gt: createdAt } } },
                                { $sort: { 'room.createdAt': -1 } }, // Sort by createdAt field in descending order
                                { $skip: offset }, // Skip the specified number of documents
                                { $limit: limit }, // Limit the number of documents to retrieve
                                {
                                    $group: Group,
                                }, // Group the documents and reconstruct the room array
                            ]);
                            if (roomChat.length) {
                                roomChat[0].user = user;
                                console.log(roomChat[0], 'roomChat[0]');

                                resolve(roomChat[0]);
                            }
                            if (!moreChat) {
                                id_roomChat.user = user;
                                id_roomChat.room = data.room;
                                console.log(roomChat, 'id_roomChat', createdAt);
                                resolve(id_roomChat);
                            } else {
                                resolve(null);
                            }
                        } else {
                            console.log(data, 'data chat pending');
                            resolve({ ...data, user });
                        }
                    } else {
                        if (id_roomChat) {
                            const roomChat = await RoomChats.aggregate([
                                { $match: { _id: id_roomChat._id } }, // Match the document with the specified roomId
                                { $unwind: '$room' }, // Unwind the room array
                                { $sort: { 'room.createdAt': -1 } }, // Sort by createdAt field in descending order
                                { $skip: offset }, // Skip the specified number of documents
                                { $limit: limit }, // Limit the number of documents to retrieve
                                {
                                    $group: Group,
                                }, // Group the documents and reconstruct the room array
                            ]);
                            if (roomChat.length) {
                                roomChat[0].user = user;
                                resolve(roomChat[0]);
                            } else {
                                resolve({ ...data, user });
                            }
                        } else {
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
                            $addToSet: { deleted: { id: id, createdAt: DateTime(), show: true } as any },
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
                if (res) {
                    const roomChat = await RoomChats.aggregate([
                        { $match: { _id: res._id } }, // Match the document with the specified roomId
                        { $unwind: '$room' }, // Unwind the room array
                        { $sort: { 'room.createdAt': -1 } }, // Sort by createdAt field in descending order
                        { $skip: 0 }, // Skip the specified number of documents
                        { $limit: 20 }, // Limit the number of documents to retrieve
                        {
                            $group: {
                                _id: '$_id',
                                room: { $push: '$room' },
                            },
                        }, // Group the documents and reconstruct the room array
                    ]);
                    res.room = roomChat[0].room;
                    console.log('Undo', roomChat[0], res);
                    resolve(res);
                }
                resolve(false);
            } catch (error) {
                reject(error);
            }
        });
    }
    delChatAll(roomId: string, chatId: string) {
        return new Promise(async (resolve, reject) => {
            try {
                const res = await RoomChats.updateOne({ _id: roomId }, { $pull: { room: { _id: chatId } } });
                console.log(res, 'update Chat');
            } catch (error) {
                reject(error);
            }
        });
    }
}
export default new SendChatService();
