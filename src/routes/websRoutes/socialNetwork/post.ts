import express from 'express';
import JWTVERIFY from '../../../middleware/jwtAuth';
import postController from '../../../controllers/websController/socialNetwork/postController';

const router = express.Router();
router.get('/getPosts', postController.getPosts);
router.post('/setPost', postController.setPost);
router.post('/setEmotion', postController.setEmotion);
export default router;
