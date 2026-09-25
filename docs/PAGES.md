# GitHub Pages 部署与 PWA

## 首次启用（由仓库维护者操作）

1. 打开 `rizxlab/veil` → **Settings → Pages → Build and deployment → Source**，选择 **GitHub Actions**。不需要选择 gh-pages 分支，也不用复制网页给出的示例 workflow。
2. 自行提交并推送本次文件到 `main`。本地未代你执行 commit/push 或修改仓库设置。
3. 在 **Actions → Deploy Pages** 查看 build 和 deploy 两个 job。若先推送后开启 Source，可开启后手动 **Run workflow → main**。
4. 部署成功后访问 https://rizxlab.github.io/veil/ 。若环境提示等待审批，在 Settings → Environments → github-pages 检查部署分支是否允许 main，并按仓库策略批准。

现有 `Checks` CI 不变。Pages workflow 自身也执行完整测试、检查和构建，失败不会部署。workflow 使用仓库自动提供的 GITHUB_TOKEN 与 OIDC，无需创建 PAT 或新增 secrets。它读取 Pages 配置，不自动变更 Source。

## 路径与本地构建

```sh
npm test
npm run check
npm run build                       # 根路径 dist，本地或独立域名
VEIL_BASE_PATH=/veil/ npm run build  # 项目子路径 dist
```

Pages workflow 通过 `actions/configure-pages` 的 `base_path` 输出设置 `VEIL_BASE_PATH`，并未硬编码仓库名。任意简单嵌套路径也可构建。

- HTML 和 CSS 使用相对资源路径，JS 的 `sitePath()` 从自身模块位置推导应用目录。
- Hash 路由（如 `/veil/#/tarot`）无需服务器重写，不将 hash 内容当作资源目录。
- manifest 的 id、start_url、scope 与图标路径按 base 生成。
- precache 列表、版本和 Service Worker 缓存名包含应用 base，避免同源不同项目相互清理缓存。
- SW 注册与作用域限定在应用目录；离线导航返回该目录的缓存首页。全部预缓存完成后才启用新版本；下次在线访问浏览器会检查 worker 更新，刷新后使用新页面。
- `npm run dev` 始终在 **http://localhost:5106/**；即使环境设置了部署 base，public 开发缓存仍为 `/`。
- `npm run preview` 在同一固定端口读取 dist 的 scope；子路径产物预览为 `http://localhost:5106/veil/`。验收后执行普通 `npm run build` 并重启 preview 即恢复根路径。不可同时启动两个服务，不使用其他端口。

首次访问需在线等待缓存完成才能离线使用；浏览器清理或回收网站存储会使离线内容和本地记录丢失。安装行为与提示由浏览器决定。

## 以后绑定独立域名

1. 在 GitHub Pages 的 **Custom domain** 中填写域名，并按 GitHub 文档配置域名验证和 DNS；DNS 生效后启用 **Enforce HTTPS**。
2. 域名配置完成后手动运行一次 **Deploy Pages**（或再次 push main）。configure-pages 会返回根 base，构建将使用 `/`。仅设置域名而不重新部署，旧的子路径 manifest/precache 仍可能存在。
3. 在新域名确认图标、路由、SW scope 和离线刷新正常，再从新域名安装 PWA。

不必修改业务代码或搜索替换 `/veil/`。当前没有未知域名的 CNAME 文件；使用 Actions 发布时，由 Pages 网页设置管理自定义域名。

**本地记录按浏览器 origin 隔离**：localhost、github.io 和独立域名各有独立存储；更换域名不会自动迁移旧记录，也不会上传它们。

## 验证边界

本地自动测试覆盖 `/`、`/veil/`、其他子路径的构建资源解析，缓存安装、离线导航、作用域隔离、更新和安装失败回退。浏览器验收使用固定端口模拟子路径；GitHub 真实发布、HTTPS 与手机系统安装仍需你推送并启用 Pages 后确认。

参考：[GitHub Pages 自定义 workflow](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)、[configure-pages 输出定义](https://github.com/actions/configure-pages/blob/v5/action.yml)、[自定义域名](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site)。

## 本次修改文件

| 类别 | 文件 |
| --- | --- |
| 部署 | `.github/workflows/pages.yml`（新增；原 `ci.yml` 未改） |
| 路径与构建 | `scripts/base-path.mjs`、`scripts/build.mjs`、`scripts/check.mjs`、`scripts/serve.mjs`、`src/shared/lib/site-path.js` |
| HTML / PWA | `index.html`、`public/manifest.webmanifest`、`src/infrastructure/pwa/register.js`、`src/infrastructure/pwa/service-worker.js` |
| 动态资源 | `src/features/home/home.js`、`src/features/astro-dice/components/die.js`、`src/features/tarot/data/skins.js`、`src/features/tarot/domain/reading-config.js` |
| 牌背 CSS 路径 | `src/features/tarot/tarot.css`，以及 `components/` 下 `card-drag.css`、`card-face.css`、`shuffle-animation.css` |
| 新增测试 | `tests/paths.test.mjs`、`tests/build-paths.test.mjs`、`tests/service-worker.test.mjs` |
| 文档 | `AGENTS.md`、`README.md`、`docs/GITHUB.md`、`docs/PROJECT.md`、`docs/PAGES.md` |

最终本地结果：43 项测试通过、检查及根/子路径构建通过；两种路径浏览器离线流程通过。未提交或推送。
