# Isle Evrima Storage And Management

本项目为“Isle Evrima”游戏服务器提供了一个全面的后端和前端解决方案。它包括玩家认证、角色管理、服务器管理等功能。

## 功能

- **玩家认证:** 为玩家提供安全的登录。
- **角色管理:** 查看、删除、出售和发展游戏内角色。
- **每日签到:** 玩家可以每日签到以赚取积分。
- **封禁系统:** 提议、投票和管理玩家封禁。
- **管理后台:** 用于服务器管理的私有 GUI。
- **RCON 集成:** 远程执行服务器命令。
- **KOOK 集成:** 向 KOOK 发送服务器公告。
- **计划任务:** 自动重启和清理服务器。
- **API 文档:** 为公共和私有端点提供详细的 API 文档。

## 项目结构

该项目是一个包含以下包的 monorepo：

- `packages/backend`: Node.js 后端服务器。
- `packages/private_gui`: 用于管理后台的 Vue.js 前端。
- `packages/public_gui`: 用于面向公众的玩家门户的 Vue.js 前端。

## 安装

1. **克隆仓库:**

   ```bash
   git clone https://github.com/your-username/isle-evrima-storage-and-management.git
   cd isle-evrima-storage-and-management
   ```

2. **为所有包安装依赖:**
   ```bash
   yarn install
   ```

## 配置

1. **后端:**

   - 导航到 `packages/backend`。
   - 通过复制 `.env.dev` 创建一个 `.env.prod` 文件。
   - 使用您的服务器配置更新 `.env.prod` 中的环境变量。

2. **前端:**
   - 前端应用程序已配置为连接到后端 API。

## 运行应用

1. **启动后端服务器:**

   ```bash
   cd packages/backend
   yarn start
   ```

2. **构建并提供前端应用:**

   - **私有 GUI (管理后台):**
     ```bash
     cd packages/private_gui
     yarn build
     # 使用静态服务器提供 'dist' 文件夹。
     ```
   - **公共 GUI (玩家门户):**
     ```bash
     cd packages/public_gui
     yarn build
     # 使用静态服务器提供 'dist' 文件夹。
     ```

3. **注册为 windows 服务:**

   ```bash
   yarn install
   yarn uninstall
   ```

4. **管理 windows 服务:**

   - **PowerShell**

     ```bash
     net start iesam
     net stop iesam
     ```

   - **CMD**
     ```bash
     sc start iesam
     sc stop iesam
     ```

## API 文档

- **公共 API:** 查看 `docs/API_DOC_PUBLIC.md`
- **私有 API:** 查看 `docs/API_DOC_PRIVATE.md`
