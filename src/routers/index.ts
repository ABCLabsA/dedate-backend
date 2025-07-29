import express from 'express';
import baseInfoRouter from './base_info';

const router = express.Router();

router.use('/base-info', baseInfoRouter);

router.get('/', (req, res) => {
  const info = {
    "code": 200,
    "status": "success",
    "data": {
      "author": "csy100",
      "version": "1.0.0",
      "description": "Shareweb3 Backend Service"
    }
  }
  res.send(info);
});

export default router;
