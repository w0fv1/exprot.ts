// 运行命令示例:
// deno run -A export.ts
// deno run -A export.ts /path/to/your/project
// deno run -A export.ts /path/to/your/project ex=.env,.idea,*.log

import { join, relative, basename, extname } from "jsr:@std/path";
import ignore from "npm:ignore";

/**
 * 判断文件是否为文本文件的扩展名集合。
 * 你可以根据需要扩展这个列表。
 */
const TEXT_EXTS: Set<string> = new Set([
    ".txt", ".md", ".json", ".js", ".ts", ".tsx", ".jsx", ".html", ".css",
    ".scss", ".less", ".yaml", ".yml", ".xml", ".toml", ".ini", ".sh",
    ".bash", ".py", ".go", ".rs", ".java", ".c", ".cpp", ".h", ".hpp",
    ".cs", ".php", ".rb", ".pl", ".sql", ".lua", ".swift", ".kt", ".kts",
    ".dart", ".vue", ".svelte", ".astro", ".gitignore", ".gitattributes",
    ".dockerfile", ".editorconfig", ".npmrc", ".yarnrc", ".babelrc",
    ".prettierrc", ".eslintrc", ".stylelintrc", ".nvmrc", "license",
]);

/**
 * 判断文件是否为文本文件的完整文件名集合。
 */
const TEXT_BASENAMES: Set<string> = new Set([
    "Dockerfile", "LICENSE", "README", "Makefile", "go.mod", "go.sum",
]);

/**
 * 根据文件扩展名推断 Markdown 代码块的语言标识符。
 */
const LANG_BY_EXT: Record<string, string> = {
    ".js": "javascript",
    ".ts": "typescript",
    ".tsx": "tsx",
    ".jsx": "jsx",
    ".md": "markdown",
    ".json": "json",
    ".html": "html",
    ".css": "css",
    ".scss": "scss",
    ".less": "less",
    ".yaml": "yaml",
    ".yml": "yaml",
    ".xml": "xml",
    ".py": "python",
    ".rs": "rust",
    ".java": "java",
    ".go": "go",
    ".c": "c",
    ".cpp": "cpp",
    ".h": "c",
    ".hpp": "cpp",
    ".cs": "csharp",
    ".php": "php",
    ".rb": "ruby",
    ".sh": "bash",
    ".bash": "bash",
    ".sql": "sql",
    ".swift": "swift",
    ".kt": "kotlin",
    ".kts": "kotlin",
    ".vue": "vue",
    ".svelte": "svelte",
};

/**
 * 根据完整文件名推断 Markdown 代码块的语言标识符。
 */
const LANG_BY_BASENAME: Record<string, string> = {
    "dockerfile": "dockerfile",
    "makefile": "makefile",
};

/**
 * 将路径中的特殊字符转换为合法的 HTML id。
 * @param path 文件相对路径
 * @returns 转换后的 id 字符串
 */
function pathToId(path: string): string {
    return path.replace(/[\/\\.]/g, "-");
}

/**
 * 检查文件路径是否代表一个文本文件。
 * @param path 文件路径
 * @returns 如果是文本文件则返回 true，否则返回 false
 */
function isTextFile(path: string): boolean {
    const ext = extname(path).toLowerCase();
    const base = basename(path).toLowerCase();
    if (TEXT_EXTS.has(ext)) {
        return true;
    }
    if (TEXT_BASENAMES.has(base)) {
        return true;
    }
    // 特殊情况：没有扩展名的 LICENSE 文件
    if (base.startsWith("license") && ext === "") {
        return true;
    }
    return false;
}

/**
 * 根据文件路径推断其编程语言。
 * @param path 文件路径
 * @returns 语言标识符字符串，未知则为空字符串
 */
function getLanguage(path: string): string {
    const ext = extname(path).toLowerCase();
    const base = basename(path).toLowerCase();
    return LANG_BY_BASENAME[base] ?? LANG_BY_EXT[ext] ?? "";
}

/**
 * 规范化路径为 POSIX 风格 (使用 /)。
 * 这对于 `ignore` 库的正确匹配至关重要。
 * @param p 路径字符串
 * @returns 规范化后的路径字符串
 */
function normalizePath(p: string): string {
    return p.replace(/\\/g, "/");
}

/**
 * 递归遍历目录，收集所有要导出的文件路径。
 * @param dir 当前遍历的目录
 * @param rootDir 项目根目录
 * @param ig 当前目录生效的 ignore 实例
 * @param filesToExport 收集文件路径的数组
 */
