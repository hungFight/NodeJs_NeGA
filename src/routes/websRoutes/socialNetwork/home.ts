import express from 'express';
import JWTVERIFY from '../../../middleware/jwtAuth';
import homeController from '../../../controllers/websController/socialNetwork/homeController';

const router = express.Router();
router.get('/getPosts', homeController.getPosts);
router.post('/setPost', homeController.setPost);
export default router;
