import express from 'express';
import baseInfoRouter from './base_info';
import searchProjectInfoRouter from './search';

const router = express.Router();

router.use('/base-info', baseInfoRouter);
router.use('/search', searchProjectInfoRouter);


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
