import express from 'express';
import jwt from 'jsonwebtoken';
import UserIT from '../interface/inTerFaceUser';
class Token {
    accessTokenF = (id: string, secret: string) => {
        try {
            return jwt.sign({ id }, secret, {
                expiresIn: '3m',
                algorithm: 'HS256',
                issuer: process.env.REACT_URL,
                audience: process.env.REACT_URL,
            });
        } catch (err) {
            console.log(err, 'generate accessToken');
        }
    };
    refreshTokenF = (payload: { id: string; IP_USER: string }, secret: string) => {
        try {
            return jwt.sign(payload, secret, {
                algorithm: 'HS256',
                issuer: process.env.REACT_URL,
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
