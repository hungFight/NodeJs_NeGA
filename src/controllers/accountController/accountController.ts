import AccountService from '../../services/AccountService/AccountService';
import express from 'express';
class AccountController {
    get = async (req: express.Request, res: express.Response) => {
        try {
            const phoneMail = req.body.params.phoneMail;
            const data: any = await AccountService.get(phoneMail);
            if (data) return res.status(200).json(data);
            return res.status(404).json('Not found');
        } catch (error) {
            console.log(error);
        }
    };
    delete = async (req: express.Request, res: express.Response) => {
        const message = await AccountService.delete(req.body.id);
        if (message) return res.status(200).json({ result: 'Delete Successful!' });
    };
    changePassword = async (req: express.Request, res: express.Response) => {
        try {
            const { id, password } = req.body.params;
            const data: any = await AccountService.changePassword(id, password);
            if (data === 1) return res.status(200).json({ status: data, message: 'Password changed successfully' });
            if (data === 3)
                return res.status(200).json({ status: data, message: 'those are the password you used before' });
            return res.status(500);
        } catch (error) {
            console.log(error);
        }
    };
}
export default new AccountController();