async function collectFiles(
    dir: string,
    rootDir: string,
    ig: any, // ignore instance
    filesToExport: string[],
) {
    const entries = [];
    for await (const entry of Deno.readDir(dir)) {
        entries.push(entry);
    }
    // 对目录条目排序，保证输出稳定性
    entries.sort((a, b) => a.name.localeCompare(b.name));

    for (const entry of entries) {
        const fullPath = join(dir, entry.name);
        const relativePath = normalizePath(relative(rootDir, fullPath));

        // 如果路径被忽略，则跳过
        if (ig.ignores(relativePath)) {
            continue;
        }

        if (entry.isDirectory) {
            let nextIg = ig;
            const gitignorePath = join(fullPath, ".gitignore");
            try {
                const gitignoreContent = await Deno.readTextFile(gitignorePath);
                // 创建新的 ignore 实例，继承父级规则
                nextIg = ignore().add(ig);
                // "Rebase" 规则：将子目录的规则与子目录路径结合，使其相对于根目录生效
                const rebasedPatterns = gitignoreContent.split(/\r?\n/).map(line => {
                    line = line.trim();
                    if (line === '' || line.startsWith('#')) return '';
                    const isNegative = line.startsWith('!');
                    if (isNegative) line = line.slice(1);
                    if (line.startsWith('/')) line = line.slice(1);
                    return (isNegative ? '!' : '') + normalizePath(join(relativePath, line));
                }).filter(Boolean);
                nextIg.add(rebasedPatterns);
            } catch (error) {
                if (!(error instanceof Deno.errors.NotFound)) {
                    console.warn(`[Warning] Failed to read ${gitignorePath}:`, error);
                }
                // .gitignore 不存在时，沿用父目录的 ignore 实例
            }
            await collectFiles(fullPath, rootDir, nextIg, filesToExport);
        } else if (entry.isFile && isTextFile(fullPath)) {
            filesToExport.push(relativePath);
        }
    }
}

/**
 * 主函数
 */
async function main() {
    // 1. 解析命令行参数
    const args = Deno.args;
    let rootDir = Deno.cwd();
    const extraIgnores: string[] = [];

    const nonFlagArgs = [];
    for (const arg of args) {
        if (arg.startsWith("ex=")) {
            extraIgnores.push(...arg.slice(3).split(',').map(s => s.trim()).filter(Boolean));
        } else {
            nonFlagArgs.push(arg);
        }
    }

    if (nonFlagArgs.length > 0) {
        rootDir = join(Deno.cwd(), nonFlagArgs[0]);
    }

    console.log(`[Info] Starting export from root directory: ${rootDir}`);
    if (extraIgnores.length > 0) {
        console.log(`[Info] Applying extra ignore patterns: ${extraIgnores.join(", ")}`);
    }

    // 2. 初始化 ignore 实例并应用规则
    const rootIg = ignore();

    // 添加默认忽略规则和命令行传入的规则
    // 这些规则拥有最高优先级
    const defaultIgnores = [
        ".git", // 总是忽略 .git 目录
        "export.md", // 忽略输出文件本身
        ...extraIgnores,
    ];
    rootIg.add(defaultIgnores);

    // 尝试读取根目录的 .gitignore
    const rootGitignorePath = join(rootDir, ".gitignore");
    try {
        const content = await Deno.readTextFile(rootGitignorePath);
        rootIg.add(content);
    } catch (error) {
        if (error instanceof Deno.errors.NotFound) {
            console.log("[Info] No .gitignore file found in the root directory.");
        } else {
            console.warn(`[Warning] Failed to read ${rootGitignorePath}:`, error);
        }
    }

    // 3. 递归收集所有待导出的文件
    const filesToExport: string[] = [];
    await collectFiles(rootDir, rootDir, rootIg, filesToExport);

    if (filesToExport.length === 0) {
        console.log("[Info] No text files to export after applying ignore rules.");
        return;
    }

    console.log(`[Info] Found ${filesToExport.length} text files to export.`);

    // 4. 生成 Markdown 内容
    const mdParts: string[] = [];

    // 4.1. 生成文件层级结构树
    mdParts.push("# Project Code Export\n");
    mdParts.push("## File Structure\n");
    const tree: string[] = [];
    filesToExport.forEach(path => {
        tree.push(`- [${path}](#${pathToId(path)})`);
    });
    mdParts.push(tree.join("\n") + "\n");

    // 4.2. 生成各文件内容
    mdParts.push("## File Content\n");
    for (const path of filesToExport) {
        const fullPath = join(rootDir, path);
        const lang = getLanguage(path);
        mdParts.push(`\n<a id="${pathToId(path)}"></a>`);
        mdParts.push(`### \`${path}\`\n`);
        mdParts.push("```" + lang);
        try {
            const content = await Deno.readTextFile(fullPath);
            mdParts.push(content);
        } catch (error) {
            mdParts.push(`/*\n[Error] Unable to read file: ${path}\nReason: ${error.message}\n*/`);
            console.error(`[Error] Failed to read content of ${path}:`, error);
        }
        mdParts.push("```");
    }

    // 5. 写入到 export.md 文件
    const outputFilePath = join(rootDir, "export.md");
    try {
        await Deno.writeTextFile(outputFilePath, mdParts.join("\n"));
        console.log(`[Success] Export completed! Check the file: ${outputFilePath}`);
    } catch (error) {
        console.error(`[Fatal] Failed to write to ${outputFilePath}:`, error);
    }
}

// 脚本入口
if (import.meta.main) {
    await main();
}
