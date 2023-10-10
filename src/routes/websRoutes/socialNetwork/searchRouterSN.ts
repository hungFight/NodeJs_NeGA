import express from 'express';
import searchControllerSN from '../../../controllers/websController/socialNetwork/searchControllerSN';

const router = express.Router();
router.post('/', searchControllerSN.getUser);

export default router;
