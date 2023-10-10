import express from 'express';
import JWTVERIFY from '../../../middleware/jwtAuth';
import peopleController from '../../../controllers/websController/socialNetwork/peopleController';

const router = express.Router();
router.post('/setFriend', peopleController.setFriend);
router.get('/getFriends', peopleController.getFriends);
router.post('/deleteReq', peopleController.delete);
router.patch('/setConfirm', peopleController.setConfirm);
router.get('/getStrangers', peopleController.getStrangers);
export default router;
