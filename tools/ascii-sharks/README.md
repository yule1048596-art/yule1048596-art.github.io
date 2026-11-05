# ascii-sharks（首页背景动画）

首页背景的 ASCII 鲨鱼动画来自 [stackedlol/ascii-sharks](https://github.com/stackedlol/ascii-sharks)，作者 drewdi，MIT 协议（见本目录 `LICENSE`）。这里保存的是基于上游提交 `a0074c1` 修改过的 TypeScript 源码，网站实际加载的是编译后的 `assets/vendor/ascii-sharks/ocean.js`。

## 相对上游的改动

- `src/renderer.ts`：新增 `setTheme("dark" | "light")`。深色沿用原版黑色海洋；浅色把所有颜色映射到纸色与墨色（灰阶按亮度转成墨色深浅，彩色保留色相并加深），结果按颜色字符串缓存。
- `src/engine.ts`：构造参数增加 `{ theme, fps }`，并提供 `setTheme()`；`fps` 只限制绘制频率，模拟仍按固定步长运行。
- 未收录上游的 `react.tsx`、`demo.ts` 和 Vite 配置。

## 重新编译

需要 Node.js。在仓库根目录运行：

```bash
npx esbuild@0.24.2 tools/ascii-sharks/src/index.ts --bundle --format=esm --target=es2020 --minify --outfile=assets/vendor/ascii-sharks/ocean.js
```

编译后记得保留文件开头的版权说明注释（可用 `--banner:js=` 加上）。
