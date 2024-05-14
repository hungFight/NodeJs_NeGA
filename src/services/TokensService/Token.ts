import express from 'express';
import jwt from 'jsonwebtoken';
import { redisClient } from '../..';
import { PropsRefreshToken } from '../AuthServices/AuthServices';
class Token {
    accessTokenF = (data: { id: string }, secret: string, jwtId: string) => {
        try {
            return jwt.sign(data, secret, {
                expiresIn: '10m',
                algorithm: 'HS256',
                issuer: process.env.REACT_URL,
                jwtid: jwtId,
                audience: process.env.REACT_URL,
            });
        } catch (err) {
            console.log(err, 'generate accessToken');
        }
    };
    refreshTokenF = (payload: { id: string }, secret: string, jwtId: string) => {
        try {
            return jwt.sign(payload, secret, {
                algorithm: 'HS256',
                issuer: process.env.REACT_URL,
                jwtid: jwtId,
                audience: process.env.REACT_URL,
            });
        } catch (error) {
            console.log(error, 'generate reFreshToken');
        }
    };
    deleteToken(res: express.Response, userId: string, IP_MAC: string, IP_USER: string) {
        console.log('delete coookies');
        res.clearCookie('tks');
        res.clearCookie('k_user');
        redisClient.get(userId + 'refreshToken', (err, data) => {
            console.log(data, 'IN AuthService');
            if (err) console.log(err, 'IN AuthService');
            if (data && JSON.parse(data)?.length) {
                const newDa: PropsRefreshToken[] = JSON.parse(data);
                if (newDa) {
                    newDa.map((p) => {
                        if (p.mac === IP_MAC) {
                            p.status.push({ name: 'invalid', dateTime: new Date(), ip: IP_USER });
                            p.refreshToken = '';
                        }
                        return p;
                    });
                    redisClient.set(userId + 'refreshToken', JSON.stringify(newDa));
                }
            }
        });
    }
}
export default new Token();
