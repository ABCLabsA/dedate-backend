import { ServiceError } from "../errors/ServiceError";
import db_client from "../extensions/ext_db";
import { Prisma } from '@prisma/client';

// 搜索项目信息的接口类型
interface SearchResult {
    list: any[];
    total: number;
    page: number;
    pageSize: number;
}

export const searchProjectInfoService = async (
    keyword: string, 
    page: number = 1, 
    limit: number = 10
): Promise<SearchResult> => {
    try {
        // 计算偏移量
        const offset = (page - 1) * limit;
        
        // 预处理关键词，生成多种匹配模式
        const keywordVariations = generateKeywordVariations(keyword);
        
        // 构建搜索条件 - 支持多字段搜索和语义匹配
        const searchConditions: Prisma.ProjectWhereInput = {
            OR: [
                // 1. 项目名称搜索（支持模糊匹配）
                {
                    name: {
                        contains: keyword,
                        mode: 'insensitive' as Prisma.QueryMode
                    }
                },
                // 2. 项目描述搜索（支持模糊匹配）
                {
                    description: {
                        contains: keyword,
                        mode: 'insensitive' as Prisma.QueryMode
                    }
                },
                // 3. 详细描述搜索（支持模糊匹配）
                {
                    detailedDescription: {
                        contains: keyword,
                        mode: 'insensitive' as Prisma.QueryMode
                    }
                },
                // 4. metadata.booth字段搜索（JSON对象中的booth字段）
                {
                    metadata: {
                        path: ['booth'],
                        string_contains: keyword
                    }
                },
                // 5. 赛道数组智能搜索 - 支持多种格式匹配
                ...generateTrackSearchConditions(keywordVariations)
            ]
        };

        // 并行执行查询和计数
        const [projects, total] = await Promise.all([
            // 查询项目列表
            db_client.project.findMany({
                where: searchConditions,
                skip: offset,
                take: limit,
                orderBy: {
                    updatedAt: 'desc'
                },
                // 只返回必要字段
                select: {
                    id: true,
                    name: true,
                    description: true,
                    tracks: true,
                    metadata: true
                }
            }),
            // 查询总数
            db_client.project.count({
                where: searchConditions
            })
        ]);

        // 处理返回数据，只保留必要字段
        const filteredProjects = projects.map(project => ({
            id: project.id,
            name: project.name,
            description: project.description,
            tracks: project.tracks,
            metadata: {
                booth: (project.metadata as any)?.booth
            }
        }));

        return {
            list: filteredProjects,
            total,
            page,
            pageSize: limit
        };
    } catch (error) {
        console.error('搜索服务错误:', error);
        throw new ServiceError('搜索项目信息失败', 500);
    }
};

// 生成关键词变体，用于智能匹配
function generateKeywordVariations(keyword: string): string[] {
    const variations: string[] = [keyword];
    
    // 如果是赛道相关的搜索
    if (keyword.includes('赛道')) {
        // 提取数字部分
        const trackMatch = keyword.match(/赛道\s*(\d+)/);
        if (trackMatch) {
            const trackNumber = trackMatch[1];
            // 生成不同的格式变体
            variations.push(`赛道 ${trackNumber}`); // 带空格
            variations.push(`赛道${trackNumber}`);  // 不带空格
            variations.push(`赛道 ${trackNumber.padStart(2, '0')}`); // 补零格式
            variations.push(`赛道${trackNumber.padStart(2, '0')}`);  // 补零不带空格
        }
    }
    
    // 如果是展位相关的搜索
    if (keyword.includes('展位')) {
        const boothMatch = keyword.match(/展位\s*(\d+)/);
        if (boothMatch) {
            const boothNumber = boothMatch[1];
            variations.push(`展位 ${boothNumber}`);
            variations.push(`展位${boothNumber}`);
            variations.push(`AdventureX-2025 展位 ${boothNumber}`);
            variations.push(`AdventureX-2025 展位${boothNumber}`);
        }
    }
    
    return [...new Set(variations)]; // 去重
}

