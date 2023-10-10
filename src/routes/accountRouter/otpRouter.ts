import express from 'express';
import otpController from '../../controllers/verifyController/OTP/otpController';
const router = express.Router();
router.post('/send', otpController.sendOTP);

export default router;
