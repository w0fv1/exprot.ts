// @ts-nocheck

// 导入必要的模块
import { join } from "jsr:@std/path";

// 定义要处理的文本文件扩展名
const TEXT_FILE_EXTENSIONS = [
  ".ts",   // TypeScript
  ".js",   // JavaScript
  ".jsx",  // React JavaScript
  ".tsx",  // React TypeScript
  ".html", // HTML
  ".css",  // CSS
  ".scss", // SASS/SCSS
  ".json", // JSON
  ".vue",  // Vue.js
  ".java", // Java
  ".py",   // Python
  ".c",    // C
  ".cpp",  // C++
  ".h",    // C/C++ Header files
  ".hpp",  // C++ Header files
  ".cs",   // C#
  ".go",   // Go
  ".rs",   // Rust
  ".php",  // PHP
  ".sh",   // Shell Script
  ".bat",  // Windows Batch Script
  ".sql",  // SQL
  ".md",   // Markdown
  ".yaml", // YAML
  ".yml",  // YAML (alternative extension)
  ".toml", // TOML
  ".xml",  // XML
  ".swift",// Swift
  ".kt",   // Kotlin
  ".dart", // Dart (Flutter)
  ".r",    // R Language
  ".rb",   // Ruby
  ".perl", // Perl
  ".lua",  // Lua
  ".ini",  // INI Config Files
  ".cfg",  // Configuration Files
  ".pl",   // Perl
  ".dockerfile", // Dockerfile (can also be named without extension)
  ".makefile"    // Makefile (can also be named without extension)
];

// 定义要排除的文件夹和文件
// 定义要排除的文件夹和文件
const EXCLUDE_PATHS = [
  // 依赖管理目录
  "node_modules",      // Node.js 依赖
  "vendor",            // 依赖供应商目录（如 PHP Composer）
  ".venv", 
  // 编译/构建输出
  "out",               // 通用编译输出目录
  "dist",              // 构建产物
  "build",             // 编译生成文件
  "target",            // Rust/Cargo 编译输出
  ".next",             // Next.js 输出
  ".vercel",           // Vercel 部署相关
  ".nuxt",             // Nuxt.js 编译目录
  ".expo",             // Expo（React Native）缓存
  ".angular",          // Angular 缓存

  // 版本控制相关
  ".git",              // Git 版本控制目录
  ".github",           // GitHub 配置目录
  ".gitignore",        // Git 忽略文件
  ".gitattributes",    // Git 属性文件
  ".svn",              // SVN 版本控制目录
  ".hg",               // Mercurial 版本控制目录

  // 配置和临时文件
  "deno.lock",         // Deno 依赖锁文件
  "package-lock.json", // npm 依赖锁文件
  "pnpm-lock.yaml",    // pnpm 依赖锁文件
  "yarn.lock",         // Yarn 依赖锁文件
  "bun.lockb",         // Bun 依赖锁文件
  "composer.lock",     // PHP Composer 依赖锁文件
  "Cargo.lock",        // Rust Cargo 依赖锁文件
  "Gemfile.lock",      // Ruby Bundler 依赖锁文件

  // IDE 和编辑器相关
  ".vscode",           // VS Code 配置
  ".idea",             // JetBrains IDE 配置（WebStorm、PyCharm 等）
  ".DS_Store",         // macOS Finder 索引文件
  "Thumbs.db",         // Windows 缓存文件

  // 日志和缓存
  "logs",              // 日志目录
  ".cache",            // 通用缓存目录
  ".npm",              // npm 缓存
  ".yarn",             // Yarn 缓存
  ".pnp",              // Yarn Plug'n'Play 缓存
  ".turbo",            // TurboRepo 缓存
  ".parcel-cache",     // Parcel 构建缓存
  ".eslintcache",      // ESLint 缓存

  // 环境变量和敏感文件
  ".env",              // 环境变量文件
  ".env.local",        // 本地环境变量
  ".env.development",  // 开发环境变量
  ".env.production",   // 生产环境变量
  ".env.test",         // 测试环境变量

  // 其他
  "export.ts",         // 该项目的特定导出文件
  "coverage",          // 代码覆盖率报告
  "cypress",           // Cypress 端到端测试目录
  "__pycache__",       // Python 缓存
  ".pytest_cache",     // pytest 缓存
  ".mypy_cache",       // mypy 缓存
  "jest.config.js",    // Jest 配置文件
  "test-results",      // 测试结果目录
];

