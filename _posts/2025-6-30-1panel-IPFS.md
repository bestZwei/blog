---
title: 1panel部署IPFS网关（Kubo）
date: 2025-6-30 11:58:40 +0800
categories: [Tutorial] # 目前有 Demo, Tutorial, Tech, Study, idea
tags: [idea, AI, Product]
author: Zwei  # 或 authors: [Zwei, another_author]
description: "服务器部署IPFS网关教程"
image:
  path: https://testingcf.jsdelivr.net/gh/bestZwei/imgs@master/picgo/image-20250702175332067.png
permalink: '/w/deploy-ipfs-gw'  # 自定义永久链接
pin: false # 置顶文章
toc: true # 显示目录
comments: true # 允许评论
math: true # 启用数学公式
mermaid: true # 启用 Mermaid 图表
render_with_liquid: false # 禁用 Liquid 渲染
media_subpath: /blog/assets/ # 资源路径前缀

---

建议服务器配置在2C4G以上

在 1Panel 中的操作步骤：

**步骤 1: 确认 `setup_and_run.sh` 脚本已创建并有执行权限**

在 `/opt/1panel/docker/compose/ipfs/` 目录下创建了 `setup_and_run.sh` 文件，并且通过 1Panel 的文件管理给它设置了执行权限（例如 `755`）。脚本内容如下：

```bash
#!/bin/sh

# 适用于纯 IPv4 服务器的 IPFS setup_and_run.sh 脚本 (端口修改版)

# Check if the repo is initialized, if not, initialize it
if [ ! -f /data/ipfs/config ]; then
    echo "IPFS repository not found, initializing..."
    # 使用 server profile 优化，适用于服务器环境
    ipfs init --profile=server
    echo "IPFS repository initialized."
else
    echo "IPFS repository found, skipping initialization."
fi

# Configure API and Gateway addresses to listen on all IPv4 interfaces with new ports
echo "Configuring IPFS API and Gateway addresses (IPv4) with new ports..."
# 监听所有 IPv4 地址的 11114 端口 (API)
# !!! 移除 --json 标志，并修改端口为 11114 !!!
ipfs config Addresses.API /ip4/0.0.0.0/tcp/11114
# 监听所有 IPv4 地址的 11104 端口 (Gateway)
# !!! 移除 --json 标志，并修改端口为 11104 !!!
ipfs config Addresses.Gateway /ip4/0.0.0.0/tcp/11104
echo "API and Gateway addresses configured with new ports."

# Configure Swarm addresses to listen on all IPv4 interfaces (port 4001 remains)
echo "Configuring IPFS Swarm addresses (IPv4)..."
# 监听所有 IPv4 地址的 4001 端口 (TCP 和 QUIC/UDP)
# Swarm 地址是一个数组，所以这里需要 --json
ipfs config Addresses.Swarm '["/ip4/0.0.0.0/tcp/4001", "/ip4/0.0.0.0/udp/4001/quic", "/ip4/0.0.0.0/udp/4001/quic-v1"]' --json
echo "Swarm addresses configured."

# !!! IMPORTANT: Announce your public IPv4 address for Swarm and new ports !!!
# Replace <YOUR_PUBLIC_IPV4> with your actual public IPv4 address
YOUR_PUBLIC_IPV4="<YOUR_PUBLIC_IPV4>" # <--- 在这里替换成你的公共 IPv4 地址
echo "Configuring IPFS Announce addresses (IPv4) with new ports..."
# 广告你的公共 IPv4 地址和 4001 (Swarm), 11114 (API), 11104 (Gateway) 端口
# Announce 地址是一个数组，所以这里需要 --json
ipfs config Addresses.Announce '["/ip4/'"$YOUR_PUBLIC_IPV4"'/tcp/4001", "/ip4/'"$YOUR_PUBLIC_IPV4"'/udp/4001/quic", "/ip4/'"$YOUR_PUBLIC_IPV4"'/udp/4001/quic-v1", "/ip4/'"$YOUR_PUBLIC_IPV4"'/tcp/11114", "/ip4/'"$YOUR_PUBLIC_IPV4"'/tcp/11104"]' --json
echo "Announce addresses configured with new ports."

# Configure CORS headers for the API
echo "Configuring CORS headers..."
# CORS headers 是 JSON 对象，所以这里需要 --json
# !!! 更新 CORS Origin 中的本地 API 端口 !!!
ipfs config --json API.HTTPHeaders.Access-Control-Allow-Origin '["https://ipfsbed.is-an.org","https://gw.ipfsbed.is-an.org", "http://localhost:3000", "http://127.0.0.1:11114", "https://webui.ipfs.io"]'
# 允许前端使用的 HTTP 方法
ipfs config --json API.HTTPHeaders.Access-Control-Allow-Methods '["PUT", "POST", "GET"]'
# 允许携带认证信息 (如果需要的话，这里前端代码似乎不需要)
ipfs config --json API.HTTPHeaders.Access-Control-Allow-Credentials '["true"]'
echo "CORS headers configured."

# Execute the main command: start the IPFS daemon
echo "Starting IPFS daemon..."
# 使用 'exec' 确保信号 (如停止) 正确传递给守护进程
exec ipfs daemon --enable-gc --enable-pubsub-experiment
```

