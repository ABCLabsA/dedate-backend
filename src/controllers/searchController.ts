import { Request, Response } from 'express';
import { searchProjectInfoService } from '../services/searchService';

// ======================= 搜索项目信息 =========================
export const searchProjectInfo = async (req: Request, res: Response) => {
    const { keyword, page = 1, limit = 10 } = req.body;
        
    // 验证关键词是否存在
    if (!keyword || keyword.trim() === '') {
        return res.status(400).json({
            code: 400,
            message: '搜索关键词不能为空',
            data: null
        });
    }

    // 调用搜索服务
    const searchResults = await searchProjectInfoService(
        keyword.trim(), 
        parseInt(page), 
        parseInt(limit)
    );
    
    res.status(200).json({
        code: 200,
        message: '搜索成功',
        data: searchResults
    });
};