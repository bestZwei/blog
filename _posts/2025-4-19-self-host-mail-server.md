---
title: 1Panel 搭建内网邮件服务器
date: 2025-4-19 12:58:40 +0800
categories: [Tech] # 目前有 Demo, Tutorial, Tech, Study
tags: [邮箱, 1Panel, 笔记]
author: Zwei  # 或 authors: [Zwei, another_author]
description: "1Panel 快速搭建内网邮件服务器 (以 zwei.de.eu.org 为例)"
image:
  path: https://testingcf.jsdelivr.net/gh/bestZwei/imgs@master/picgo/image-20250419150128244.png
permalink: '/w/setup-mailserver'  # 自定义永久链接
pin: false # 置顶文章
toc: true # 显示目录
comments: true # 允许评论
math: true # 启用数学公式
mermaid: true # 启用 Mermaid 图表
render_with_liquid: false # 禁用 Liquid 渲染
media_subpath: /blog/assets/ # 资源路径前缀
---

### 1Panel 快速搭建内网邮件服务器 (以 zwei.de.eu.org 为例)

本文档将指导你使用 1Panel 平台，通过其应用商店快速部署和配置内网邮件服务器 Maddy Mail Server。Maddy 是一款现代化的邮件服务器，以其简洁性、易用性以及对 SMTP 和 IMAP 协议的支持而著称，能够高效地处理企业内部的邮件通信。本文以 `zwei.de.eu.org` 域名为例进行说明。

**前置准备**

