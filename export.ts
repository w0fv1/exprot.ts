// @ts-nocheck

// 导入必要的模块
import { join } from "jsr:@std/path";

// 定义要处理的文本文件扩展名
const TEXT_FILE_EXTENSIONS = [".ts", ".js", ".html", ".json", ".vue"];

// 定义要排除的文件夹和文件
const EXCLUDE_PATHS = [
  "example",
  "node_modules",
  "out",
  "dist",
  "deno.lock",
  "package-lock.json",
  "export.ts",
];
const languageMapping: { [ext: string]: string } = {
  ".ts": "typescript",
  ".js": "javascript",
  ".html": "html",
  ".json": "json",
  ".vue": "vue",
};
// 获取当前工作目录
const currentDir = Deno.cwd();

// 定义输出文件路径
const outputFilePath = join(currentDir, "export.md");

// 初始化输出内容
let outputContent = "";

/**
 * 判断文件是否为文本文件
 * @param filename 文件名
 * @returns 布尔值
 */
function isTextFile(filename: string): boolean {
  const ext = filename.slice(((filename.lastIndexOf(".") - 0) >>> 0) + 1);
  return TEXT_FILE_EXTENSIONS.includes(`.${ext}`);
}

/**
 * 判断路径是否在排除列表中
 * @param path 路径
 * @returns 布尔值
 */
function isExcluded(path: string): boolean {
  return EXCLUDE_PATHS.some((excludedPath) => path.includes(excludedPath));
}

/**
 * 根据文件后缀返回代码块语言标识
 * @param filename 文件名
 * @returns 代码块语言标识
 */
function getLanguage(filename: string): string {
  const ext = filename.slice(filename.lastIndexOf("."));
  return languageMapping[ext] || "";
}


/**
 * 根据文件的完整路径生成锚点 id
 * @param fullPath 文件的完整路径
 * @returns 锚点 id
 */
function getAnchorId(fullPath: string): string {
  let relativePath = fullPath.replace(currentDir, "");
  relativePath = relativePath.replace(/^[\/\\]+/, ""); // 去除开头的斜杠
  return relativePath.replace(/[\/\\\.]/g, "-");
}

/**
 * 递归遍历目录并构建 Markdown 无序列表格式的文件层级结构
 * @param dir 目录路径
 * @param depth 嵌套层级（用于控制缩进）
 */
async function traverseDirectory(dir: string, depth: number = 0) {
  const entries: Deno.DirEntry[] = [];
  for await (const entry of Deno.readDir(dir)) {
    entries.push(entry);
  }
  // 可选：按名称排序
  entries.sort((a, b) => a.name.localeCompare(b.name));

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (isExcluded(fullPath)) {
      continue;
    }
    const indent = "  ".repeat(depth);
    if (entry.isFile && isTextFile(entry.name)) {
      const anchor = getAnchorId(fullPath);
      outputContent += `${indent}- [${entry.name}](#${anchor})\n`;
    } else {
      outputContent += `${indent}- ${entry.name}\n`;
    }
    if (entry.isDirectory) {
      await traverseDirectory(fullPath, depth + 1);
    }
  }
}

/**
 * 递归读取目录中的文本文件并输出其内容
 * @param dir 目录路径
 */
async function outputFileContents(dir: string) {
  console.log(`开始读取目录: ${dir}`);

  for await (const entry of Deno.readDir(dir)) {
    const fullPath = join(dir, entry.name);
    console.log(`发现: ${fullPath}`);

    if (isExcluded(fullPath)) {
      console.log(`排除: ${fullPath}`);
      continue;
    }

    if (entry.isDirectory) {
      console.log(`进入子目录: ${fullPath}`);
      await outputFileContents(fullPath);
    } else if (entry.isFile && isTextFile(entry.name)) {
      console.log(`读取文件: ${fullPath}`);
      try {
        const content = await Deno.readTextFile(fullPath);
        const anchor = getAnchorId(fullPath);
        const language = getLanguage(entry.name);
        // 在文件内容前加入 HTML 锚点，便于跳转
        outputContent += `\n<a id="${anchor}"></a>\n### ${entry.name}\n\`\`\`${language}\n${content}\n\`\`\`\n`;
        console.log(`成功读取文件: ${fullPath}`);
      } catch (error) {
        outputContent += `\n**无法读取文件 ${fullPath}:** ${error}\n`;
        console.error(`读取文件失败: ${fullPath}, 错误: ${error}`);
      }
    }
  }

  console.log(`完成读取目录: ${dir}`);
}

/**
 * 主函数
 */
async function main() {
  console.log("开始导出..");

  // 输出文件层级结构（使用 Markdown 无序列表形式）
  outputContent += "# 文件层级结构\n\n";
  await traverseDirectory(currentDir);

  // 输出文件内容部分
  outputContent += "\n# 文件内容\n";
  await outputFileContents(currentDir);

  try {
    await Deno.writeTextFile(outputFilePath, outputContent);
    console.log(`成功将内容输出到 ${outputFilePath}`);
  } catch (error) {
    console.error(`无法写入文件 ${outputFilePath}:`, error);
  }
}

main();
