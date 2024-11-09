---
title: "Angular 提交规范"
date: 2024-11-09 17:51:00 +0800
categories: [Study] # 目前有 Demo, Tutorial, Tech, Study
tags: [Angular, Git]
author: Zwei  # 或 authors: [Zwei, another_author]
description: "第一篇正式博文，当然是 Hello world！"
image:
  path: https://i0.img2ipfs.com/ipfs/QmWLfBXWDrowQYPxFJeuXnx9hXQtdk7eTTFjqiPj6VfXAT
permalink: '/w/Angular'  # 自定义永久链接
pin: false # 置顶文章
toc: true # 显示目录
comments: true # 允许评论
math: true # 启用数学公式
mermaid: true # 启用 Mermaid 图表
render_with_liquid: false # 禁用 Liquid 渲染
media_subpath: /blog/assets/ # 资源路径前缀
---

Angular 提交规范是一种约定俗成的提交信息格式，将提交信息分为类型、范围和简短描述三个部分，格式如下：

```xml
<类型>(<范围>): <简短描述>
```

- <类型>: 用于描述提交的性质，常见类型有：
  - feat: 新功能
  - fix: 修复 bug
  - docs: 文档变更
  - style: 代码样式变更
  - refactor: 重构代码
  - test: 测试相关
  - chore: 其他杂项
- <范围>: 描述提交所涉及的范围，可以是任何与提交相关的内容，通常是文件名或模块名。
- <简短描述>: 对提交的简要描述，清晰明了。

例如：

```plaintext
feat(login): add new login feature
fix(api): fix issue with API request
docs(readme): update installation instructions
```

常见的提交类型包括 `feat`、`fix`、`docs`、`style`、`refactor`、`test` 和 `chore`。
