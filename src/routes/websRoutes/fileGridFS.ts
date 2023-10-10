import express from 'express';
import fileGridFS from '../../middleware/uploadGridFS';
const router = express.Router();

router.get('/getFile', fileGridFS.getFile);
export default router;
