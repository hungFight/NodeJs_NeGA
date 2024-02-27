import otpRouter from './accountRouter/otpRouter';
import accountRouter from './accountRouter/account';
import verifyRouter from './verifyRouter/verifyRouter';
import ExcessiveRequests from '../middleware/ExcessiveRequests';
function route(app: any) {
    app.use('/api/v1/otp', ExcessiveRequests.ip, otpRouter);
    app.use('/api/v1/verify', ExcessiveRequests.ip, verifyRouter);
    app.use('/api/v1/account', accountRouter);
}
export default route;
