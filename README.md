# 阿黄 · tdwhere

个人作品集站点（React + TypeScript + Vite）。

## 在线访问

部署后地址：

**https://tdwhere123.github.io/tdwhere/**

合并到 `main` 后，GitHub Actions 会自动构建并发布到 GitHub Pages。

### 首次启用（只需一次）

1. 打开仓库 **Settings → Pages**
2. **Source** 选择 **GitHub Actions**
3. 合并本 PR 或手动在 Actions 里运行 **Deploy to GitHub Pages**

## 本地开发

```bash
npm install
npm run dev
```

本地预览生产构建：

```bash
npm run build
npm run preview
```

生产构建的 `base` 为 `/tdwhere/`，与 GitHub Pages 项目站点路径一致。
