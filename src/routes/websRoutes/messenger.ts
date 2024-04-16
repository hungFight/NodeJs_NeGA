import express from 'express';
import sendChatController from '../../controllers/websController/sendChatController';
// import uploadGridFS, { upload } from '../../middleware/uploadGridFS';
import errorHandler from '../../middleware/errorHandles';

const router = express.Router();

router.post('/sendChat', sendChatController.sendChat);
router.get('/getRoom', sendChatController.getRoom);
router.get('/getChat', sendChatController.getChat);
router.delete('/delete', sendChatController.delete);
router.post('/delChatAll', sendChatController.delChatAll);
router.post('/updateChat', sendChatController.updateChat);
router.post('/delChatSelf', sendChatController.delChatSelf);
router.post('/undo', sendChatController.undo);
router.post('/pin', sendChatController.pin);
router.get('/getPins', sendChatController.getPins);
router.delete('/deletePin', sendChatController.deletePin);
router.post('/setBackground', sendChatController.setBackground);
router.post('/delBackground', sendChatController.delBackground);
router.post('/getConversationBalloon', sendChatController.getConversationBalloon);
router.use(errorHandler);
export default router;
