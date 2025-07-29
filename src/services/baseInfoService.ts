import logger from "../extensions/ext_logger";
import { ServiceError } from "../errors/ServiceError";
import db_client from "../extensions/ext_db";

export const getBaseInfoListService = async (page: number = 1, pageSize: number = 10) => {
    try {
        const skip = (page - 1) * pageSize;
        const [list, total] = await Promise.all([
            db_client.project.findMany({
                skip,
                take: pageSize,
                orderBy: { id: "desc" },
                select: {
                    id: true,
                    name: true,
                    status: true,
                    description: true,
                    tracks: true,
                    metadata: true, // 只取 metadata 字段，后面只保留 booth
                }
            }),
            db_client.project.count(),
        ]);
        // 只保留 metadata 里的 booth 字段
        const filteredList = list.map(item => ({
            id: item.id,
            name: item.name,
            status: item.status,
            description: item.description,
            tracks: item.tracks,
            metadata: { booth: (item.metadata as any)?.booth }
        }));
        return {
            list: filteredList,
            total,
            page,
            pageSize,
        };
    } catch (err) {
        logger.error("获取项目列表失败", err);
        throw new ServiceError("获取项目列表失败");
    }
};

export const getBaseInfoByIdService = async (id: string) => {
    try {
        const project = await db_client.project.findUnique({
            where: { id },
            select: {
                name: true,
                status: true,
                description: true,
                detailedDescription: true,
                tracks: true,
                metadata: true,
            }
        });

        if (!project) {
            throw new ServiceError("项目不存在");
        }

        // 只保留 metadata 里的 booth 字段
        return {
            name: project.name,
            status: project.status,
            description: project.description,
            detailedDescription: project.detailedDescription,
            tracks: project.tracks,
            metadata: { booth: (project.metadata as any)?.booth }
        };
    } catch (err) {
        if (err instanceof ServiceError) {
            throw err;
        }
        logger.error("获取项目详情失败", err);
        throw new ServiceError("获取项目详情失败");
    }
};