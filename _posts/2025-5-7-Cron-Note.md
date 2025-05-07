---
title: Cron Note
date: 2025-5-7 11:58:40 +0800
categories: [Study] # 目前有 Demo, Tutorial, Tech, Study
tags: [Linux, Cron]
author: Zwei  # 或 authors: [Zwei, another_author]
description: "`cron` 是一个在 Unix-like 操作系统（如 Linux、macOS）中用于设置周期性执行任务的工具。它允许你在指定的时间自动运行命令或脚本。这篇教程将详细介绍如何使用 `cron` 定时任务。"
image:
  path: https://testingcf.jsdelivr.net/gh/bestZwei/imgs@master/picgo/ed7bd622a81c4eb547159137f7b62cfa.png
permalink: '/w/cron'  # 自定义永久链接
pin: false # 置顶文章
toc: true # 显示目录
comments: true # 允许评论
math: true # 启用数学公式
mermaid: true # 启用 Mermaid 图表
render_with_liquid: false # 禁用 Liquid 渲染
media_subpath: /blog/assets/ # 资源路径前缀
---

`cron` 是一个在 Unix-like 操作系统（如 Linux、macOS）中用于设置周期性执行任务的工具。它允许你在指定的时间自动运行命令或脚本。这篇教程将详细介绍如何使用 `cron` 定时任务。

**1. `cron` 是什么？**

`cron` 是一个守护进程（daemon），它在后台运行，并根据一个叫做 `crontab` 的配置文件来执行预定的任务。每个用户都可以有自己的 `crontab` 文件，用于定义自己的定时任务。系统管理员（root 用户）还可以设置系统级别的定时任务。

**2. `crontab` 文件格式**

`crontab` 文件中的每一行代表一个定时任务，其基本格式如下：

```txt
分钟 小时 日 月 星期 要执行的命令
```

这六个字段的含义和取值范围如下：

1.  **分钟 (Minute):** 0 到 59
2.  **小时 (Hour):** 0 到 23
3.  **日 (Day of Month):** 1 到 31
4.  **月 (Month):** 1 到 12，或者使用月份的英文缩写（Jan, Feb, Mar, Apr, May, Jun, Jul, Aug, Sep, Oct, Nov, Dec）
5.  **星期 (Day of Week):** 0 到 7，其中 0 和 7 都代表星期日，1 代表星期一，以此类推。也可以使用星期的英文缩写（Sun, Mon, Tue, Wed, Thu, Fri, Sat）
6.  **要执行的命令 (Command):** 任何可以在 shell 中执行的命令或脚本路径。
7.  **不能使用负数**

**特殊字符：**

在这些时间字段中，你可以使用一些特殊字符来指定更灵活的时间：

*   `*`: 星号代表“每一个”可能的值。例如，在分钟字段中使用 `*` 表示每分钟都执行。
*   `,`: 逗号用于分隔列表。例如，在小时字段中使用 `9,12,15` 表示在 9点、12点和 15点执行。
*   `-`: 连字符用于指定范围。例如，在星期字段中使用 `1-5` 表示从星期一到星期五。
*   `/`: 斜杠用于指定步长。例如，在分钟字段中使用 `*/5` 表示每隔 5 分钟执行一次。`*/10` 在小时字段表示每隔 10 小时执行一次。

**特殊字符串（快捷方式）：**

为了方便，`cron` 也提供了一些预定义的字符串：

*   `@reboot`: 在系统启动时执行一次。
*   `@yearly` 或 `@annually`: 每年执行一次 (等同于 `0 0 1 1 *`)。
*   `@monthly`: 每月执行一次 (等同于 `0 0 1 * *`)。
*   `@weekly`: 每周执行一次 (等同于 `0 0 * * 0`)。
*   `@daily` 或 `@midnight`: 每天执行一次 (等同于 `0 0 * * *`)。
*   `@hourly`: 每小时执行一次 (等同于 `0 * * * *`)。

在大多数现代的 `cron` 实现中（尤其是广泛使用的 Vixie cron），当 **日 (Day of Month)** 和 **星期 (Day of Week)** 这两个字段都被指定（即都不是 `*`）时，任务的执行逻辑是：

**如果当前日期满足“日”字段的条件，或者满足“星期”字段的条件，那么任务就会执行。**

换句话说，它使用的是 **逻辑 OR (或者)** 的关系，而不是逻辑 AND (并且)。

**举例说明：**

假设你的 `crontab` 条目是：

```
0 0 1 * 5 /path/to/your/command
```

根据 OR 逻辑，这个任务会在以下时间执行：

1. **每个月的 1 号** (因为满足“日”字段的条件)。
2. **每个星期五** (因为满足“星期”字段的条件)。

**3. 如何管理 `crontab` 文件**

使用 `crontab` 命令来管理当前用户的定时任务。

