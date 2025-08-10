import express from 'express';
import baseInfoRouter from './base-info';
import searchProjectInfoRouter from './search';
import authRouter from './auth';
import commentRouter from './comment';

const router = express.Router();

router.use('/base-info', baseInfoRouter);
router.use('/search', searchProjectInfoRouter);
router.use('/auth', authRouter)
router.use('/comment', commentRouter)


router.get('/', (req, res) => {
  const info = {
    "code": 200,
    "status": "success",
    "data": {
      "author": "csy100",
      "version": "1.0.0",
      "description": "Touch Backend Service"
    }
  }
  res.send(info);
});

export default router;
