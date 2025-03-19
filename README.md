# export.ts

将指定目录下的文本文件统一导出到一个 Markdown 文件（`export.md`），并在导出的 Markdown 中附带文件层级结构和代码内容，方便整体阅读或进一步提交给 AI。

## 目录
- [功能介绍](#功能介绍)
- [依赖环境](#依赖环境)
- [使用方法](#使用方法)
- [自定义配置](#自定义配置)
- [输出说明](#输出说明)
- [注意事项](#注意事项)
- [License](#license)

---

## 功能介绍

1. **批量导出文本文件内容**  
   支持遍历项目目录下的所有文本文件，将其内容收集并输出到单个 Markdown 文件 `export.md` 中。

2. **文件层级结构预览**  
   在 `export.md` 中先以 Markdown 无序列表的方式展示文件与文件夹的层级结构，并为文本文件自动生成跳转链接。

3. **可自定义排除目录和文件**  
   通过在脚本中配置 `EXCLUDE_PATHS`、`TEXT_FILE_EXTENSIONS` 等常量，可以忽略不需要导出的文件或文件夹。

4. **自动生成锚点**  
   通过给每个文件生成唯一的 HTML `anchor`，实现从文件结构列表跳转到相应的具体代码段。

---

## 依赖环境

- [Deno](https://deno.land/) 1.0 及以上版本

脚本使用 Deno 的内置 API（`Deno.readDir`、`Deno.readTextFile`、`Deno.writeTextFile` 等），无需额外安装任何第三方库。


## **使用方法**

### **1. 直接运行远程脚本（无需下载）**
如果你不想手动下载 `export.ts`，可以直接使用 Deno 运行远程脚本：

```bash
deno run --allow-read --allow-write https://raw.githubusercontent.com/w0fv1/exprot.ts/refs/heads/main/export.ts
```

> - `--allow-read` 允许脚本读取本地文件。
> - `--allow-write` 允许脚本在当前目录生成 `export.md` 文件。

**⚠️ 注意：**
- 该方法依赖于 GitHub 服务器，若文件 URL 变动或 GitHub 访问受限，可能会导致脚本无法运行。
- 建议先检查 `export.ts` 代码内容，确保安全后再执行。

---

### **2. 克隆或复制脚本（本地运行）**
如果你希望本地运行 `export.ts`，可以按照以下步骤操作：

#### **1️⃣ 下载脚本**
将 `export.ts` 文件放到你的项目根目录下，确保它与需导出的文件目录处在同一个层级（或者你想要遍历的目标目录下）。

#### **2️⃣ 运行脚本**
在命令行（终端）中定位到脚本所在目录，执行以下命令：

```bash
deno run --allow-read --allow-write ./export.ts
```
> - Windows 下请使用 `.\export.ts`，其他系统下请使用 `./export.ts`。

#### **3️⃣ 查看输出**
脚本执行完成后，会在当前目录生成一个 `export.md` 文件，其中包含：
- 整个项目的文件层级结构（只针对未排除的文件夹和文件）。
- 所有文本文件的内容及其自动生成的锚点链接。

---

### **3. 通过 `deno install` 安装（推荐）**
如果你希望更方便地运行 `export.ts`，可以使用 `deno install` 将其安装为全局命令。

#### **1️⃣ 安装脚本**
```bash
deno install --global --allow-read --allow-write -n exp https://raw.githubusercontent.com/w0fv1/exprot.ts/refs/heads/main/export.ts
```

> - `--global` 让 Deno 作为全局命令安装（Deno 1.38+ 版本需要）。
> - `--allow-read` 允许读取本地文件。
> - `--allow-write` 允许在当前目录生成 `export.md` 文件。
> - `-n exp` 指定命令名称为 `exp`，之后可以直接运行 `exp` 代替完整的命令。

#### **2️⃣ 运行脚本**
安装完成后，直接输入：
```bash
exp
```
即可运行脚本，无需输入长 URL！

#### **3️⃣ 可能的额外步骤**
如果 `exp` 运行时报错 `"command not found"`，请确保 **Deno 安装目录在 `PATH` 环境变量中**：
- Windows 用户：确保 `C:\Users\你的用户名\.deno\bin` 在 `PATH` 变量中。
- macOS/Linux 用户：确保 `~/.deno/bin` 在 `PATH` 变量中。

你可以手动添加 `PATH`：
```bash
export PATH="$HOME/.deno/bin:$PATH"
```
或者 Windows 中执行：
```powershell
$env:Path += ";C:\Users\你的用户名\.deno\bin"
```

---

### **对比 3 种方法**
| 方法 | 适用场景 | 优点 | 缺点 |
|------|----------|------|------|
| **直接运行远程脚本** | 临时使用，不想下载 | 快速、无需手动下载 | 依赖 GitHub |
| **克隆或复制脚本** | 本地开发、离线使用 | 适用于长期维护的项目 | 需要手动管理文件 |
| **Deno Install 安装** | 经常使用该脚本 | 直接运行 `exp` 命令，最便捷 | 需要手动安装一次 |

## 自定义配置

你可以通过修改脚本顶部的一些常量自定义导出行为：

- **要处理的文本文件扩展名**  
  在 `TEXT_FILE_EXTENSIONS` 中添加或删除所需的文件后缀：
  ```ts
  const TEXT_FILE_EXTENSIONS = [".ts", ".js", ".html", ".json", ".vue"];
  ```
  如果你希望包含 `.md` 文件或其他类型，只需将相应的扩展名添加到数组中即可。

- **排除的目录或文件**  
  在 `EXCLUDE_PATHS` 中加入不想导出的文件夹或文件：
  ```ts
  const EXCLUDE_PATHS = [
    "example",
    "node_modules",
    "out",
    "dist",
    "deno.lock",
    "package-lock.json",
    "export.ts",
  ];
  ```
  凡是路径字符串包含列表中的任意元素，都会被跳过不导出。

- **语言高亮映射表**  
  如果需要在导出的 Markdown 中添加语法高亮，可在 `languageMapping` 中对不同后缀配置对应的语言标识：
  ```ts
  const languageMapping: { [ext: string]: string } = {
    ".ts": "typescript",
    ".js": "javascript",
    ".html": "html",
    ".json": "json",
    ".vue": "vue",
  };
  ```
  这样在 Markdown 中插入代码块时，会自动使用对应的语言标识进行高亮。

---

## 输出说明

执行脚本后会生成一个 `export.md` 文件，其中包含：

1. **文件层级结构**  
   - 使用 `# 文件层级结构` 作为标题，后跟一个 Markdown 无序列表，表示当前目录及其子目录中的所有文件。
   - 对于符合 `TEXT_FILE_EXTENSIONS` 的文件，会在无序列表中生成一个跳转链接。

2. **文件内容**  
   - 使用 `# 文件内容` 作为标题，后面依次展示各文本文件的内容。
   - 每个文件块会以 `### 文件名` 作为标题，后面是对应语言高亮的代码块或文本内容。
   - 在每个文件的内容前都会插入一个 `<a id="xxx"></a>` 形式的锚点，以便根据链接跳转到相应内容。

示例结构（简化版）：
```markdown
> # 文件层级结构
> 
> - main.ts
> - src
>   - index.html
>   - styles.css
> 
> # 文件内容
> 
> <a id="main-ts"></a>
> ### main.ts
> ```typescript
> // 这里是 main.ts 的内容
> ```
> 
> <a id="src-index-html"></a>
> ### index.html
>
> ```html
> <!-- 这里是 index.html 的内容 -->
> ```
> ...
```

---

## 注意事项

1. **脚本路径与目录层级**  
   建议将脚本 `export.ts` 放在需要遍历的根目录下。如果你想要遍历其他目录，可以在脚本中修改 `currentDir` 或者将脚本移动到所需的根目录下。

2. **脚本权限**  
   Deno 默认采用安全策略，需要在运行时显式声明需要的权限（如读写、网络访问等）。本脚本需读取文件并写入文件，所以最少需要 `--allow-read` 与 `--allow-write`。

3. **大文件与递归**  
   如果项目特别庞大，或者含有非常大的文件，生成的 `export.md` 也会相应变大；请注意处理大文件可能造成的性能或内存问题。

---

## License

本项目遵循 [MIT License](./LICENSE)。你可以自由复制、修改并发布本项目，但请务必保留原作者信息和 License 声明。

> **提示**：如果对本脚本有任何疑问或改进建议，欢迎提交 PR 或 issue 一起讨论！ 

---

感谢你使用 **export.ts**！希望它能帮你快速整理项目中的文件，方便后续提交给 AI 或共享给他人阅读。祝你使用愉快！