// 生成赛道搜索条件
function generateTrackSearchConditions(keywordVariations: string[]): Prisma.ProjectWhereInput[] {
    const conditions: Prisma.ProjectWhereInput[] = [];
    
    for (const variation of keywordVariations) {
        // 精确匹配
        conditions.push({
            tracks: {
                has: variation
            }
        });
        
        // 模糊匹配（如果包含空格）
        if (variation.includes(' ')) {
            conditions.push({
                tracks: {
                    has: variation.replace(/\s+/g, '') // 移除空格
                }
            });
        } else {
            // 如果不包含空格，尝试添加空格匹配
            const withSpace = variation.replace(/(赛道|展位)(\d+)/, '$1 $2');
            conditions.push({
                tracks: {
                    has: withSpace
                }
            });
        }
    }
    
    return conditions;
}

// 高级搜索服务 - 支持更复杂的搜索条件
export const advancedSearchProjectService = async (
    params: {
        keyword?: string;
        tracks?: string[];
        booth?: string;
        page?: number;
        limit?: number;
    }
): Promise<SearchResult> => {
    try {
        const { keyword, tracks, booth, page = 1, limit = 10 } = params;
        const offset = (page - 1) * limit;

        // 构建高级搜索条件
        const whereConditions: Prisma.ProjectWhereInput = {};
        const conditions: Prisma.ProjectWhereInput[] = [];

        // 关键词搜索
        if (keyword) {
            // 预处理关键词，生成多种匹配模式
            const keywordVariations = generateKeywordVariations(keyword);
            
            const keywordConditions: Prisma.ProjectWhereInput[] = [
                {
                    name: {
                        contains: keyword,
                        mode: 'insensitive' as Prisma.QueryMode
                    }
                },
                {
                    description: {
                        contains: keyword,
                        mode: 'insensitive' as Prisma.QueryMode
                    }
                },
                {
                    detailedDescription: {
                        contains: keyword,
                        mode: 'insensitive' as Prisma.QueryMode
                    }
                },
                {
                    metadata: {
                        path: ['booth'],
                        string_contains: keyword
                    }
                },
                // 添加智能赛道搜索
                ...generateTrackSearchConditions(keywordVariations)
            ];
            
            conditions.push({
                OR: keywordConditions
            });
        }

        // 赛道筛选
        if (tracks && tracks.length > 0) {
            const trackConditions: Prisma.ProjectWhereInput[] = [];
            
            for (const track of tracks) {
                const trackVariations = generateKeywordVariations(track);
                trackConditions.push(...generateTrackSearchConditions(trackVariations));
            }
            
            conditions.push({
                OR: trackConditions
            });
        }

        // 展位筛选
        if (booth) {
            conditions.push({
                metadata: {
                    path: ['booth'],
                    string_contains: booth
                }
            });
        }

        // 组合所有条件
        if (conditions.length > 0) {
            whereConditions.AND = conditions;
        }

        // 并行执行查询和计数
        const [projects, total] = await Promise.all([
            db_client.project.findMany({
                where: whereConditions,
                skip: offset,
                take: limit,
                orderBy: {
                    updatedAt: 'desc'
                },
                select: {
                    id: true,
                    name: true,
                    description: true,
                    tracks: true,
                    metadata: true
                }
            }),
            db_client.project.count({
                where: whereConditions
            })
        ]);

        const totalPages = Math.ceil(total / limit);

        // 处理返回数据，只保留必要字段
        const filteredProjects = projects.map(project => ({
            id: project.id,
            name: project.name,
            description: project.description,
            tracks: project.tracks,
            metadata: {
                booth: (project.metadata as any)?.booth
            }
        }));

        return {
            list: filteredProjects,
            total,
            page,
            pageSize: limit
        };
    } catch (error) {
        console.error('高级搜索服务错误:', error);
        throw new ServiceError('高级搜索项目信息失败', 500);
    }
};