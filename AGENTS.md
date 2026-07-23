# AGENTS.md — 数字展厅 v0.2 协作规则

> 本文件是给 AI 编程助手（agent）的项目规则。**每次操作前必须遵守。**

## 部署与运行规则（最重要）

### 部署方式：GitHub + Vercel 自动联动
本项目是**纯静态前端**（无构建步骤、无 `package.json`、无 `node_modules`），目录结构即部署产物：
- 源码 `main` 分支推送 → GitHub 仓库 `skillre/digital-exhibition-v02`
- GitHub 联动 **Vercel** 自动部署上线，线上地址即生产环境
- 部署已配置好，无需任何手动部署操作

### 禁止事项（务必遵守）
- ❌ **禁止在本地启动服务器运行/预览**（如 `python -m http.server`、`npx serve`、`vite dev` 等）
- ❌ **禁止在本地运行测试**（如 `npm test`、浏览器自动化等）
- ❌ **禁止安装依赖包**（如 `npm install`、`pnpm install`、`pip install` 等）
- 纯静态项目本就无需依赖安装；任何需要"本地跑起来验证"的动作都应交给线上

### 正确的验证方式
1. 修改代码 → **git commit + git push** 到 `main`
2. 等 Vercel 自动构建（通常 1~2 分钟）
3. 用户在已上线的 Vercel 预览/生产地址直接验证
4. 如有问题，根据用户反馈继续修改 → 再 push

## 技术栈
- **Babylon.js** 3D 引擎（通过 CDN/lib 本地引入，非 npm）
- 原生 ES Modules（`import/export`），直接 `<script type="module">` 加载
- GLB 模型加载（`assets/models/`）
- 无打包工具、无转译、无 TypeScript

## 目录结构
```
src/
  main.js        入口
  hall.js        GLB展厅模型加载 + 展品挂载点 + 碰撞代理盒
  camera.js      第一人称相机 + 椭球碰撞
  exhibits.js    展品
  decorations.js 装饰
  ui.js          UI
  utils.js       工具
  lighting.js    灯光
  video-player.js 视频播放
  content-loader.js
assets/models/   GLB 模型文件
index.html, style.css, contents.json
```

## 碰撞系统约定
- 相机用**原生椭球碰撞**（ellipsoid 覆盖地板→1.7m 全身高度）
- 外墙 + 前台：用**不可见代理盒**承载碰撞（`createWallColliders` 4面墙盒 + `desk-collider` 全身盒）；这些 GLB mesh 自身 `checkCollisions=false`
- 室内内侧建筑骨架（墙/框架/隔断等复杂几何，代理盒无法贴合）：直接开启对应 GLB mesh 的 `checkCollisions=true`（见 hall.js 的 `COLLISION_MESH_PREFIXES` 白名单：`wall`/`frame`/`house_dec`）
- 装饰物（画/地板/植物/灯光/地毯/座椅/花瓶）保持 `checkCollisions=false`，不参与碰撞
- 历史教训：眼高水平射线会从矮物体顶部飞过 → 已弃用，勿再用射线方案防穿越
- 若某白名单 mesh 法线异常导致椭球卡顿，从 `COLLISION_MESH_PREFIXES` 移除该前缀即可（可逆）

## Git 提交约定
- 中文提交信息，`类型: 说明` 格式（feat/fix/revert/docs）
- 不要在 commit 里加 AI 署名
