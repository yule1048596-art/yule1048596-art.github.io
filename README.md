# Yule 的个人博客

这是部署在 GitHub Pages 上的纯静态个人博客：

https://yule1048596-art.github.io/

## 本地预览

```bash
python3 -m http.server 8000
```

然后访问 `http://localhost:8000`。

## 目录

- `index.html`：首页、文章列表、主题筛选、归档和关于区
- `posts/`：文章页面
- `styles.css`：全站样式
- `script.js`：搜索和主题筛选
- `assets/cover.png`：首页和社交分享封面
- `favicon.svg`：站点图标
- `feed.xml`：RSS
- `sitemap.xml`：站点地图
- `404.html`：GitHub Pages 404 页面

## 新增文章

1. 在 `posts/` 目录复制一篇现有文章。
2. 修改文章标题、摘要、日期和正文。
3. 在 `index.html` 的文章列表和归档中增加入口。
4. 在 `feed.xml` 和 `sitemap.xml` 中增加对应链接。

## 发布

推送到 `main` 分支后，GitHub Pages 会从仓库根目录自动发布。
