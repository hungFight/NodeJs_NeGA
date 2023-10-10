import express from 'express';
import RefreshTokenCookie from '../../services/TokensService/RefreshTokenCookie';
import accountController from '../../controllers/accountController/accountController';
import authController from '../../controllers/authController/authController';
import jwtAuth from '../../middleware/jwtAuth';
import errorHandler from '../../middleware/errorHandles';
import ExcessiveRequests from '../../middleware/ExcessiveRequests';
const router = express.Router();
router.post('/register', ExcessiveRequests.ip, authController.register);
router.post('/login', ExcessiveRequests.ip, authController.login);
router.post('/subLogin', ExcessiveRequests.ip, authController.subLogin);
router.post('/logout', ExcessiveRequests.ip, jwtAuth.verifyToken, authController.logOut);
router.post('/get', ExcessiveRequests.ip, accountController.get);
router.post('/refresh', RefreshTokenCookie.refreshToken);
router.post('/changePassword', ExcessiveRequests.ip, accountController.changePassword);
// router.get('/delete', JWTVERIFY.verifyTokenDelete, accountController.delete);
// error collection
router.use(errorHandler);
export default router;