1.  **一台已安装 1Panel 的服务器：** 确保你的服务器已经安装了 1Panel 面板。详细安装步骤请参考 [1Panel 官方安装文档](https://1panel.cn/docs/installation/online_install/)。安装完成后，通过浏览器访问你的服务器 IP 地址或域名，进入 1Panel 管理界面。
2.  **一个域名：** 用于邮件服务，例如本文中的 `zwei.de.eu.org`。你需要有该域名的 DNS 管理权限（例如在 Cloudflare）。
3.  **（推荐）域名对应的泛域名或主域名 SSL/TLS 证书：** 虽然可以在安装 Maddy 后单独申请，但提前准备好证书文件会更方便。可以在 1Panel 的证书管理中申请 Let's Encrypt 证书。

**1. 安装 Maddy Mail Server 应用**

在 1Panel 管理界面，导航至 **应用商店**，搜索 "Maddy Mail Server"，然后点击 **安装**。

根据你的需求填写安装配置信息：

* **名称：** 应用名称（自定义）。
* **版本：** 选择所需版本。
* **SMTP 入站端口：** 接收外部邮件的端口，通常为 `25`。
* **IMAP4 端口：** 未加密的 IMAP 连接端口，通常为 `143`。
* **IMAPS 端口：** 加密的 IMAP 连接端口，通常为 `993`。
* **SMTP 提交端口 (SMTPS)：** 用于客户端加密提交邮件的端口，通常为 `465`。
* **SMTP 提交端口 (STARTTLS)：** 使用 STARTTLS 加密的客户端提交邮件端口，通常为 `587`。
* **邮箱 MX 主机名：** 你的邮件服务器主机名，将用于 DNS MX 记录。**请使用一个子域名，例如 `mail.zwei.de.eu.org`**，不要直接使用主域名 `@` 或 `zwei.de.eu.org`。
* **邮箱域名：** 你的邮件服务器服务的域名，即您的主域名 **`zwei.de.eu.org`**。
* **容器名称、CPU/内存限制、端口外部访问：** 根据需要自定义和配置。

填写完毕后，点击 **确认安装**。

**安装失败与证书问题处理：**

初次安装可能会失败，查看日志会发现类似 `failed to load /data/tls/fullchain.pem and /data/tls/privkey.pem: open /data/tls/fullchain.pem: no such file or directory` 的错误。这是因为 Maddy 容器启动时需要加载 TLS 证书文件，但它们在容器内的默认位置 (`/data/tls/`) 尚未存在。

现在我们将之前获取的 SSL/TLS 证书文件上传到 Maddy 容器可以访问的位置。Maddy 应用通过 Docker Volume 将宿主机的 `/var/lib/docker/volumes/maddydata/_data` 映射到容器内的 `/data` 目录。

1. 使用 1Panel 的文件管理功能（位于左侧菜单）或通过 SSH 连接到你的服务器。

2. 导航到 Maddy 数据卷的 TLS 目录：`/var/lib/docker/volumes/maddydata/_data/tls`。如果 `tls` 目录不存在，请手动创建。

3. 将你之前下载的 `fullchain.pem` 和 `privkey.pem` 证书文件上传到此目录下。

   - **重要：** 确保文件名与 Maddy 配置中指定的文件名完全一致（默认为 `fullchain.pem` 和 `privkey.pem`）。
   - <img src="https://testingcf.jsdelivr.net/gh/bestZwei/imgs@master/picgo/image-20250419143741132.png" alt="image-20250419143741132" style="zoom:80%;" />

4. 上传完成后，回到 1Panel 的应用商店，找到 Maddy 应用。如果它还没有自动启动，尝试手动启动或重启它。Maddy 容器应该能够成功加载证书并正常运行。

   <img src="https://testingcf.jsdelivr.net/gh/bestZwei/imgs@master/picgo/image-20250419143802949.png" alt="image-20250419143802949" style="zoom:67%;" />

**2. 获取 DKIM 私钥**

DKIM (DomainKeys Identified Mail) 是一种验证邮件来源、防止邮件被篡改的重要技术。Maddy 在启动时会自动生成 DKIM 密钥对。

1. 当 Maddy Mail Server 容器正常运行后，使用 1Panel 的文件管理功能或 SSH。

2. 导航至 Maddy 数据卷的 DKIM 密钥目录：`/var/lib/docker/volumes/maddydata/_data/dkim_keys`。

3. 在该目录下，你会找到一个以您的域名和选择器（默认为 `default`）命名的文件，例如 `zwei.de.eu.org_default.dns`。

   <img src="https://testingcf.jsdelivr.net/gh/bestZwei/imgs@master/picgo/image-20250419144041095.png" alt="image-20250419144041095" style="zoom:67%;" />

4. 打开并复制该文件的全部内容。这些内容将用于配置您的域名 DNS 解析。它通常是一个 TXT 记录的值，格式类似： `"v=DKIM1; h=sha256; k=rsa; p=MIIBIj..."`

**3. 配置 DNS 解析 (在 Cloudflare 中操作)**

为了使你的邮件服务器能够正常接收和发送邮件，并提高邮件的送达率和安全性，你需要在你的域名 DNS 管理后台（Cloudflare）配置以下记录。

登录 Cloudflare，选择 `zwei.de.eu.org` 域名，进入 **DNS** -> **记录** 页面，添加以下记录：

：

| 主机记录             | 记录类型 | 记录值                                                       | 说明                                                         |
| -------------------- | -------- | ------------------------------------------------------------ | ------------------------------------------------------------ |
| `default._domainkey` | `TXT`    | 粘贴您在步骤 3.3 中获取的 `xxx_default.dns` 文件内容。       | DKIM 记录，用于验证外发邮件的真实性。                        |
| `mail`               | `A`      | 您的服务器 IPv4 地址。                                       | 指向您的邮件服务器主机名的 A 记录。                          |
| `@`                  | `A`      | 您的服务器 IPv4 地址。                                       | 域名的主 A 记录。                                            |
| `mail`               | `AAAA`   | 您的服务器 IPv6 地址（如果您的服务器有且配置了 IPv6）。      | 指向您的邮件服务器主机名的 AAAA 记录。                       |
| `@`                  | `AAAA`   | 您的服务器 IPv6 地址（如果您的服务器有且配置了 IPv6）。      | 域名的主 AAAA 记录。                                         |
| `@`                  | `MX`     | `mail.zwei.de.eu.org.` (优先级 10)                           | MX (Mail Exchanger) 记录，指定接收域 `@zwei.de.eu.org` 邮件的服务器地址。`mail.zwei.de.eu.org.` 后面的点是可选的，但在某些 DNS 系统中是标准写法。优先级数值小的更优先。 |
| `@`                  | `TXT`    | `v=spf1 mx ~all`                                             | SPF (Sender Policy Framework) 记录，列出允许代表您的域名发送邮件的服务器。`mx` 表示允许 MX 记录中列出的服务器发送，`~all` 表示其他来源的邮件标记为软失败（SoftFail）。 |
| `_dmarc`             | `TXT`    | `v=DMARC1; p=quarantine; rua=mailto:postmaster@zwei.de.eu.org;` | DMARC 记录，基于 SPF 和 DKIM 增强邮件安全性。`p=quarantine` 表示不通过 SPF/DKIM 检查的邮件标记为隔离。`rua` 指定接收聚合报告的邮箱地址（推荐使用）。您可以根据需要修改 `p` 和报告邮箱。建议从 `p=none` 开始测试。 |
| `_mta-sts`           | `TXT`    | `v=STSv1; id=YYYYMMDDHHMMSS;`                                | MTA-STS 策略指示器记录。`id` 部分请替换为一个当前的、独特的标识符，通常使用当前的日期和时间（例如：`20250418200000`）。每次更新 MTA-STS 策略文件时，请务必更新此 ID。 |
| `mta-sts`            | `A`      | 托管 MTA-STS 策略文件的 Web 服务器的 IPv4 地址。             | 指向托管 MTA-STS 策略文件的子域名 `mta-sts.zwei.de.eu.org` 的 A 记录。**在 Cloudflare 中设置此记录时，请确保关闭代理（橙色云变灰色，仅 DNS）。** |
| `mta-sts`            | `AAAA`   | 托管 MTA-STS 策略文件的 Web 服务器的 IPv6 地址（如果有）。   | 指向托管 MTA-STS 策略文件的子域名 `mta-sts.zwei.de.eu.org` 的 AAAA 记录。**在 Cloudflare 中设置此记录时，请确保关闭代理（橙色云变灰色，仅 DNS）。** |
| `_smtp._tls`         | `TXT`    | `v=TLSRPTv1; rua=mailto:postmaster@zwei.de.eu.org;`          | TLS 报告记录，用于接收 TLS 连接失败的报告。`rua` 指定接收报告的邮箱地址（通常与 DMARC 报告邮箱相同）。 |

**注意：** DNS 记录更新需要时间在全球生效，通常需要几分钟到几小时不等。

对了，建议进入 Cloudflare-电子邮件-DMARC 管理 页面，优化 _dmarc 记录。

![image-20250419145358011](https://testingcf.jsdelivr.net/gh/bestZwei/imgs@master/picgo/image-20250419145358011.png)

**4. 配置 MTA-STS 策略文件托管 (使用 1Panel Web 服务)**

MTA-STS 要求在 `https://mta-sts.zwei.de.eu.org/.well-known/mta-sts.txt` 提供策略文件。

1.  **创建策略文件：**`mta-sts.txt` 文件内容如下：
    
    ```
    version: STSv1
    mode: testing
    mx: mail.zwei.de.eu.org
    max_age: 604800
    ```
    * `mode: testing` 是推荐的初始模式。测试无误后，可以改为 `enforce`。
    * `mx: mail.zwei.de.eu.org` 必须与您的 MX 记录指向的主机名一致。
    * `max_age: 604800` 为 7 天的缓存时间。
    
2.  **在 1Panel 中创建网站：**
    * 进入“网站”或“站点管理”，点击“创建网站”。
    
    * 域名填写 `mta-sts.zwei.de.eu.org`。
    
    * 选择静态网站，进入网站目录，创建 `.well-known` 文件夹 ，在里面上传 `mta-sts.txt` 文件。

      <img src="https://testingcf.jsdelivr.net/gh/bestZwei/imgs@master/picgo/image-20250419144639724.png" alt="image-20250419144639724" style="zoom:80%;" />
    
      <img src="https://testingcf.jsdelivr.net/gh/bestZwei/imgs@master/picgo/image-20250419144851540.png" alt="image-20250419144851540" style="zoom:67%;" />
    
      <img src="https://testingcf.jsdelivr.net/gh/bestZwei/imgs@master/picgo/image-20250419144901779.png" alt="image-20250419144901779" style="zoom:67%;" />
    
3.  **为 `mta-sts.zwei.de.eu.org` 申请 SSL 证书：**
    * 在 1Panel 中找到刚创建的 `mta-sts.zwei.de.eu.org` 网站设置。
    * 找到 SSL/TLS 或证书选项。
    * 使用 1Panel 集成的 Let's Encrypt 申请证书。确保前面在 Cloudflare 中添加的 `mta-sts` A/AAAA 记录已生效并指向您的服务器，以便 Let's Encrypt 可以完成域名验证。
    * 申请成功后，确保证书已启用，并设置强制 HTTPS。

**5. 创建邮箱账户**

现在，您需要在 Maddy Mail Server 容器内使用其命令行工具创建实际的邮箱账户。

1.  在 1Panel 管理界面，找到您安装的 Maddy Mail Server 应用。
2.  点击应用名称，进入详情页，选择 **进入容器终端**。
3.  在容器终端中，执行以下命令创建邮箱账户（例如创建一个 `zwei@zwei.de.eu.org` 的账户）：

    ```bash
    # 创建登录账户 (用于 SMTP 和 IMAP 认证)
    maddy creds create mail@zwei.de.eu.org
    # 系统会提示你输入并确认该账户的密码
    ```

    ```bash
    # 创建存储账户 (用于 IMAP 访问邮箱，通常与登录账户同名)
    maddy imap-acct create mail@zwei.de.eu.org
    ```

    **常用 Maddy CLI 命令：**

    ```bash
    # 查看已创建的登录账户列表
    maddy creds list
    ```

    ```bash
    # 查看已创建的存储账户列表
    maddy imap-acct list
    ```

    ```bash
    # 查看指定账户下的邮箱文件夹 (默认有 INBOX)
    maddy imap-mboxes list zwei@zwei.de.eu.org
    ```

    ```bash
    # 查看指定邮箱文件夹下的邮件 (例如收件箱)
    maddy imap-msgs list zwei@zwei.de.eu.org INBOX
    ```

    **注意：** 将 `mail@zwei.de.eu.org` 替换为您想要创建的实际邮箱地址，记得创建收集收发件错误的管理账号 `postmaster@zwei.de.eu.org`。

**6. 测试与验证**

1.  **DNS 记录验证：** 使用在线 DNS 检查工具（例如 `dnschecker.org`）检查您的所有 DNS 记录（A, AAAA, MX, TXT - SPF, DKIM, DMARC, _mta-sts, _smtp._tls）是否已全球生效，并且值正确。
2.  **MTA-STS 验证：** 使用 MTA-STS 专门的在线检查工具（例如 https://mxtoolbox.com/mta-sts.aspx）检查您的 MTA-STS 配置是否正确，包括 TXT 记录、策略文件内容和 HTTPS 证书。
3.  **邮件收发测试：** 使用其他邮箱向您创建的新邮箱账户（例如 `mail@zwei.de.eu.org`）发送一封测试邮件。
4.  **客户端连接测试：** 使用邮件客户端（如 Outlook, Thunderbird,手机邮件 App）配置您的邮箱账户，尝试使用 IMAPS (993) 和 SMTPS (465) 或 SMTP with STARTTLS (587) 连接并收发邮件，验证 TLS 加密是否正常工作。

通过以上步骤，您应该可以在 1Panel 上成功搭建并配置一个基本的内网邮件服务器，并开启重要的安全特性如 SPF, DKIM, DMARC, MTA-STS。

最后，邮箱综合测试工具：https://mecsa.jrc.ec.europa.eu，你如果需要添加 DNSSEC 记录，需要前往你的域名服务商开启此功能。