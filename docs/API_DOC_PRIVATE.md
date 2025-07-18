# 私有 API 文档

本文档详细描述了用于服务器管理的私有 API 端点。所有接口都需要管理员权限并通过 JWT 进行认证。

**通用请求头:**
`Authorization: Bearer <admin_jwt_token>`

---

## 服务器管理 (Server Management)

### 1. 获取服务器状态

- **Endpoint:** `GET /serv/status`
- **描述:** 通过 RCON 获取实时的服务器信息，例如服务器名称、地图、在线人数等。
- **响应 (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "ServerName": "My Awesome Server",
      "Map": "TheIsle_Development",
      "Players": 25,
      "MaxPlayers": 100
    }
  }
  ```

### 2. 获取计划任务配置

- **Endpoint:** `GET /serv/schedules`
- **描述:** 获取在环境变量中配置的各项计划任务的执行时间。
- **响应 (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "reboot_hours": "4,16",
      "cleanup_hours": "0",
      "welcome_minutes": "30"
    }
  }
  ```

### 3. 读取 Game.ini 文件

- **Endpoint:** `GET /serv/game-ini`
- **描述:** 读取服务器 `Game.ini` 配置文件的原始内容。
- **响应 (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "content": "[/Script/TheIsle.GameSession]\nMaxPlayers=100\n..."
    }
  }
  ```

### 4. 写入 Game.ini 文件

- **Endpoint:** `POST /serv/game-ini`
- **描述:** 将新的内容写入服务器的 `Game.ini` 配置文件。**这是一个高危操作。**
- **请求体:**
  ```json
  {
    "content": "[/Script/TheIsle.GameSession]\nMaxPlayers=120"
  }
  ```
- **响应 (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "message": "Game.ini 文件写入成功。"
    }
  }
  ```

### 5. 发送游戏内广播

- **Endpoint:** `POST /serv/cast`
- **请求体:** `{"message": "服务器将在5分钟后重启"}`
- **响应 (200 OK):** `{"success": true, "data": "Broadcast sent"}`

### 6. 发送 KOOK 公告

- **Endpoint:** `POST /serv/kook`
- **请求体:** `{"message": "今晚8点有活动！"}`
- **响应 (200 OK):** `{"success": true, "data": "Announcement sent"}`

### 7. 保存游戏世界

- **Endpoint:** `POST /serv/save`
- **响应 (200 OK):** `{"success": true, "data": "World saved"}`

### 8. 清理服务器

- **Endpoint:** `POST /serv/clean`
- **响应 (200 OK):** `{"success": true, "data": "Cleanup successful"}`

### 9. 手动触发重启

- **Endpoint:** `POST /serv/reboot`
- **响应 (200 OK):** `{"success": true, "data": "Reboot sequence initiated"}`

---

## 用户管理 (User Management)

### 1. 获取用户列表

- **Endpoint:** `GET /users/list`
- **描述:** 获取已注册的用户列表，支持按 ID 和名称搜索，并支持分页。
- **查询参数:**
  - `id` (string, optional): 按 SteamID 模糊搜索。
  - `name` (string, optional): 按用户昵称模糊搜索。
  - `page` (integer, optional, default: 1): 页码。
  - `pageSize` (integer, optional, default: 10): 每页数量。
- **响应 (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "list": [
        {
          "id": "76561198000000001",
          "name": "PlayerName",
          "points": 150,
          "is_admin": 1
        }
      ],
      "total": 1
    }
  }
  ```

### 2. 获取用户详情

- **Endpoint:** `GET /users/detail`
- **描述:** 获取单个用户的聚合信息，包括基本信息、存档数据、击杀/被杀记录和聊天记录。
- **查询参数:** `id` (string, required): 用户的 SteamID64。
- **响应 (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "playerInfo": { ... },
      "saveData": { ... },
      "killsAsKiller": [ ... ],
      "killsAsVictim": [ ... ],
      "chats": [ ... ]
    }
  }
  ```

### 3. 更新用户信息

- **Endpoint:** `POST /users/update`
- **描述:** 更新用户的特定信息，目前主要用于修改用户积分。
- **请求体:**
  ```json
  {
    "id": "76561198000000001",
    "points": 500
  }
  ```
