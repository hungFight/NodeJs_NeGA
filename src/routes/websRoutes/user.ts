import express from 'express';
import userController from '../../controllers/websController/userController';
import checkRequest from '../../middleware/ExcessiveRequests';
import errorHandler from '../../middleware/errorHandles';
const router = express.Router();
router.post('/getById', userController.getById);
router.post('/getByName', userController.getByName);
router.post('/setLg', userController.setLg);
router.patch('/setActive', userController.setActive);
router.get('/getNewMes', userController.getNewMes);
router.get('/delMessage', userController.delMessage);
router.post('/delSubAccount', userController.delSubAccount);
router.patch('/changesOne', checkRequest.changeText, userController.changesOne);
router.patch('/changesMany', userController.changesMany);
router.patch('/follow', userController.follow);
router.patch('/Unfollow', userController.Unfollow);
router.get('/getMore', userController.getMore);
router.post('/setHistory', userController.setHistory);
router.get('/getHistory', userController.getHistorySearch);
router.get('/getActiveStatus', userController.getActiveStatus);
// error collection
router.use(errorHandler);

export default router;
