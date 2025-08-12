// export.ts
// deno run -A export.ts [rootDir] ex=pattern1,pattern2
// 目标：基于 .gitignore 完整语义导出文本源文件到 export.md

// Imports
import { join, relative } from "jsr:@std/path";
import ignoreFactory from "npm:ignore"; // RFC 8288 风格 gitignore 语义实现

// ---------- 配置：文本文件判定与语言映射 ----------
const TEXT_EXTS = new Set<string>([
  ".ts",".tsx",".js",".jsx",".mjs",".cjs",
  ".json",".md",".html",".css",".scss",".sass",".less",
  ".vue",".xml",".yml",".yaml",".toml",".ini",".cfg",".conf",
  ".py",".java",".c",".cpp",".h",".hpp",".cs",".go",".rs",".php",
  ".sh",".bash",".zsh",".bat",".cmd",".sql",
  ".swift",".kt",".kts",".dart",".rb",".pl",".pm",".lua",".r",
  ".gql",".graphql",".tex",".hs",".scala",".m",".mm",".gradle",".groovy",
  ".cmake"
]);
const TEXT_BASENAMES = new Set<string>([
  "Dockerfile","Makefile","CMakeLists.txt",".gitignore",".gitattributes"
]);

const LANG_BY_EXT: Record<string,string> = {
  ".ts":"typescript",".tsx":"typescript",".js":"javascript",".jsx":"javascript",".mjs":"javascript",".cjs":"javascript",
  ".json":"json",".md":"markdown",".html":"html",".css":"css",".scss":"scss",".sass":"sass",".less":"less",
  ".vue":"vue",".xml":"xml",".yml":"yaml",".yaml":"yaml",".toml":"toml",".ini":"ini",".cfg":"ini",".conf":"ini",
  ".py":"python",".java":"java",".c":"c",".cpp":"cpp",".h":"c",".hpp":"cpp",".cs":"csharp",".go":"go",".rs":"rust",".php":"php",
  ".sh":"bash",".bash":"bash",".zsh":"bash",".bat":"batch",".cmd":"batch",".sql":"sql",
  ".swift":"swift",".kt":"kotlin",".kts":"kotlin",".dart":"dart",".rb":"ruby",".pl":"perl",".pm":"perl",".lua":"lua",".r":"r",
  ".gql":"graphql",".graphql":"graphql",".tex":"latex",".hs":"haskell",".scala":"scala",".m":"objectivec",".mm":"objectivecpp",
  ".gradle":"gradle",".groovy":"groovy",".cmake":"cmake"
};
const LANG_BY_BASENAME: Record<string,string> = {
  "Dockerfile":"docker","Makefile":"makefile","CMakeLists.txt":"cmake"
};

// ---------- CLI ----------
type Cli = { root: string; extraPatterns: string[] };
function parseCli(): Cli {
  const rawRoot = Deno.args.find(a => !a.startsWith("ex=")) ?? ".";
  const root = rawRoot === "." ? Deno.cwd() : rawRoot;
  const exArg = Deno.args.find(a => a.startsWith("ex="))?.slice(3) ?? "";
  const extraPatterns = exArg
    .split(",")
    .map(s => s.trim())
    .filter(Boolean);
  return { root, extraPatterns };
}

// ---------- 工具 ----------
function toPosixPath(p: string): string { return p.replaceAll("\\", "/"); }
function relPosix(root: string, absPath: string): string {
  return toPosixPath(relative(root, absPath));
}
function isTextFile(name: string): boolean {
  const dot = name.lastIndexOf(".");
  const ext = dot >= 0 ? name.slice(dot) : "";
  return TEXT_EXTS.has(ext) || TEXT_BASENAMES.has(name);
}
function languageOf(name: string): string {
  const dot = name.lastIndexOf(".");
  const ext = dot >= 0 ? name.slice(dot) : "";
  if (LANG_BY_EXT[ext]) return LANG_BY_EXT[ext];
  if (LANG_BY_BASENAME[name]) return LANG_BY_BASENAME[name];
  return "";
}
function anchorOf(relPath: string): string {
  // 稳定可读锚点：POSIX 相对路径中的非字母数字与点斜杠替换为 -
  return relPath.replace(/[\/\\\. ]/g, "-");
}

// ---------- 核心：.gitignore 读取并“重定位”到仓库根 ----------
// 规则：在子目录 .gitignore 中
//   1) 以 "/" 开头的规则相对于该子目录；重定位为 `${dirRel}/${rule.slice(1)}`
//   2) 含 "/" 但不以 "/" 开头的规则相对该子目录；重定位为 `${dirRel}/${rule}`
//   3) 不含 "/" 的“名字规则”适用于该子目录及其所有后代；重定位为 `${dirRel}/**/${rule}`
//   4) 以 "!" 开头为反选，保持其位置优先级，前缀加在 "!" 之后
//   5) 以 "\!" 或 "\#" 开头为字面量，不当作特殊前缀
async function readGitignoreRaw(dirAbs: string): Promise<string[]> {
  try {
    const text = await Deno.readTextFile(join(dirAbs, ".gitignore"));
    // 保留行内空格，不 trimRight。空行直接忽略。
    return text.split(/\r?\n/);
  } catch {
    return [];
  }
}
function rebasePatternToRoot(rawLine: string, dirRel: string): string | null {
  if (!rawLine) return null;              // 空行
  if (rawLine[0] === "#") return null;    // 注释（首字符 #，不含转义）
  // 首字符转义的 "!" 或 "#" 视为普通模式
  const isEscapedBang = rawLine.startsWith("\\!");
  const isEscapedHash = rawLine.startsWith("\\#");
  const neg = !isEscapedBang && rawLine[0] === "!";
  let body = neg ? rawLine.slice(1) : rawLine;
  // 去除前导的 "./" 兼容写法
  if (body.startsWith("./")) body = body.slice(2);

  let rebased: string;
  if (body.startsWith("/")) {
    // 目录锚定到当前 .gitignore 所在目录
    rebased = dirRel ? `${dirRel}${body}` : body.slice(1);
  } else if (body.includes("/")) {
    rebased = dirRel ? `${dirRel}/${body}` : body;
  } else {
    rebased = dirRel ? `${dirRel}/**/${body}` : `**/${body}`;
  }
  return neg ? `!${rebased}` : rebased;
}