*   **`crontab -e`**: 编辑当前用户的 `crontab` 文件。第一次执行时，系统可能会让你选择一个编辑器（如 nano, vim）。选择一个你熟悉的编辑器，然后就可以像编辑普通文本文件一样添加、修改或删除定时任务行。保存并退出编辑器后，`cron` 会自动加载新的配置。
*   **`crontab -l`**: 列出当前用户的所有定时任务。
*   **`crontab -r`**: 删除当前用户的所有定时任务。**请谨慎使用此命令，它会删除你的所有定时任务！**
*   **`crontab -v`**: 显示当前用户 `crontab` 文件上次被修改的时间（并非所有系统都支持）。

**示例：**

假设你想添加一些定时任务：

1.  打开你的 `crontab` 文件进行编辑：
    ```bash
    crontab -e
    ```
2. 在打开的编辑器中，添加以下行（每行代表一个任务）：

   *   **每分钟执行一次脚本 `/home/user/scripts/check_status.sh`：**
       ```crontab
       * * * * * /home/user/scripts/check_status.sh
       ```
   *   **每天凌晨 3:00 执行一次系统更新命令：**
       
       ```crontab
       0 3 * * * sudo apt update && sudo apt upgrade -y
       ```
       *(注意：在 crontab 中执行需要 root 权限的命令时，通常需要使用 `sudo`，并且可能需要配置 sudoers 文件允许该用户无需密码执行此命令，或者直接编辑 root 用户的 crontab (`sudo crontab -e`))。*
   *   **每周一、三、五的上午 9:30 执行一个备份脚本 `/home/user/scripts/backup.sh`：**
       ```crontab
       30 9 * * 1,3,5 /home/user/scripts/backup.sh
       ```
   *   **每月 1 号和 15 号的下午 2:00 执行一个清理脚本 `/home/user/scripts/cleanup.sh`：**
       ```crontab
       0 14 1,15 * * /home/user/scripts/cleanup.sh
       ```
   *   **每隔 10 分钟执行一个任务：**
       ```crontab
       */10 * * * * /path/to/your/command
       ```
   *   **使用特殊字符串：每天午夜执行：**
       ```crontab
       @daily /path/to/your/daily_script.sh
       ```

3.  保存并退出编辑器。系统会提示 `crontab: installing new crontab`，表示你的任务已经设置成功。

4.  你可以使用 `crontab -l` 来确认任务是否已添加：
    ```bash
    crontab -l
    ```

**4. 重要注意事项和最佳实践**

*   **环境变量：** `cron` 执行命令时的环境变量可能与你在终端中直接执行时不同。这可能导致一些命令找不到或行为异常。
    *   **解决方案：**
        *   在命令中使用绝对路径（例如 `/usr/bin/python` 而不是 `python`）。
        *   在 `crontab` 文件顶部设置 `PATH` 或其他需要的环境变量。
        *   在你的脚本中设置好所有需要的环境变量。
*   **输出：** 默认情况下，`cron` 会将命令的标准输出 (stdout) 和标准错误 (stderr) 通过邮件发送给拥有该 `crontab` 文件的用户。如果任务频繁且输出很多，这可能会导致邮箱被塞满。
    *   **解决方案：**
        *   将输出重定向到日志文件：`command >> /path/to/log.log 2>&1` (将标准输出和标准错误都追加到日志文件)。
        *   丢弃所有输出：`command > /dev/null 2>&1` (将标准输出和标准错误都发送到空设备，即丢弃)。
*   **权限：** 确保 `cron` 执行的脚本或命令具有执行权限 (`chmod +x your_script.sh`)。
*   **用户：** `crontab -e` 编辑的是当前登录用户的定时任务。如果你需要以 root 身份执行任务，可以使用 `sudo crontab -e` 来编辑 root 用户的 `crontab`。
*   **系统级 `crontab`：** 除了用户自己的 `crontab`，系统还有一个 `/etc/crontab` 文件以及 `/etc/cron.d/` 目录，用于存放系统级的定时任务。`/etc/crontab` 的格式比用户 `crontab` 多一个字段，用于指定执行任务的用户：
    ```
    分钟 小时 日 月 星期 用户 要执行的命令
    ```
    `/etc/cron.hourly/`, `/etc/cron.daily/`, `/etc/cron.weekly/`, `/etc/cron.monthly/` 目录下的脚本会分别按小时、天、周、月执行（具体执行时间由 `/etc/crontab` 或相关配置决定）。
*   **测试脚本：** 在将脚本添加到 `crontab` 之前，最好先在终端中手动执行一遍，确保它能够正常工作。
*   **日志：** 如果定时任务没有按预期执行，可以查看系统的 cron 日志（通常在 `/var/log/syslog`, `/var/log/cron`, 或使用 `journalctl -u cron` 查看，具体位置取决于你的 Linux 发行版）。

**总结**

`cron` 是一个强大且灵活的定时任务工具。通过理解 `crontab` 的格式和特殊字符，以及掌握 `crontab -e`, `-l`, `-r` 等命令，你就可以轻松地设置和管理你的自动化任务了。记住处理好环境变量和输出重定向是确保任务稳定运行的关键。

希望这篇教程对你有帮助！如果你有更具体的问题或需要设置某个特定的定时任务，随时可以问我。