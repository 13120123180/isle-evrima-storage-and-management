# 公共 API 文档

本文档详细描述了面向玩家的公共 API 端点。

## 认证 (Authentication)

### 1. 用户登录

- **Endpoint:** `POST /auth/login`
- **描述:** 使用 SteamID 和密码进行身份验证，成功后返回用于后续请求的 JWT (JSON Web Token)。
- **请求头:**
  - `Content-Type: application/json`
- **请求体 (Request Body):**

  ```json
  {
    "id": "76561198000000001",
    "password": "your_password"
  }
  ```

- **参数说明:**
  - `id` (string, required): 用户的 SteamID64。
  - `password` (string, required): 用户设置的密码。

- **响应 (Responses):**

  - **`200 OK` - 登录成功**

    ```json
    {
      "success": true,
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Ij..."
    }
    ```

  - **`401 Unauthorized` - 登录失败**

    ```json
    {
      "success": false,
      "message": "密码不正确或用户不存在。"
    }
    ```

### 2. 用户登出

- **Endpoint:** `POST /auth/logout`
- **描述:** 通知服务器用户登出。这是一个象征性的操作，实际的登出由客户端负责销毁本地存储的 Token。
- **请求头:**
  - `Authorization: Bearer <jwt_token>`
- **响应 (Responses):**

  - **`200 OK` - 登出成功**

    ```json
    {
      "success": true,
      "message": "登出成功。"
    }
    ```

---

## 玩家 (Players)

所有此分类下的接口都需要在请求头中提供 JWT 进行认证: `Authorization: Bearer <jwt_token>`

### 1. 获取当前用户信息

- **Endpoint:** `GET /players/me`
- **描述:** 获取当前登录用户的详细信息，包括积分、签到状态等。
- **响应 (Responses):**

  - **`200 OK` - 获取成功**

    ```json
    {
      "success": true,
      "data": {
        "id": "76561198000000001",
        "name": "PlayerName",
        "points": 150,
        "signindate": "2023-10-27",
        "signintimes": 5,
        "is_admin": 0
      }
    }
    ```
    **字段说明:**
    - `id` (string): SteamID64。
    - `name` (string): 玩家昵称。
    - `points` (integer): 玩家拥有的积分。
    - `signindate` (string): 上次签到日期 (YYYY-MM-DD)。
    - `signintimes` (integer): 连续签到天数。
    - `is_admin` (integer): 是否为管理员 (0: 否, 1: 是)。

  - **`500 Internal Server Error` - 获取失败**
    - **原因:** Token 有效，但在数据库中找不到对应的用户记录。
    ```json
    {
      "success": false,
      "message": "未在数据库中找到与您的Token匹配的用户。"
    }
    ```

### 2. 每日签到

- **Endpoint:** `POST /players/me/signin`
- **描述:** 玩家进行每日签到以获取积分。服务器会根据连续签到天数计算奖励。
- **响应 (Responses):**

  - **`200 OK` - 签到成功**

    ```json
    {
      "success": true,
      "data": {
        "message": "签到成功！连续签到 6 天，获得 30 积分。",
        "points": 180
      }
    }
    ```

  - **`500 Internal Server Error` - 操作失败**
    - **原因 1: 重复签到**
      ```json
      {
        "success": false,
        "message": "今日已签到，请勿重复操作。"
      }
      ```
    - **原因 2: 未找到玩家**
      ```json
      {
        "success": false,
        "message": "未找到该玩家。"
      }
      ```

---

## 角色 (Character)

所有此分类下的接口都需要在请求头中提供 JWT 进行认证: `Authorization: Bearer <jwt_token>`

### 1. 获取角色详情

- **Endpoint:** `GET /character/`
- **描述:** 获取当前用户当前所玩角色的详细信息。
- **响应 (Responses):**

  - **`200 OK` - 获取成功**

    ```json
    {
      "success": true,
      "data": {
        "class": "Giganotosaurus",
        "className": "南方巨兽龙",
        "cost": 100,
        "gender": "雌性",
        "growth": "100%",
        "health": 1200
      }
    }
    ```
    **字段说明:**
    - `class` (string): 角色物种的内部类名。
    - `className` (string): 角色物种的中文名。
    - `cost` (integer): 该物种的成本（用于点大或回收计算）。
    - `gender` (string): 角色性别 ("雌性" / "雄性" / "未知")。
    - `growth` (string): 角色成长度 (例如 "85%")。
    - `health` (number): 角色当前生命值。

  - **`500 Internal Server Error` - 未找到存档**

    ```json
    {
      "success": false,
      "message": "未找到存档文件。"
    }
    ```

### 2. 删除角色存档

- **Endpoint:** `DELETE /character/`
- **描述:** 删除当前用户的角色存档文件。这是一个不可逆的操作。
- **响应 (Responses):**

  - **`200 OK` - 删除成功**

    ```json
    {
      "success": true,
      "data": {
        "message": "存档已删除。"
      }
    }
    ```

### 3. 回收角色存档

- **Endpoint:** `POST /character/sell`
- **描述:** 将当前角色的存档回收，以换取积分。只有成长度达到特定标准（例如 85%）的角色才能被回收。
- **响应 (Responses):**

  - **`200 OK` - 回收成功**

    ```json
    {
      "success": true,
      "data": {
        "message": "回收成功，并获得50积分",
        "points": 50
      }
    }
    ```

  - **`500 Internal Server Error` - 操作失败**
    - **原因 1: 无存档可回收**
      ```json
      {
        "success": false,
        "message": "无存档可回收。"
      }
      ```
    - **原因 2: 成长度不足**
      ```json
      {
        "success": false,
        "message": "成长度低于0.85，无法回收。"
      }
      ```