如果你是ipv6服务器：

```bash
#!/bin/sh

# 适用于纯 IPv6 服务器的 IPFS setup_and_run.sh 脚本 (Host Network Mode)

# Check if the repo is initialized, if not, initialize it
if [ ! -f /data/ipfs/config ]; then
    echo "IPFS repository not found, initializing..."
    # 使用 server profile 优化，适用于服务器环境
    ipfs init --profile=server
    echo "IPFS repository initialized."
else
    echo "IPFS repository found, skipping initialization."
fi

# Configure API and Gateway addresses to listen on all interfaces (IPv6 only)
echo "Configuring IPFS API and Gateway addresses (IPv6 only)..."
# 监听所有 IPv6 地址的 5001 端口 (API)
ipfs config Addresses.API '["/ip6/::/tcp/5001"]' --json
# 监听所有 IPv6 地址的 8080 端口 (Gateway)
ipfs config Addresses.Gateway '["/ip6/::/tcp/8080"]' --json
echo "API and Gateway addresses configured."

# Swarm addresses are set via IPFS_LISTEN environment variable in docker-compose.yaml in host mode
# No changes needed here, as IPFS_LISTEN will handle :: and your announced address will be specific.

# !!! IMPORTANT: Announce your public IPv6 address for Swarm !!!
# Replace <YOUR_PUBLIC_IPV6> with your actual public IPv6 address
YOUR_PUBLIC_IPV6="<YOUR_PUBLIC_IPV6>" # <--- 已经帮你填入你的公共 IPv6 地址
echo "Configuring IPFS Announce addresses (IPv6)..."
# 广告你的公共 IPv6 地址和 4001 端口 (TCP 和 QUIC/UDP)
# Announce 地址是一个数组，所以这里需要 --json
ipfs config Addresses.Announce '["/ip6/'"$YOUR_PUBLIC_IPV6"'/tcp/4001", "/ip6/'"$YOUR_PUBLIC_IPV6"'/udp/4001/quic", "/ip6/'"$YOUR_PUBLIC_IPV6"'/udp/4001/quic-v1"]' --json
echo "Announce addresses configured."

# Configure CORS headers for the API
echo "Configuring CORS headers..."
# CORS headers 是 JSON 对象，所以这里需要 --json
ipfs config --json API.HTTPHeaders.Access-Control-Allow-Origin '["*"]'
ipfs config --json API.HTTPHeaders.Access-Control-Allow-Methods '["PUT", "POST", "GET"]'
ipfs config --json API.HTTPHeaders.Access-Control-Allow-Credentials '["true"]'
echo "CORS headers configured."

# Execute the main command: start the IPFS daemon
echo "Starting IPFS daemon..."
# Use 'exec' to ensure signals are passed correctly
exec ipfs daemon --enable-gc --enable-pubsub-experiment # Add any other flags you need
```

**步骤 2: 在 1Panel 中修改 IPFS Docker Compose 配置**

我们将修改之前创建的 Compose 配置，而不是重新创建。

