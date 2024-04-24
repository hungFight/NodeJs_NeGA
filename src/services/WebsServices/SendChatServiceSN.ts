import { ConversationRooms, Rooms } from '../../models/mongodb/chats';
import DateTime from '../../DateTimeCurrent/DateTimeCurrent';
import { prisma } from '../..';
import { v4 as primaryKey } from 'uuid';
import { Types } from 'mongoose';
const { ObjectId } = Types;
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
        indexRoom: number,
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
                const [user, res]: any = await Promise.all([
                    prisma.user.findUnique({
                        where: { id: id },
                        select: { id: true, avatar: true, fullName: true, gender: true },
                    }),
                    conversationId
                        ? ConversationRooms.findOne({
                              _id: conversationId,
                              id_us: { $all: [id, id_other] },
                          })
                        : ConversationRooms.findOne({
                              // set any to set createdAt below
                              $and: [{ id_us: { $all: [id, id_other] } }, { id_us: { $size: 2 } }],
                          }),
                ]);

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

                    const roomChat: any = await ConversationRooms.create({
                        id_us: [id, id_other],
                        status: friend ? 'isFriend' : 'isNotFriend',
                        pin: [],
                        users: [],
                        createdAt: DateTime(),
                    });
                    if (roomChat) {
                        console.log('777', roomChat);

                        const room = await Rooms.create({
                            chatId: roomChat._id,
                            count: 1,
                            full: false,
                            index: 1,
                            createdAt: new Date(),
                            filter: [
                                {
                                    index: 1,
                                    full: false,
                                    count: 1,
                                    indexQuery: 10,
                                    createdAt: new Date(),
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
                        resolve({ ...roomChat._doc, user: user, rooms: room, miss: 0 });
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
                        count: { $lt: 50 },
                    });
                    let check = false;
                    let createdAt: string | Date = '';
                    res?.deleted.forEach((d: { id: string; createdAt: string | Date }) => {
                        if (d.id === id) {
                            check = true;
                            createdAt = d.createdAt;
                        }
                    });
                    console.log('888');
                    if (roomUpdate) {
                        function updateRoom(roomUpdate_: typeof roomUpdate) {
                            if (roomUpdate_) {
                                roomUpdate_.filter.map((f) => {
                                    if ((f.count >= f.index * 10 && !f.full) || (check && createdAt)) {
                                        f.full = true;
                                        roomUpdate_.filter.push({
                                            indexQuery: f.indexQuery - 1,
                                            count: f.count + 1,
                                            full: false,
                                            index: f.index + 1,
                                            data: [chat],
                                            createdAt: new Date(),
                                        });
                                        roomUpdate_.count += 1;
                                    } else if (!f.full) {
                                        f.data.push(chat);
                                        roomUpdate_.count += 1;
                                        f.count += 1;
                                    }
                                    return f;
                                });
                            }
                        }
                        updateRoom(roomUpdate);
                        if (roomUpdate.count === 50) roomUpdate.full = true;
                        console.log('yesss');
                        await roomUpdate.save().catch((err: any) => {
                            console.log(err, 'err update');

                            updateRoom(roomUpdate);
                        });
                        const filter = roomUpdate.filter[roomUpdate.filter.length - 1];
                        console.log(roomUpdate, 'roomUpdate');

                        resolve({
                            ...res._doc,
                            user: user,
                            rooms: { ...roomUpdate, filter: [{ ...filter, data: [chat] }] },
                            miss: 0,
                        });
                    } else {
                        console.log('999', conversationId);
                        const room = await Rooms.create({
                            chatId: conversationId,
                            count: 1,
                            index: indexRoom + 1,
                            createdAt: new Date(),
                            full: false,
                            filter: [
                                {
                                    index: 1,
                                    full: false,
                                    createdAt: new Date(),
                                    indexQuery: 10,
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

                        resolve({
                            ...res._doc,
                            user: user,
                            rooms: room,
                            miss: 0,
                        });
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
                const roomChat = await ConversationRooms.find(
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
                console.log(newD, 'roomChat');
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
    getChat(
        conversationId: string,
        id: string,
        id_other: string,
        limit: number,
        offset: number,
        indexRef: number,
        moreChat: 'false' | 'true',
        id_room?: string,
    ) {
        return new Promise(async (resolve, reject) => {
            function getLimitRoom(id_roomChat_: any, user: any) {
                if (id_roomChat_) {
                    if (moreChat === 'true') {
                        getNextFilter(id_roomChat_._id, indexRef, offset + 1).then(async (data_) => {
                            if (data_) {
                                if (data_?.filter[0]?.data.length) {
                                    id_roomChat_.user = user;
                                    id_roomChat_.rooms = [data_];
                                    resolve(id_roomChat_);
                                } else {
                                    const olderRooms = await Rooms.find(
                                        { _id: { $lt: id_room } },
                                        {
                                            filter: { $slice: -1 },
                                        },
                                    )
                                        .sort({ _id: -1 })
                                        .limit(1);
                                    console.log(olderRooms, 'olderRooms');

                                    id_roomChat_.user = user;
                                    if (olderRooms.length) {
                                        id_roomChat_.rooms = olderRooms;
                                        resolve(id_roomChat_);
                                    } else {
                                        id_roomChat_.rooms = [];
                                        resolve(id_roomChat_);
                                    }
                                }
                            }
                        });
                    } else {
                        getFirstFilter(id_roomChat_._id).then((data_) => {
                            if (data_) {
                                if (data_?.filter[0] && data_?.filter[0].data.length <= 5) {
                                    id_roomChat_.user = user;
                                    getNextFilter(id_roomChat_._id, data_?.index, data_?.filter[0].indexQuery).then(async (da_) => {
                                        if (!da_ || !da_?.filter[0]?.data.length) {
                                            const olderRooms = await Rooms.find(
                                                { _id: { $lt: data_._id } },
                                                {
                                                    filter: { $slice: -1 },
                                                },
                                            )
                                                .sort({ _id: -1 })
                                                .limit(1);
                                            if (olderRooms.length) {
                                                id_roomChat_.rooms = [data_, ...olderRooms];
                                                resolve(id_roomChat_);
                                            }
                                            id_roomChat_.rooms = data_ ? [data_] : [];
                                            resolve(id_roomChat_);
                                        } else {
                                            da_.filter = [...data_?.filter, ...da_?.filter];
                                            id_roomChat_.rooms = [da_];
                                            resolve(id_roomChat_);
                                        }
                                    });
                                } else {
                                    id_roomChat_.user = user;
                                    id_roomChat_.rooms = data_ ? [data_] : [];
                                    resolve(id_roomChat_);
                                }
                            }
                        });
                    }
                }
            }
            async function getNextFilter(id_roomChat_: Types.ObjectId, indexRef_: number, offset_: number) {
                const rooms = await Rooms.findOne(
                    { chatId: id_roomChat_, index: indexRef_ },
                    { count: 1, index: 1, createdAt: 1, chatId: 1, full: 1, filter: { $elemMatch: { indexQuery: offset_ + 1 } } },
                );
                return rooms;
                // const rooms = await Rooms.aggregate([
                //     {
                //         $match: {
                //             chatId: id_roomChat_,
                //             index: indexRef_,
                //         },
                //     },
                //     {
                //         $project: {
                //             count: 1,
                //             index: 1,
                //             indexQuery: 1,
                //             createdAt: 1,
                //             filter: {
                //                 $filter: {
                //                     input: '$filter',
                //                     as: 'item',
                //                     cond: { $eq: ['$$item.indexQuery', offset_ + 1] },
                //                 },
                //             },
                //         },
                //     },
                // ]);
                // return rooms[0];
            }
            async function getFirstFilter(id_roomChat_: Types.ObjectId) {
                const rooms = await Rooms.findOne(
                    {
                        chatId: id_roomChat_,
                    },
                    {
                        filter: { $slice: -1 },
                    },
                ).sort({ _id: -1 });
                return rooms;
            }
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
                console.time('TIME-PROCESS');

                const proSeenBy = new Promise(async (resolve, reject) => {
                    if (conversationId && id_other) {
                        resolve(
                            Rooms.findOneAndUpdate(
                                { chatId: conversationId, index: indexRef },
                                {
                                    $addToSet: {
                                        'filter.$[fil].data.$[oth].seenBy': id, //push all elements in the seenBy document and uniqueroom: { id: id_other }
                                    },
                                },
                                { arrayFilters: [{ 'fil.index': offset }, { 'oth.id': id_other }] },
                            ),
                        );
                    } else {
                        const seenBy = ConversationRooms.findOneAndUpdate(
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
                        resolve(seenBy);
                    }
                });
                const [_, user, id_roomChat] = await Promise.all([
                    proSeenBy,
                    prisma.user.findUnique({
                        where: {
                            id: id_other,
                        },
                        select: {
                            id: true,
                            avatar: true,
                            fullName: true,
                            gender: true,
                        },
                    }),
                    conversationId
                        ? ConversationRooms.findOne({ _id: conversationId })
                        : ConversationRooms.findOne({
                              // set any to set createdAt below
                              $and: [{ id_us: { $all: [id, id_other] } }, { id_us: { $size: 2 } }],
                          }),
                ]);
                console.timeEnd('TIME-PROCESS');
                console.log(_, 'seenBy', user);
                if (id_roomChat) {
                    let check = false;
                    let createdAt: string | Date = '';
                    id_roomChat?.deleted.forEach((d) => {
                        // check deleted watch who deleted that room, another area is the same
                        if (d.id === id) {
                            check = true;
                            createdAt = d.createdAt;
                        }
                    });
                    if (check && createdAt) {
                        if (id_roomChat) {
                            // const roomChat = await ConversationRooms.aggregate([
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
                        if (!id_roomChat) {
                            data.rooms = [];
                            resolve({ ...data, user });
                        }
                        getLimitRoom(id_roomChat, user);
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
                const chats: any = await ConversationRooms.findOne({
                    _id: id_room,
                });
                if (chats?.deleted.some((c: { id: string }) => c.id === id)) {
                    const res = await ConversationRooms.findOneAndUpdate(
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
                    const res = await ConversationRooms.findOneAndUpdate(
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
                const res = await ConversationRooms.findOneAndUpdate(
                    {
                        _id: id_room,
                    },
                    {
                        $pull: { deleted: { id: id } as any },
                    },
                    { new: true },
                ).select('-room');
                // if (res) {
                //     const roomChat = await ConversationRooms.aggregate([
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
    delChatAll(roomId: string, filterId: string, dataId: string, userId: string): Promise<Date | null> {
        // delete both side
        return new Promise(async (resolve, reject) => {
            try {
                const date = new Date();
                const res = await Rooms.updateOne(
                    { _id: roomId },
                    {
                        $set: {
                            'filter.$[fil].data.$[da].text': { t: '' },
                            'filter.$[fil].data.$[da].imageOrVideos': [],
                            'filter.$[fil].data.$[da].delete': 'all',
                            'filter.$[fil].data.$[da].updatedAt': date,
                        },
                    },
                    {
                        new: true,
                        arrayFilters: [
                            {
                                'fil._id': filterId,
                            },
                            { 'da._id': dataId },
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
    delChatSelf(roomId: string, filterId: string, dataId: string, userIdCur: string) {
        // delete both side
        return new Promise(async (resolve, reject) => {
            try {
                const date = new Date();
                const res = await Rooms.updateOne(
                    { _id: roomId },
                    {
                        $set: {
                            'filter.$[fil].data.$[da].delete': userIdCur,
                            'filter.$[fil].data.$[da].updatedAt': date,
                        },
                    },
                    {
                        new: true,
                        arrayFilters: [
                            {
                                'fil._id': filterId,
                            },
                            { 'da._id': dataId },
                        ],
                    },
                );
                if (res.acknowledged) {
                    resolve(date);
                }
                resolve(null);
                // const res = await ConversationRooms.updateOne(
                //     { _id: conversationId },
                //     { $pull: { room: { _id: chatId, id: userId } } },
                // );
            } catch (error) {
                reject(error);
            }
        });
    }
    updateChat(
        roomId: string,
        filterId: string,
        dataId: string,
        userId: string,
        id_other: string,
        value: string | undefined,
        files: PropsInfoFile[],
    ) {
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
                const res = await Rooms.findOne(
                    { _id: roomId },
                    { count: 1, index: 1, createdAt: 1, chatId: 1, full: 1, filter: { $elemMatch: { _id: filterId } } }, // Include only the 'seenBy' field
                ).lean();
                console.log(res, 'find one seenby');
                // const rooms = await Rooms.aggregate([
                //     {
                //         $match: {
                //             _id: roomId,
                //         },
                //     },
                //     {
                //         $project: {
                //             count: 1,
                //             index: 1,
                //             indexQuery: 1,
                //             createdAt: 1,
                //             filter: {
                //                 $filter: {
                //                     input: '$filter',
                //                     as: 'item',
                //                     cond: { $eq: ['$$item._id', offset_ + 1] },
                //                 },
                //             },
                //         },
                //     },
                // ]);
                // if (res?.room.length) {
                //     if (imageOrVideos.length || value) {
                //         const seenBy: string[] = res.room[0].seenBy ?? [];
                //         let $set = {};
                //         if (value && !imageOrVideos.length) {
                //             $set = {
                //                 'room.$[roomId].text.t': value,
                //                 'room.$[roomId].update': seenBy.includes(id_other) ? userId : 'changed',
                //                 'room.$[roomId].updatedAt': new Date(),
                //             };
                //         }
                //         if (imageOrVideos.length && !value) {
                //             $set = {
                //                 'room.$[roomId].imageOrVideos': imageOrVideos,
                //                 'room.$[roomId].update': seenBy.includes(id_other) ? userId : 'changed',
                //                 'room.$[roomId].updatedAt': new Date(),
                //             };
                //         }
                //         if (value && imageOrVideos.length) {
                //             $set = {
                //                 'room.$[roomId].text.t': value,
                //                 'room.$[roomId].imageOrVideos': imageOrVideos,
                //                 'room.$[roomId].update': seenBy.includes(id_other) ? userId : 'changed',
                //                 'room.$[roomId].updatedAt': new Date(),
                //             };
                //         }
                //         const re = await ConversationRooms.findByIdAndUpdate(roomId,
                //             { $set },
                //             {
                //                 new: true,
                //                 arrayFilters: [
                //                     {
                //                         'roomId._id': chatId,
                //                         'roomId.id': userId, // Replace with the specific element ID you want to update
                //                     },
                //                 ],
                //             },
                //         );

                //         // if (re.acknowledged) {
                //         //     resolve(rec.room[0]);
                //         // } else {
                //         //     resolve(null);
                //         // }
                //     }
                // }
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
                const res = await ConversationRooms.updateOne(
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
                const res = await ConversationRooms.aggregate([
                    // Match documents with the specified conversationId
                    {
                        $match: {
                            _id: conversationId, // Convert to ObjectId if not already
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
                const res = await ConversationRooms.updateOne(
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
                const res = await ConversationRooms.updateOne(
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
                const res = await ConversationRooms.updateOne(
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
                const res = await ConversationRooms.find({
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
