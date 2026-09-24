# Veil 美术资源

更新：2026-09-25。

## 经典韦特牌面

- 原作品：Rider–Waite–Smith Tarot，1909；画师 Pamela Colman Smith，设计体系 Arthur Edward Waite。
- 本地目录：`public/assets/tarot/rws/`，共 78 张 JPEG，350 × 600。
- 实际下载来源：[metabismuth/tarot-json](https://github.com/metabismuth/tarot-json)，master 分支的 `cards/`。
- 该仓库注明扫描来自 [data.totl.net](http://data.totl.net/tarot-rwcs-images/)，原仓库 MIT 许可文本保存在牌面目录 `LICENSE.txt`。
- 原经典图案公共领域状态参考：[Wikimedia Commons — The Fool](https://commons.wikimedia.org/wiki/File:RWS_Tarot_00_Fool.jpg)。Commons 的页面用于核实原作品状态，并非本次实际下载的扫描文件。
- 未使用现代改绘版、生成式替代牌面或远程热链。未改色、裁切或重新编码扫描图，仅重命名；逆位由 CSS 旋转呈现。
- 源文件映射：`m00–m21 → major-00–major-21`；`c01–c14 → cups-01–cups-14`；`p → pentacles`；`s → swords`；`w → wands`。11 侍从、12 骑士、13 王后、14 国王。力量为 08，正义为 11。
- 浏览器运行时仅请求同源本地图片；不依赖上述来源在线。

## 原创界面图形

| 位置 | 内容 |
| --- | --- |
| `public/assets/tarot/back.svg` | 深灰紫底、香槟金轨道纹样的双向牌背 |
| `public/assets/illustrations/tarot.svg` | 首页塔罗入口 |
| `public/assets/illustrations/dice.svg` | 首页星骰入口，几何线稿 |
| `public/assets/illustrations/oracle.svg` | 首页神谕卡入口，暖金日月主题 |
| `public/assets/icons/veil.svg` | Veil 品牌图标与 favicon |
| `public/assets/icons/icon-192.png`、`icon-512.png` | PWA 与主屏幕图标，由同一品牌 SVG 导出 |
| `src/shared/ui/icons.js` | 小型界面线性图标；作为公共 UI 组件维护 |

字体使用系统字体与系统衬线字体，没有外部字体请求。

新增图片应放在其所属资源目录，并在本文件补充来源、许可与转换信息。不要把图片嵌入业务逻辑或依赖临时下载链接。

2026-09-19：加深原创牌背、塔罗入口插画与品牌图标配色，并由图标 SVG 重新导出 PNG。经典韦特 JPG 未修改。

## 星骰资源（2026-09-19）

`public/assets/dice/{planet,sign,house}.svg` 为本项目原创矢量切面骰，分别为灰紫、绿色和暖金。无外部图片、字体或三维模型依赖。骰面采用 Unicode 文本符号（强制文本呈现以避免彩色表情），由 `src/features/astro-dice/data/faces.js` 统一定义。

## 古典马赛牌面

本地目录 `public/assets/tarot/marseille/` 包含 78 张 JPEG。沿用目录中的 [来源说明](../public/assets/tarot/marseille/SOURCES.md)：Woodcut Tarot 的彩色矢量重制，由项目转换为 JPEG；原作者、扫描来源、CC0 说明及语义牌 ID 映射均保留在该说明中。推送时需一并保留来源文件。

## 桌布

`public/assets/tablecloths/celestial-veil.svg` 为项目原创星轨薄暮纹样，见[桌布资源说明](../public/assets/tablecloths/SOURCES.md)。

## 项目许可边界

上述许可说明适用于对应资源。项目自身代码尚未指定开源许可证，不自动继承某一牌面来源的许可。
