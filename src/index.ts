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
import { getRedis, initRedis } from './connectDatabase/connect.Redis';
import connectSocket from './actions/socket.io';

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
const port = process.env.PORT ?? 3001;
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
initRedis();
export const esClient = new Client({
    node: 'http://localhost:9200', // Elasticsearch server URL,
});
connectSocket();
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
        origin: [`${process.env.REACT_URL}`],
    }),
);
app.use(morgan('combined'));
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
connectDatabase.connect();
route(app);
app.use(ExcessiveRequests.ip);
app.use(jwtAuth.verifyToken);
routeSN(app);
app.use(errorHandler);
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
