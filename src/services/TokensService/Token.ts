import express from 'express';
import jwt from 'jsonwebtoken';
import UserIT from '../interface/inTerFaceUser';
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
    deleteToken(res: express.Response) {
        console.log('delete coookies');
        res.clearCookie('tks');
        res.clearCookie('k_user');
    }
}
export default new Token();
