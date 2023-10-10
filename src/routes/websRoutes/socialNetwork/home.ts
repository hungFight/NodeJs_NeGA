import express from 'express';
import JWTVERIFY from '../../../middleware/jwtAuth';
import homeController from '../../../controllers/websController/socialNetwork/homeController';
import { upload } from '../../../middleware/uploadGridFS';

const router = express.Router();
router.get('/getPosts', homeController.getPosts);
router.post('/setPost', upload.array('files'), homeController.setPost);
export default router;