1.  登录你的 1Panel 面板。
2.  导航到左侧菜单的 **容器** -> **Compose**。
3.  找到你之前创建的 `ipfs` Compose 项目，点击右侧的 **编辑** 按钮。
4.  在 Compose 内容文本框中，将现有的 YAML 内容替换为以下内容。主要变化是移除了 `command`，并添加了 `entrypoint`。

    ```yaml
    version: '3.8'
    
    services:
      ipfs:
        image: ipfs/go-ipfs:latest # 使用最新的 go-ipfs 镜像
        container_name: ipfs_node
        restart: unless-stopped # 容器退出时自动重启
        networks:
          - ipfs_network # 使用一个自定义网络
    
        ports:
          # Swarm port - IPFS P2P 通信端口 (通常保持 4001)
          - "4001:4001"
          # API port - 用于与 IPFS 节点交互，前端上传将用到此端口
          - "11114:11114"
          # Gateway port - 用于通过 HTTP 访问 IPFS 内容
          - "11104:11104"
    
        volumes:
          # 持久化存储 IPFS 数据到宿主机 /opt 目录下的子目录
          - /opt/ipfs_staging:/export # 临时存储区域
          - /opt/ipfs_data:/data/ipfs # IPFS 仓库数据
          # 挂载 setup_and_run.sh 脚本到容器内部，并设置为只读
          # 宿主机路径: /opt/1panel/docker/compose/ipfs/setup_and_run.sh
          # 容器内部路径: /opt/setup_and_run.sh
          - /opt/1panel/docker/compose/ipfs/setup_and_run.sh:/opt/setup_and_run.sh:ro
    
        # 覆盖镜像的默认 ENTRYPOINT，直接执行我们的脚本
        entrypoint: /opt/setup_and_run.sh
    
    networks:
      ipfs_network:
        driver: bridge # 使用桥接网络
    
    # volumes: # Omitted as we are using host paths
    #   ipfs_staging:
    #   ipfs_data:
    ```
    
    如果你是ipv6:

```
version: '3.8'

services:
  ipfs:
    image: ipfs/go-ipfs:latest # 使用最新的 go-ipfs 镜像
    container_name: ipfs_node
    restart: unless-stopped # 容器退出时自动重启

    # !!! 修改网络模式为 host !!!
    network_mode: host

    # !!! 移除 ports 部分，因为在 host 模式下端口直接在宿主机上监听 !!!
    # ports:
    #   - "4001:4001"
    #   - "5001:5001"
    #   - "8080:8080"

    volumes:
      # 持久化存储 IPFS 数据到宿主机 /opt 目录下的子目录
      - /opt/ipfs_staging:/export # 临时存储区域
      - /opt/ipfs_data:/data/ipfs # IPFS 仓库数据
      # 挂载 setup_and_run.sh 脚本到容器内部，并设置为只读
      # 宿主机路径: /opt/1panel/docker/compose/ipfs/setup_and_run.sh
      # 容器内部路径: /opt/setup_and_run.sh
      - /opt/1panel/docker/compose/ipfs/setup_and_run.sh:/opt/setup_and_run.sh:ro

    # 覆盖镜像的默认 ENTRYPOINT，直接执行我们的脚本
    entrypoint: /opt/setup_and_run.sh
    # 移除 command，因为 entrypoint 已经指定了要执行的命令

    # 添加环境变量 (保留这个，可能有助于Go的网络行为)
    environment:
      - IP_SOCKET_VFLAGS=IPV6_V6ONLY=0
      # IPFS_LISTEN 环境变量在 host 模式下，对于纯 IPv6 环境，只保留 IPv6 监听
      - IPFS_LISTEN=/ip6/::/tcp/4001,/ip6/::/udp/4001/quic-v1

# !!! 移除 networks 定义，因为服务使用 host 网络模式 !!!
# networks:
#   ipfs_network:
#     driver: bridge
#     enable_ipv6: true

# volumes: # Omitted as we are using host paths
#   ipfs_staging:
#   ipfs_data:
```

1.  点击编辑器右上角的 **保存** 按钮。
2.  保存成功后，在 Compose 列表中找到 `ipfs`，点击右侧的 **重新部署** 按钮。
3.  等待重新部署完成。点击 **日志** 查看容器启动情况。这次你应该能看到脚本中的 `echo` 输出，并且 IPFS 守护进程应该能正常启动。

**步骤 3, 4, 5: 配置反向代理、创建静态网站、修改前端代码**

分别反代 5001、8080 端口

**步骤 6: 测试**

