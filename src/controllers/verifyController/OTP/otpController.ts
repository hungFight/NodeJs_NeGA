import express from 'express';
import { v4 as keyV4 } from 'uuid';
import OTP from '../../../services/VerifyService/OTP/OTPService';
import NotFound from '../../../utils/errors/NotFound';
import getMAC, { isMAC } from 'getmac';
import Validation from '../../../utils/errors/Validation';
import { getRedis } from '../../../connectDatabase/connect.Redis';
import ServerError from '../../../utils/errors/ServerError';
class OTPController {
    sendOTP = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
        try {
            const phoneMail = req.body.params.phoneMail;
            const whatKind = req.body.params.whatKind;
            const codeId = keyV4();
            const macIP = getMAC();
            const controller = await getRedis().get(`control_sendOTP_${phoneMail}`);
            if (Number(controller) <= 5 || !controller) {
                if (!(Validation.validPhoneNumber(phoneMail) || Validation.validEmail(phoneMail)) || !Validation.validUUID(codeId) || !isMAC(macIP)) throw new NotFound('sendOTP', 'Empty or Invalid!');
                if (codeId && macIP) {
                    const data: any = await OTP.sendOTP(phoneMail, codeId, macIP, res, whatKind);
                    if (data) return res.status(200).json(data);
                }
            } else throw new ServerError('sendOTP', 'Please try again later!');
            throw new NotFound('sendOTP', 'Account is empty');
        } catch (error) {
            next(error);
        }
    };
}
export default new OTPController();
