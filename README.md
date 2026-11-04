# 思辨之境 · 长文文库

> 线上地址：[https://yule1048596-art.github.io](https://yule1048596-art.github.io)

Yule 的个人长文文库，按主题整理 AI 与技术哲学、认知心理、职场社会、媒介批判、游戏工业与文学品读六个领域的文章。收录随笔长文、论文译文，以及 B 站 UP 主「智能路障」《围炉夜话》系列的视频文案；每篇文章页都标注作者与原始出处。

![首页预览](preview_home.png)

## 功能

- **首页**：精选文章、系列（任天堂三部曲、《不哭不哭，痛痛飞走吧》读后感四部曲、《围炉夜话》）、按领域分组的全部文章目录
- **筛选与搜索**：按领域筛选、按系列筛选，即时搜索标题、标签、作者与摘要（按 `/` 聚焦搜索框）
- **阅读页**：直接渲染 `articles/` 下的 Markdown，带自动目录与当前章节高亮、阅读进度条、字号调节、系列导航、上一篇/下一篇、同领域推荐；支持表格、图片说明和 KaTeX 数学公式
- **深色模式**：跟随系统，也可手动切换并记忆

## 目录结构

```
index.html              首页
article_detail.html     阅读页（article_detail.html?file=<文件名>.md）
404.html                404 页面
articles.json           文章索引（由脚本生成）
articles/               Markdown 原文、图片与 PDF
assets/style.css        样式
assets/site.js          主题切换与文库公共函数
assets/vendor/          marked 12.0.2、KaTeX 0.16.11（本地化，不依赖 CDN）
tools/build_index.py    重新生成 articles.json
```

## 添加或修改文章

1. 把 Markdown 文件放进 `articles/`。图片放在同一目录，用相对路径引用（如 `![说明](图片.png)`），说明文字会显示为图注。
2. 运行索引脚本：

   ```bash
   python3 tools/build_index.py
   ```

   脚本会读取 YAML front matter（`title`、`author`、`url`、`duration`、`tags`）或第一个 `# 标题`，自动生成摘要、字数和阅读时间。
3. 新文件的领域默认为“未分类”，在 `articles.json` 里把它的 `category` 改成已有的领域名称即可；之后再运行脚本，已有的领域设置会保留。
4. 首页精选篇目在 `index.html` 顶部的 `FEATURED` 数组里修改。

## 本地预览

页面通过 `fetch` 读取 `articles.json` 和 Markdown，需要用本地服务器打开（直接双击 HTML 文件会载入失败）：

```bash
python3 -m http.server 8000
```

然后访问 http://localhost:8000 。

## 版权

原创内容遵循 [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/deed.zh) 协议。《围炉夜话》文案版权归 UP 主「智能路障」所有，《LLMs can't jump》原文版权归 Tom Zahavy 所有。