const languageMapping: { [ext: string]: string } = {
  // Web 开发
  ".ts": "typescript",
  ".tsx": "typescript",
  ".js": "javascript",
  ".jsx": "javascript",
  ".html": "html",
  ".css": "css",
  ".scss": "scss",
  ".sass": "sass",
  ".less": "less",
  ".json": "json",
  ".vue": "vue",
  ".xml": "xml",
  ".yaml": "yaml",
  ".yml": "yaml",
  ".toml": "toml",

  // Python
  ".py": "python",
  ".pyw": "python",

  // C/C++
  ".c": "c",
  ".cpp": "cpp",
  ".cc": "cpp",
  ".h": "c",
  ".hpp": "cpp",

  // Java
  ".java": "java",
  ".jsp": "java",

  // C#
  ".cs": "csharp",

  // Go
  ".go": "go",

  // Rust
  ".rs": "rust",

  // PHP
  ".php": "php",
  ".phtml": "php",

  // Shell 脚本
  ".sh": "shell",
  ".bash": "shell",
  ".zsh": "shell",

  // Windows 批处理
  ".bat": "batch",
  ".cmd": "batch",

  // SQL
  ".sql": "sql",

  // Markdown / 文本相关
  ".md": "markdown",
  ".txt": "plaintext",

  // Swift / iOS 开发
  ".swift": "swift",

  // Kotlin / Android 开发
  ".kt": "kotlin",
  ".kts": "kotlin",

  // Dart / Flutter 开发
  ".dart": "dart",

  // Ruby
  ".rb": "ruby",

  // Perl
  ".pl": "perl",
  ".pm": "perl",

  // Lua
  ".lua": "lua",

  // R 语言
  ".r": "r",

  // 配置 / Makefile / 脚本
  ".ini": "ini",
  ".cfg": "ini",
  ".conf": "ini",
  ".env": "ini",
  ".dockerfile": "docker",
  "Dockerfile": "docker",
  "Makefile": "makefile",
  "CMakeLists.txt": "cmake",
  ".cmake": "cmake",

  // Gradle / Groovy
  ".gradle": "gradle",
  ".groovy": "groovy",

  // GraphQL
  ".gql": "graphql",
  ".graphql": "graphql",

  // TypeScript 类型定义
  ".d.ts": "typescript",

  // AppleScript
  ".applescript": "applescript",

  // LaTeX
  ".tex": "latex",

  // Haskell
  ".hs": "haskell",

  // Scala
  ".scala": "scala",

  // Objective-C / Objective-C++
  ".m": "objectivec",
  ".mm": "objectivecpp"
};
// 从命令行参数解析排除文件或文件夹
function parseExcludeArg(): string[] {
  const excludeArgPrefix = "ex=";
  for (const arg of Deno.args) {
    if (arg.startsWith(excludeArgPrefix)) {
      return arg
        .slice(excludeArgPrefix.length)
        .split(",")
        .map((item) => item.trim());
    }
  }
  return [];
}

// 获取用户指定排除的文件或文件夹
const userExcludedPaths = parseExcludeArg();


// 获取命令行参数：期望用户直接传入目录路径
// deno run --allow-read --allow-write export.ts /path/to/directory
const inputDirArg = Deno.args.find((arg) => !arg.startsWith("ex="));
const inputDir = inputDirArg || ".";
const currentDir = inputDir === "." ? Deno.cwd() : inputDir; // 处理 "." 使其指向当前目录

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
  const combinedExcludePaths = EXCLUDE_PATHS.concat(userExcludedPaths);
  return combinedExcludePaths.some((excludedPath) => path.includes(excludedPath));
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
 * 从当前目录加载 .gitignore 并解析忽略规则
 */
async function loadGitignoreExcludes(baseDir: string): Promise<string[]> {
  const gitignorePath = join(baseDir, ".gitignore");
  try {
    const stat = await Deno.stat(gitignorePath);
    if (!stat.isFile) return [];

    const lines = (await Deno.readTextFile(gitignorePath))
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#"));

    // 转换成简单的匹配模式（这里使用直接字符串包含匹配）
    // 如果需要更精准，可以替换成正则表达式匹配
    const patterns: string[] = [];
    for (const line of lines) {
      if (line.endsWith("/")) {
        // 目录
        patterns.push(line.replace(/\/$/, ""));
      } else {
        patterns.push(line);
      }
    }
    return patterns;
  } catch {
    return [];
  }
}

/**
 * 主函数
 */
async function main() {
  console.log("开始导出..");

  // 如果当前目录包含 .gitignore，则追加忽略规则
  const gitignoreExcludes = await loadGitignoreExcludes(currentDir);
  EXCLUDE_PATHS.push(...gitignoreExcludes);

  // 输出文件层级结构
  outputContent += "# 文件层级结构\n\n";
  await traverseDirectory(currentDir);

  // 输出文件内容
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
