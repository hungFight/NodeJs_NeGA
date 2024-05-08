import express from 'express';
import connectDatabase from './connectDatabase/connectDatabase';
import { Client } from '@elastic/elasticsearch';
import { Prisma, PrismaClient } from '@prisma/client';
import Redis from 'ioredis';
import compression from 'compression';
import bytes from 'bytes';
import morgan from 'morgan';
import cors from 'cors';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import { ApolloServer } from '@apollo/server';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import { expressMiddleware } from '@apollo/server/express4';
import typeDefs from './models/GraphQL/schemas/schemaGraphQL';
import resolvers from './models/GraphQL/resolvers/resolvers';
import route from './routes';
import ExcessiveRequests from './middleware/ExcessiveRequests';
import jwtAuth from './middleware/jwtAuth';
import errorHandler from './middleware/errorHandles';
import routeSN from './routes/websRoutes';
import moment from 'moment';

import { Server } from 'socket.io';
import { ConversationRooms } from './models/mongodb/chats';
const connection = new Set();
export const prisma = new PrismaClient();
// Listen to Prisma 'user' post event and index user in Elasticsearch

// if (cluster.isPrimary) { create child process
//     for (let i = 0; i < os.cpus().length - 1; i++) {
//         cluster.fork();
//     }

//     // Listen for dying workers and fork a new one
//     cluster.on('exit', (worker, code, signal) => {
//         console.log(`Worker ${worker.process.pid} died`);
//         cluster.fork();
//     });

// } else {
//     console.log(`Worker ${process.pid} started`);
// }
const app = express();
const port = 3001;
const httpServer = require('http').createServer(app);
export const io = new Server(httpServer, {
    path: '/socket.io',
    pingTimeout: 60000, // Set a longer ping timeout in milliseconds
    pingInterval: 25000, // Adjust the ping interval if needed
});
const server = new ApolloServer({
    typeDefs,
    resolvers,
    csrfPrevention: true,
    plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
});
const redisClient = new Redis({
    host: process.env.REDIS_HOST,
    port: Number(process.env.REDIS_PORT),
    password: process.env.REDIS_PASSWORD,
});
export const esClient = new Client({
    node: 'http://localhost:9200', // Elasticsearch server URL,
});

io.on('connection', (client: any) => {
    console.log('conn');

    client.on('sendId', (res: string) => {
        // sent to client
        connection.add(res);
        client.userId = res;
        if (client.userId) redisClient.del(`online_duration: ${client.userId}`); // when user not active but still send chat, it will be deleted
        console.log('user connected', res, Array.from(connection));
        client.emit('user connectedd', JSON.stringify(Array.from(connection)));
        client.broadcast.emit('user connectedd', JSON.stringify(Array.from(connection)));
        Array.from(connection).map((id) => {
            client.on(`user_${id}_in_roomChat_personal_writing`, (res: { roomId: string; id_other: string; value: number }) => {
                client.broadcast.emit(`user_${res.id_other}_in_roomChat_${res.roomId}_personal_receive`, {
                    length: res.value,
                    id: res.id_other,
                });
            });
            client.on(
                `user_${id}_in_roomChat_personal_receive_and_saw`,
                async (data: { userIdReceived: string; conversationId: string; idChat: string }) => {
                    client.broadcast.emit(`user_${data.conversationId}_in_roomChat_personal_receive_and_saw_other`, data);
                },
            );
        });
    });
    client.on('disconnect', () => {
        const currentDate = moment(new Date()).format('YYYY-MM-DD HH:mm:ss');
        // calculator users online
        connection.delete(client.userId);
        console.log('client disconnect', client.userId);
        const key_Reload = client.userId + 'Reload';
        if (client.userId)
            redisClient.set(`online_duration: ${client.userId}`, currentDate, () => {
                redisClient.expire(`online_duration: ${client.userId}`, 24 * 60 * 60);
            });
        redisClient.lrange(key_Reload, 0, -1, (err, items) => {
            // used to when you out of this web it's deleted what unnecessary in redis
            if (err) console.log(err);
            items?.forEach((item) => {
                redisClient.del(item, (err, count) => {
                    if (err) console.log(err);
                    console.log(`Deleted ${count} key(s)`);
                });
            });
        });
        redisClient.del(key_Reload, (err, count) => {
            if (err) console.log(err);
            console.log(`Deleted ${count} key(s) in Redis`);
        });
        client.broadcast.emit('user disconnected', JSON.stringify(Array.from(connection)));
    });
    client.on('offline', (res: string) => {
        connection.delete(res);
        client.emit('user connectedd', JSON.stringify(Array.from(connection)));
        client.broadcast.emit('user connectedd', JSON.stringify(Array.from(connection)));
    });
    client.on('online', (res: string) => {
        connection.add(res);
        client.emit('user connectedd', JSON.stringify(Array.from(connection)));
        client.broadcast.emit('user connectedd', JSON.stringify(Array.from(connection)));
    });

    // user connected
});
io.of('/online').on;
app.use(
    compression({
        //compression response is returned
        level: 6,
        threshold: bytes('10MB'), // The byte threshold for the response body size before compression is considered
    }),
);
app.use((req: any, res: any, next) => {
    res.io = io;
    res.redisClient = redisClient;
    next();
});
app.get('/', (req, res) => {
    return res.json('Hello');
});
app.use(cookieParser(process.env.SECRET));
app.use(
    cors({
        credentials: true,
        origin: ['http://localhost:3000', `${process.env.REACT_URL}`],
    }),
);
app.use(morgan('combined'));
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
connectDatabase.connect();
route(app);
app.use(ExcessiveRequests.ip);
app.use(jwtAuth.verifyToken);
app.use(errorHandler);
routeSN(app);
async function listen() {
    await server.start();
    app.use(
        expressMiddleware(server, {
            context: async ({ req, res }) => ({ req, res }),
        }),
    );
    await new Promise((resolve, reject) => httpServer.listen({ port }, resolve));
    console.log(`🚀 Server ready at http://localhost:${port}`);
}
listen();
