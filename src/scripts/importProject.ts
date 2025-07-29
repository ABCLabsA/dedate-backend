import fs from 'fs';
import db_client from '../extensions/ext_db';
import path from 'path';


async function read_folder_data(folder_path: string) {
  const files = fs.readdirSync(folder_path)
    .filter(file => file.endsWith('.json'))
    .sort();
  
  console.log(`JSON 文件列表 (共 ${files.length} 个文件):`);
  
  let totalMembers = 0;
  let processedFiles = 0;
  
  for (const file of files) {
    const fullPath = path.join(folder_path, file);
    const stat = fs.statSync(fullPath);
    if (stat.isFile()) {
      const match = file.match(/(\d+)/);
      const boothName = match ? `展位${match[1]}` : '展位未知';
      const content = fs.readFileSync(fullPath, 'utf-8');
      console.log(`读取文件: ${file}, 文件名称：${boothName}`);
      const data = JSON.parse(content);
      
      const projetName = data["project"]['name'];
      const projectStatus = 'submiited';
      const projectDescription = data["project"]['description'];
      const projectDetailedDescription = data["project"]['detailedDescription'];
      const projectTracks = data['tracks']
      const projectTechnology = data['technology']
      const projectLinks = data['links']

      const metadata = data['metadata'] || {};
      metadata['booth'] = `AdventureX-2025 ${boothName}`;

      let qa = data['qa'];
      if (!Array.isArray(qa)) {
        // 如果不是数组，包裹成数组
        qa = [qa];
      }

      const project = await db_client.project.create({
        data: {
          name: projetName,
          status: projectStatus,
          description: projectDescription,
          detailedDescription: projectDetailedDescription,
          tracks: projectTracks,
          qa: qa, // 这里直接传 Json[]
          technology: projectTechnology,
          links: projectLinks,
          metadata: metadata,
        }
      });

      const teamMemberList = data['team']
      console.log(`项目 ${projetName} 有 ${teamMemberList.length} 个成员`);
      totalMembers += teamMemberList.length;
      
      for (const member of teamMemberList) {
        await db_client.teamMember.create({
          data: {
            projectId: project.id,
            email: member.email,
            role: member.role
          }
        })
      }

      console.log(`导入项目: ${projetName} 完成`);
      processedFiles++;
    }
  }
  
  // 返回统计信息
  return {
    totalFiles: files.length,
    processedFiles: processedFiles,
    totalMembers: totalMembers
  };
}

read_folder_data("/Users/chensiyu/Downloads/advx-meta-info/advx-info-json")
  .then((stats) => {
    console.log('\n=== 导入统计信息 ===');
    console.log(`总文件数: ${stats.totalFiles}`);
    console.log(`成功处理文件数: ${stats.processedFiles}`);
    console.log(`总成员数: ${stats.totalMembers}`);
    console.log('全部导入完成');
    // 如果需要断开数据库连接，可以在这里加 await db_client.$disconnect();
  })
  .catch(e => {
    console.error(e);
    process.exit(1);
  });