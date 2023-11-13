import express from 'express';
import JWTVERIFY from '../../middleware/jwtAuth';
import sendChatController from '../../controllers/websController/sendChatController';
import uploadGridFS, { upload } from '../../middleware/uploadGridFS';
import errorHandler from '../../middleware/errorHandles';

const router = express.Router();

router.post('/sendChat', upload.array('files'), sendChatController.sendChat);
router.get('/getRoom', sendChatController.getRoom);
router.get('/getChat', sendChatController.getChat);
router.delete('/delete', sendChatController.delete);
router.post('/delChatAll', uploadGridFS.delete, sendChatController.delChatAll);
router.post('/updateChat', upload.array('files'), sendChatController.updateChat);
router.post('/delChatSelf', sendChatController.delChatSelf);
router.post('/undo', sendChatController.undo);
router.post('/pin', sendChatController.pin);
router.get('/getPins', sendChatController.getPins);
router.delete('/deletePin', sendChatController.deletePin);
router.post('/setBackground', upload.array('files'), sendChatController.setBackground);
router.post('/delBackground', uploadGridFS.delete, sendChatController.delBackground);
router.use(errorHandler);
export default router;
