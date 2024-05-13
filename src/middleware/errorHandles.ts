import express from 'express';
import Token from '../services/TokensService/Token';
const errorHandler = (err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.log('ERROR LOG ', new Date().toLocaleString());
    console.log('Request:', req.method, req.originalUrl);
    console.log('Params:', req.params);
    console.log('Body:', req.body);
    console.log('Query:', req.query);
    console.log('Cookies:', req.cookies);
    console.log('Error: ', err);
    console.log('Error stack: ', err.stack);
    console.log('--------------------------------------------------------------------------------------');

    const errorMessage = err.message;
    const messageObject = err.messageObject;
    const errorAny = err.errorAny;
    // create format error response
    const error = {
        status: err.status,
        name: err.name,
        errorMessage,
        messageObject,
        errorAny,
    };
    const status = err.status || 400;
    return res.status(status).json(error);
};

export default errorHandler;
