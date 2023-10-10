import express from 'express';
import otpRouter from './accountRouter/otpRouter';
import accountRouter from './accountRouter/account';
import jwtAuth from '../middleware/jwtAuth';
import verifyRouter from './verifyRouter/verifyRouter';
import errorHandler from '../middleware/errorHandles';
import ExcessiveRequests from '../middleware/ExcessiveRequests';
function route(app: any) {
    app.use('/api/otp', ExcessiveRequests.ip, otpRouter);
    app.use('/api/verify', ExcessiveRequests.ip, verifyRouter);
    app.use('/api/account', accountRouter);
}
export default route;
