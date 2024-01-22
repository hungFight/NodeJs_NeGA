// import { RoomChats } from '../../models/mongodb/chats';
import express from 'express';
import { Redis } from 'ioredis';

const resolvers = {
    Query: {
        chats: async (
            _: any,
            args: { id_room: any; limit: any; offset: any },
            context: { req: express.Request; res: express.Response },
        ) => {
            const { id_room, limit, offset } = args;
            const { req, res } = context;
            const id = req.cookies.k_user;
        },
        warningData: async (
            _: any,
            args: { id: string },
            context: { req: express.Request; res: express.Response | any },
        ) => {
            const { req, res } = context;
            const userId = req.cookies.k_user;
            const redisClient: Redis = res.redisClient;
            const IP_USER = req.socket.remoteAddress || req.ip;
            if (userId && IP_USER) {
                const data = await new Promise((resolve, reject) => {
                    redisClient.get(IP_USER + 'warning' + userId, (err, data) => {
                        if (err) console.log("Error in GraphQL's resolvers: ", err);
                        const dd = data ? JSON.parse(data) : {};
                        resolve(dd);
                    });
                });
                return data;
            }
        },
    },
};
export default resolvers;