### 4. 角色成长 (点大)

- **Endpoint:** `POST /character/grow`
- **描述:** 消耗与角色物种成本相等的积分，将角色直接成长到成年阶段。
- **响应 (Responses):**

  - **`200 OK` - 操作成功**

    ```json
    {
      "success": true,
      "data": {
        "message": "点大成功，消耗积分100"
      }
    }
    ```

  - **`500 Internal Server Error` - 操作失败**
    - **原因 1: 积分不足**
      ```json
      {
        "success": false,
        "message": "积分不足，需要 100 积分。"
      }
      ```
    - **原因 2: 存档服务通信失败**
      ```json
      {
        "success": false,
        "message": "与存档服务通信时发生错误，请稍后再试。"
      }
      ```

---

## 封禁提议 (Ban Proposals)

所有此分类下的接口都需要在请求头中提供 JWT 进行认证: `Authorization: Bearer <jwt_token>`

### 1. 获取封禁提议列表

- **Endpoint:** `GET /ban/`
- **描述:** 获取社区的封禁提议列表，支持分页和筛选。
- **查询参数 (Query Parameters):**
  - `page` (integer, optional, default: 1): 页码。
  - `pageSize` (integer, optional, default: 10): 每页数量。
  - `ids` (string, optional): 按被提议人的 SteamID 筛选。
  - `state` (integer, optional): 按提议状态筛选 (0: 投票中, 1: 已批准, 2: 已否决, 3: 已撤销)。
  - `witness` (string, optional): 按提议人 (见证者) 的 SteamID 筛选。
- **响应 (Responses):**

  - **`200 OK` - 获取成功**

    ```json
    {
      "success": true,
      "data": {
        "list": [
          {
            "id": 1,
            "ids": "76561198000000002",
            "reason": "使用外挂",
            "video": "http://example.com/video.mp4",
            "type": "kaigua",
            "time": "2023-10-27T10:00:00.000Z",
            "state": 0,
            "witness": "76561198000000001",
            "supporter": "",
            "opponent": ""
          }
        ],
        "total": 1
      }
    }
    ```

### 2. 创建封禁提议

- **Endpoint:** `POST /ban/`
- **描述:** 创建一个新的封禁提议，提交给社区投票。
- **请求体 (Request Body):**

  ```json
  {
    "ids": "76561198000000002,76561198000000003",
    "reason": "恶意组队并使用外挂",
    "video": "http://example.com/evidence.mp4",
    "type": "kaigua",
    "time": "2023-10-27T10:00:00.000Z"
  }
  ```

- **参数说明:**
  - `ids` (string, required): 被提议人的 SteamID64，多个 ID 用逗号分隔。
  - `reason` (string, required): 提议原因。
  - `video` (string, optional): 证据视频链接。
  - `type` (string, required): 封禁类型 (例如: `kaigua`, `bug`)。
  - `time` (string, required): 提议时间 (ISO 8601 格式)。

- **响应 (Responses):**

  - **`200 OK` - 创建成功**

    ```json
    {
      "success": true,
      "data": {
        "id": 2,
        "ids": "76561198000000002,76561198000000003",
        // ... 其他字段
      }
    }
    ```

### 3. 获取特定封禁提议详情

- **Endpoint:** `GET /ban/:id`
- **描述:** 根据提议 ID 获取其详细信息。
- **路径参数 (Path Parameters):**
  - `id` (integer, required): 封禁提议的唯一 ID。
- **响应 (Responses):**

  - **`200 OK` - 获取成功** (返回单个提议对象，结构同列表中的对象)

  - **`500 Internal Server Error` - 未找到记录**
    ```json
    {
      "success": false,
      "message": "未找到该封禁记录。"
    }
    ```

### 4. 为封禁提议投票

- **Endpoint:** `POST /ban/:id/vote`
- **描述:** 对一个正在投票中的封禁提议进行投票。
- **路径参数 (Path Parameters):**
  - `id` (integer, required): 封禁提议的唯一 ID。
- **请求体 (Request Body):**

  ```json
  {
    "voteType": "approve"
  }
  ```

- **参数说明:**
  - `voteType` (string, required): 投票类型。必须是 `"approve"` (赞成) 或 `"oppose"` (反对)。

- **响应 (Responses):**

  - **`200 OK` - 投票成功**

    ```json
    {
      "success": true,
      "data": {
        "message": "投票成功！",
        "state": 0
      }
    }
    ```
    **字段说明:**
    - `state` (integer): 投票后的提议状态 (0: 仍在投票中, 1: 投票通过, 2: 投票失败)。

  - **`500 Internal Server Error` - 操作失败**
    - **原因 1: 投票已结束**
      ```json
      {
        "success": false,
        "message": "投票已结束。"
      }
      ```

### 5. 撤销封禁

- **Endpoint:** `POST /ban/:id/revoke`
- **描述:** (此接口通常由管理员使用，但在公共路由中也存在) 撤销一个封禁。
- **路径参数 (Path Parameters):**
  - `id` (integer, required): 封禁记录的唯一 ID。
- **响应 (Responses):**

  - **`200 OK` - 撤销成功**

    ```json
    {
      "success": true,
      "data": {
        "changes": 1
      }
    }
    ```
