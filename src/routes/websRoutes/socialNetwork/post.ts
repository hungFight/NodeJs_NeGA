import express from 'express';
import JWTVERIFY from '../../../middleware/jwtAuth';
import postController from '../../../controllers/websController/socialNetwork/postController';

const router = express.Router();
router.get('/getPosts', postController.getPosts);
router.post('/setPost', postController.setPost);
router.post('/sendComment', postController.sendComment);
router.post('/setEmotion', postController.setEmotion);
router.post('/getComments', postController.getComments);
export default router;