// 预扫描所有子树中的 .gitignore，按“父->子”的顺序展平为**根相对**模式数组。
// 为保持 Git 的优先级：父目录的规则先于子目录规则；同一目录内按文件行序。
async function collectAllIgnorePatterns(root: string): Promise<string[]> {
  const patterns: string[] = [];
  async function dfs(dirAbs: string, dirRel: string): Promise<void> {
    // 先处理当前目录 .gitignore
    const lines = await readGitignoreRaw(dirAbs);
    for (const line of lines) {
      const rebased = rebasePatternToRoot(line, dirRel);
      if (rebased) patterns.push(rebased);
    }
    // 再下潜子目录（按名称排序，稳定遍历）
    const subs: string[] = [];
    for await (const e of Deno.readDir(dirAbs)) {
      if (e.isDirectory) subs.push(e.name);
    }
    subs.sort((a, b) => a.localeCompare(b));
    for (const name of subs) {
      const childAbs = join(dirAbs, name);
      const childRel = dirRel ? `${dirRel}/${name}` : name;
      await dfs(childAbs, childRel);
    }
  }
  await dfs(root, "");
  return patterns;
}

// ---------- 文件遍历（一次 DFS，收集目录树与文件清单） ----------
type TreeResult = { lines: string[]; files: string[] };
async function buildTreeAndFiles(
  root: string,
  ig: ReturnType<typeof ignoreFactory>,
  dirAbs: string,
  dirRel: string,
  depth: number
): Promise<TreeResult> {
  const entries: Deno.DirEntry[] = [];
  for await (const e of Deno.readDir(dirAbs)) entries.push(e);
  entries.sort((a, b) => a.name.localeCompare(b.name));

  const lines: string[] = [];
  const files: string[] = [];

  // 先处理目录，后处理文件，使树自然分组
  for (const e of entries) {
    if (!e.isDirectory) continue;
    const childAbs = join(dirAbs, e.name);
    const childRel = dirRel ? `${dirRel}/${e.name}` : e.name;
    // 目录忽略：测试 "path/" 形式（ignore 库约定）
    const asDir = `${childRel}/`;
    if (ig.ignores(childRel) || ig.ignores(asDir)) continue;

    const sub = await buildTreeAndFiles(root, ig, childAbs, childRel, depth + 1);
    if (sub.files.length === 0 && sub.lines.length === 0) continue; // 空目录或全被忽略
    lines.push(`${"  ".repeat(depth)}- ${e.name}`);
    lines.push(...sub.lines);
    files.push(...sub.files);
  }

  for (const e of entries) {
    if (!e.isFile) continue;
    const rel = dirRel ? `${dirRel}/${e.name}` : e.name;
    if (!isTextFile(e.name)) continue;
    if (ig.ignores(rel)) continue;
    const anchor = anchorOf(rel);
    lines.push(`${"  ".repeat(depth)}- [${e.name}](#${anchor})`);
    files.push(rel);
  }

  return { lines, files };
}

// ---------- Markdown 生成 ----------
async function generateMarkdown(
  root: string,
  files: string[],
  treeLines: string[]
): Promise<string> {
  let out = "# 文件层级结构\n\n";
  out += treeLines.join("\n") + "\n\n";
  out += "# 文件内容\n";

  for (const rel of files) {
    const abs = join(root, rel);
    const content = await Deno.readTextFile(abs).catch(err => `无法读取：${String(err)}`);
    const lang = languageOf(rel.split("/").pop() ?? "");
    const anchor = anchorOf(rel);
    out += `\n<a id="${anchor}"></a>\n### ${rel}\n\`\`\`${lang}\n${content}\n\`\`\`\n`;
  }
  return out;
}

// ---------- main ----------
async function main() {
  const { root, extraPatterns } = parseCli();

  // 1) 汇总 .gitignore 规则并追加用户 ex= 规则（用户规则优先级最高）
  const ignorePatterns = await collectAllIgnorePatterns(root);
  const ig = ignoreFactory().add([...ignorePatterns, ...extraPatterns]);

  // 2) 构建目录树与文件清单
  const { lines, files } = await buildTreeAndFiles(root, ig, root, "", 0);

  // 3) 生成并写出
  const md = await generateMarkdown(root, files, lines);
  const outPath = join(root, "export.md");
  await Deno.writeTextFile(outPath, md);
  console.log(`导出完成 -> ${outPath}`);
}

if (import.meta.main) {
  await main();
}
