# GitHub 首次提交

本文件针对代码托管，不包含网站部署。当前阶段不用 GitHub Pages、不配置服务器，预览地址固定为 http://localhost:5106/。

## 提交内容

提交 `src/`、`public/assets/`、`public/manifest.webmanifest`、`scripts/`、`tests/`、`docs/`、`.github/`、根目录配置及文档。

`.gitignore` 排除 `dist/`、生成的 `public/sw.js` 与 `public/precache.json`、浏览器测试截图与日志、环境变量、依赖和本地编辑器配置。根目录未引用的 `1.png` 原样保留，仅从提交中排除；后续正式资源应命名并放入 `public/assets/`。

完整牌面需随源码提交，才能构建和离线使用。项目没有依赖安装步骤，因而不需要为当前结构新增空的依赖锁文件。

## 本地验证

```sh
npm test
npm run build
```

构建已包含 `npm run check` 的检查内容。GitHub CI 使用同样命令，分别在 Node.js 22 与 24 上运行。远程运行结果需在首次推送后的 Actions 页面确认。

## 首次推送步骤

在 GitHub 创建空仓库，不勾选自动生成 README、LICENSE 或 .gitignore，以免与本地文件产生首次提交冲突。仓库公开性与项目许可证由维护者选择。

在本项目根目录执行（仅在尚无 `.git` 时初始化）：

```sh
git init -b main
git add .
git status --short
git diff --cached --stat
git diff --cached --check
git commit -m "Initial Veil project"
```

确认暂存列表包含牌面、不含截图和构建目录后，在下列命令中替换仓库地址：

```sh
git remote add origin https://github.com/YOUR_ACCOUNT/YOUR_REPOSITORY.git
git push -u origin main
```

如果已有 Git 仓库或 `origin`，先用 `git status`、`git remote -v` 检查现状，不要重复初始化或覆盖远端。Git 作者身份或 GitHub 登录缺失时，按 Git/GitHub 的提示完成配置。

## 当前边界

- 本次准备不初始化项目 Git、不创建提交、不设置远端、不执行推送。
- 本地记录位于浏览器存储，不在源码目录；不要手动把个人数据导出文件加入仓库。
- `.gitignore` 不会移除以前已被跟踪的文件；未来调整忽略规则后仍应核对暂存内容。
- 源码尚未指定项目级开源许可证；不擅自将第三方牌面许可套用到项目代码。
- 路由使用 hash，但资源和 Service Worker 使用根路径；如未来启用 GitHub Pages 子路径部署，需要单独设计、确认并验证。

工作流依据：[GitHub Node.js 测试文档](https://docs.github.com/en/actions/tutorials/build-and-test-code/nodejs)、[checkout](https://github.com/actions/checkout)、[setup-node](https://github.com/actions/setup-node)。
