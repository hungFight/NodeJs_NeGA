import express from 'express';
import jwtAuth from '../../middleware/jwtAuth';
import verifyController from '../../controllers/verifyController/verifyController';

const Router = express.Router();
Router.post('/login', jwtAuth.verifyToken, (req: express.Request, res: express.Response) => {
    return res.status(200).json(true);
});
Router.post('/opt', verifyController.verifyOTP);

export default Router;
