import moment from 'moment';
import { io } from '..';
import { getRedis } from '../connectDatabase/connect.Redis';
const connection = new Set();
const subConnection = new Set();

const connectSocket = () => {
    io.on('connection', (client: any) => {
        console.log('conn');

        client.on('sendId', (res: { userId?: string; any: string }) => {
            // sent to client
            if (res?.userId) connection.add(res.userId);
            subConnection.add(res.any);
            client.userId = res;
            if (client.userId) getRedis().del(`online_duration: ${client.userId}`); // when user not active but still send chat, it will be deleted
            client.emit('user connectedd', JSON.stringify(Array.from(connection)));
            client.broadcast.emit('user connectedd', JSON.stringify(Array.from(connection)));
        });
        Array.from(subConnection).map((id) => {
            client.on(`user_${id}_in_roomChat_personal_writing`, (res: { roomId: string; id_other: string; value: number }) => {
                client.broadcast.emit(`user_${res.id_other}_in_roomChat_${res.roomId}_personal_receive`, {
                    length: res.value,
                    id: res.id_other,
                });
            });
            client.on(`user_${id}_in_roomChat_personal_receive_and_saw`, async (data: { userIdReceived: string; conversationId: string; idChat: string }) => {
                client.broadcast.emit(`user_${data.conversationId}_in_roomChat_personal_receive_and_saw_other`, data);
            });
        });
        client.on('disconnect', () => {
            const currentDate = moment(new Date()).format('YYYY-MM-DD HH:mm:ss');
            // calculator users online
            connection.delete(client.userId);
            const key_Reload = client.userId + 'Reload';
            if (client.userId)
                getRedis().set(`online_duration: ${client.userId}`, currentDate, () => {
                    getRedis().expire(`online_duration: ${client.userId}`, 24 * 60 * 60);
                });
            getRedis().lrange(key_Reload, 0, -1, (err, items) => {
                // used to when you out of this web it's deleted what unnecessary in redis
                if (err) console.log(err);
                items?.forEach((item) => {
                    getRedis().del(item, (err, count) => {
                        if (err) console.log(err);
                        console.log(`Deleted ${count} key(s)`);
                    });
                });
            });
            getRedis().del(key_Reload, (err, count) => {
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
};
export default connectSocket;
