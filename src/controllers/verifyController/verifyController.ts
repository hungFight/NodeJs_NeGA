import express from 'express';
import VerifyService from '../../services/VerifyService/VerifyService';

class VerifyController {
    verifyOTP = async (req: express.Request, res: express.Response) => {
        try {
            const phoneMail = req.body.params.phoneMail;
            const otp = req.body.params.otp;
            const whatKind = req.body.params.whatKind;
            const data: any = await VerifyService.verifyOTP(phoneMail, otp, whatKind);
            if (data) {
                return res.status(200).json(data);
            }
        } catch (error) {
            console.log(error);
        }
    };
}
export default new VerifyController();
