import { Redis } from 'ioredis';
import ServerError from '../utils/errors/ServerError';

let client: Redis,
    statusConnectRedis = {
        CONNECT: 'connect',
        END: 'end',
        RECONNECT: 'reconnecting',
        ERROR: 'error',
    },
    connectionTimeout: NodeJS.Timeout;

const handleConnectTimeoutError = () => {
    connectionTimeout = setTimeout(() => {
        throw new ServerError('Connect to redis', { code: -100, message: 'Connect to redis failed' });
    }, Number(process.env.REDIS_CONNECT_TIMEOUT));
};
const handleEventConnection = (connectionRedis: Redis) => {
    connectionRedis.on(statusConnectRedis.CONNECT, () => {
        console.log('ConnectionRedis - status: successful ');
        clearTimeout(connectionTimeout);
    });
    connectionRedis.on(statusConnectRedis.END, () => {
        console.log('ConnectionRedis - status: disconnecting ');
        handleConnectTimeoutError();
    });
    connectionRedis.on(statusConnectRedis.RECONNECT, () => {
        console.log('ConnectionRedis - status: reconnecting ');
        clearTimeout(connectionTimeout);
    });
    connectionRedis.on(statusConnectRedis.ERROR, (error) => {
        console.log('ConnectionRedis - status: error ', error);
        handleConnectTimeoutError();
    });
};
const initRedis = () => {
    const instanceRedis = new Redis({
        host: process.env.REDIS_HOST,
        port: Number(process.env.REDIS_PORT),
        password: process.env.REDIS_PASSWORD,
    });
    client = instanceRedis;
    handleEventConnection(instanceRedis);
};
const getRedis = () => client;
const closeRedis = () => client;
export { initRedis, getRedis, closeRedis };
