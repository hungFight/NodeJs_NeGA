import express from 'express';
import connectDatabase from './connectDatabase/connectDatabase';
import { PrismaClient } from '@prisma/client';
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
const connection = new Set();

export const prisma = new PrismaClient();

const app = express();
const port = 3001;
const httpServer = require('http').createServer(app);
const io = require('socket.io')(httpServer);
const server = new ApolloServer({
    typeDefs,
    resolvers,
    csrfPrevention: true,
    plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
});
export const redisClient = new Redis({
    host: process.env.REDIS_HOST,
    port: Number(process.env.REDIS_PORT),
    password: process.env.REDIS_PASSWORD,
});
io.on('connection', (client: any) => {
    console.log('conn');
    client.on('sendId', (res: string) => {
        connection.add(res);
        client.userId = res;
        console.log('user connected', res);
        client.emit('user connectedd', JSON.stringify(Array.from(connection)));
        client.broadcast.emit('user connectedd', JSON.stringify(Array.from(connection)));
    });
    client.on('disconnect', () => {
        // calculator users online
        connection.delete(client.userId);
        console.log('clien disconnect', client.userId);
        const key_Reload = client.userId + 'Reload';
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
app.use(
    compression({
        //compression response is returned
        level: 6,
        threshold: bytes('10MB'), // The byte threshold for the response body size before compression is considered
    }),
);
app.use((req: any, res: any, next) => {
    res.io = io;
    next();
});
app.use(cookieParser(process.env.SECRET));
app.use(
    cors({
        credentials: true,
        origin: ['http://192.168.99.102:3000', `${process.env.REACT_URL}`],
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
