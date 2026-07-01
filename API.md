# API Specifications

RESTful API specifications for frontend-backend communication in the "WIP" platform.

## Base URL
`/api`

---

## 1. Authentication

### `POST /auth/signup`
- **Description**: Registers a new user.
- **Request Body**: `{ "email": "...", "nickname": "...", "password": "..." }`
- **Response**: `{ "user": { "id": "...", "nickname": "..." } }`

### `POST /auth/login`
- **Description**: Authenticates via email/password and returns a token.
- **Request Body**: `{ "email": "...", "password": "..." }`
- **Response**: `{ "user": { ... }, "token": "..." }`

### `POST /auth/logout`
- **Description**: Terminates the current session.

### `GET /auth/me`
- **Description**: Retrieves the currently authenticated user's profile.

---

## 2. Channels

### `GET /channels`
- **Description**: Retrieves a list of channels the current user is a member of (excludes DMs).

### `POST /channels`
- **Description**: Creates a new channel.
- **Request Body**: `{ "name": "...", "description": "...", "type": "public" | "private" }`

### `GET /channels/:channelId`
- **Description**: Retrieves detailed information for a specific channel.

### `POST /channels/:channelId/join`
- **Description**: Joins a channel or invites a user to it.

---

## 3. Direct Messages (DMs)

### `GET /dms`
- **Description**: Retrieves a list of active Direct Message conversations for the current user.
- **Response**: Array of channel objects with `type: "dm"` and participant details.
- **Note**: This endpoint returns DM conversation metadata only. The actual DM message content is fetched separately through the Messages API.

### `POST /dms`
- **Description**: Creates or retrieves an existing DM conversation with another user.
- **Request Body**: `{ "targetUserId": "..." }`
- **Response**: Returns the channel object for the DM.

### `GET /dms/:dmId/messages`
- **Description**: Retrieves the message history for a specific DM conversation.
- **Note**: This is a DM-specific alias for `GET /channels/:channelId/messages` and should return the same message payload shape.

---

## 4. Messages

### `GET /channels/:channelId/messages`
- **Description**: Retrieves message history for a specific channel or DM. (Supports pagination)
- **Query Params**: `?limit=50&cursor=...`

### `POST /messages`
- **Description**: Sends a new message to a channel or DM (including markdown and code diffs).
- **Request Body**:
\`\`\`json
{
  "channelId": "...",
  "content": "What do you think about updating the code like this?",
  "codeBlocks": [
    {
      "language": "javascript",
      "fileName": "example.js",
      "code": "...",
      "originalCode": "...",
      "modifiedCode": "..."
    }
  ]
}
\`\`\`

### `PUT /messages/:messageId`
- **Description**: Edits a specific message sent by the user.

### `DELETE /messages/:messageId`
- **Description**: Deletes a specific message sent by the user.

---

## 5. Users

### `GET /users`
- **Description**: Retrieves a list of users across the platform (useful for starting DMs or inviting to channels).
- **Query Params**: `?search=...`

### `GET /users/:userId`
- **Description**: Retrieves the profile of a specific user.
