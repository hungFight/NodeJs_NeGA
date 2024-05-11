import express from 'express';
import OTP from '../../../services/VerifyService/OTP/OTPService';
class OTPController {
    sendOTP = async (req: express.Request, res: express.Response) => {
        try {
            const phoneMail = req.body.params.phoneMail;
            if (phoneMail) {
                const data: any = await OTP.sendOTP(phoneMail);
                if (data) {
                    return res.status(200).json(data);
                }
            }
        } catch (error) {
            console.log(error);
        }
    };
}
export default new OTPController();