- **响应 (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "message": "用户信息更新成功。"
    }
  }
  ```

---

## 在线玩家管理 (Online Players)

### 1. 获取在线玩家列表

- **Endpoint:** `GET /online/list`
- **描述:** 获取当前在游戏中的玩家列表，并标注每个玩家是否已在本系统中注册。
- **响应 (200 OK):**
  ```json
  {
    "success": true,
    "data": [
      {
        "PlayerID": "76561198000000001",
        "PlayerName": "PlayerName",
        "isRegistered": true
      },
      {
        "PlayerID": "76561198000000009",
        "PlayerName": "AnotherPlayer",
        "isRegistered": false
      }
    ]
  }
  ```

### 2. 踢出玩家

- **Endpoint:** `POST /online/kick`
- **请求体:**
  ```json
  {
    "id": "76561198000000009",
    "reason": "AFK"
  }
  ```
- **响应 (200 OK):** `{"success": true, "data": "Player kicked"}`

### 3. 封禁玩家

- **Endpoint:** `POST /online/ban`
- **请求体:**
  ```json
  {
    "id": "76561198000000009",
    "name": "Cheater",
    "reason": "Hacking",
    "time": "24h"
  }
  ```
- **响应 (200 OK):** `{"success": true, "data": "Player banned"}`

### 4. 发送私信

- **Endpoint:** `POST /online/msg`
- **请求体:**
  ```json
  {
    "id": "76561198000000001",
    "message": "Please follow the rules."
  }
  ```
- **响应 (200 OK):** `{"success": true, "data": "Message sent"}`

---

## 封禁管理 (Ban Management)

### 1. 获取封禁列表

- **Endpoint:** `GET /bans/list`
- **描述:** 获取所有的封禁记录，支持分页和筛选。
- **查询参数:**
  - `ids` (string, optional): 按被封禁者的 SteamID 筛选。
  - `created_by` (string, optional): 按创建者的 SteamID 筛选。
  - `state` (integer, optional): 按状态筛选 (0: 投票中, 1: 已批准, 2: 已否决, 3: 已撤销)。
  - `page` (integer, optional, default: 1): 页码。
  - `pageSize` (integer, optional, default: 10): 每页数量。
- **响应 (200 OK):** (结构与公共 API 的封禁列表类似)

### 2. 获取封禁详情

- **Endpoint:** `GET /bans/detail`
- **描述:** 获取单个封禁记录的详细信息，包括投票者列表。
- **查询参数:** `id` (integer, required): 封禁记录的唯一 ID。
- **响应 (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "id": 1,
      "ids": "76561198000000002",
      // ...其他字段
      "supporters": [{"id": "76561198000000001", "name": "Voter1"}],
      "opponents": []
    }
  }
  ```

### 3. 批准封禁

- **Endpoint:** `POST /bans/approve`
- **描述:** 管理员直接批准一个封禁提议，并执行封禁流程。
- **请求体:** `{"id": 1}`
- **响应 (200 OK):** `{"success": true, "data": {"message": "封禁已由管理员批准并执行。"}}`

### 4. 否决封禁

- **Endpoint:** `POST /bans/reject`
- **描述:** 管理员直接否决一个封禁提议。
- **请求体:** `{"id": 1}`
- **响应 (200 OK):** `{"success": true, "data": {"message": "封禁已由管理员否决。"}}`

### 5. 撤销封禁

- **Endpoint:** `POST /bans/revoke`
- **描述:** 管理员撤销一个已生效或已否决的封禁记录。
- **请求体:** `{"id": 1}`
- **响应 (200 OK):** `{"success": true, "data": {"message": "封禁记录已由管理员撤销。"}}`

---

## 日志查询 (Logs)

### 1. 查询击杀日志

- **Endpoint:** `GET /logs/kills`
- **查询参数:**
  - `killerid` (string, optional): 按击杀者 SteamID 筛选。
  - `killedid` (string, optional): 按被杀者 SteamID 筛选。
  - `page` (integer, optional, default: 1): 页码。
  - `pageSize` (integer, optional, default: 10): 每页数量。
- **响应 (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "list": [ ... ],
      "total": 50
    }
  }
  ```

### 2. 查询聊天日志

- **Endpoint:** `GET /logs/chats`
- **查询参数:**
  - `id` (string, optional): 按发送者 SteamID 筛选。
  - `groupid` (string, optional): 按聊天频道 ID 筛选。
  - `page` (integer, optional, default: 1): 页码。
  - `pageSize` (integer, optional, default: 10): 每页数量。
- **响应 (200 OK):** (结构与击杀日志类似)

