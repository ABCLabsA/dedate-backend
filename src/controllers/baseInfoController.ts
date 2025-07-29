import { Request, Response } from 'express';
import { getBaseInfoListService, getBaseInfoByIdService } from '../services/baseInfoService';


// ======================= 获取基本信息列表 =========================
export const getBaseInfoList = async (req: Request, res: Response) => {
    const { page = 1, pageSize = 10 } = req.query;
    const result = await getBaseInfoListService(Number(page), Number(pageSize));
    res.status(200).json({
      code: 200,
      message: 'info list fetched sucessful',
      data: result
    })
};

// ======================= 根据ID获取基本信息 =========================
export const getBaseInfoById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const result = await getBaseInfoByIdService(id);
        res.status(200).json({
            code: 200,
            message: 'info fetched successfully',
            data: result
        });
    } catch (error: any) {
        res.status(404).json({
            code: 404,
            message: error.message || '项目不存在',
            data: null
        });
    }
};

