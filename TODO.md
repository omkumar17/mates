# TODO - Socket Server Separation

## Completed ✅

### 1. Created `socket-server/` folder structure
- [x] `socket-server/server.js`
- [x] `socket-server/package.json`
- [x] `socket-server/.env`
- [x] `socket-server/config/db.js`
- [x] `socket-server/models/user.js`
- [x] `socket-server/models/match.js`
- [x] `socket-server/models/message.js`
- [x] `socket-server/socket/auth.js`
- [x] `socket-server/socket/chat.js`
- [x] `socket-server/utils/.gitkeep`

### 2. Extracted Socket Auth into `socket/auth.js`
- [x] Moved `io.use()` middleware into its own module
- [x] JWT verification, user lookup, socket.user attachment

### 3. Extracted Chat Logic into `socket/chat.js`
- [x] Fixed nested listener bug (typing/stopTyping/markSeen were inside sendMessage)
- [x] All handlers are now siblings: joinRoom, typing, stopTyping, markSeen, sendMessage, disconnect

### 4. Minimal `socket-server/server.js`
- [x] Express + HTTP + Socket.IO setup
- [x] Uses `require("./socket/auth")` for middleware
- [x] Uses `require("./socket/chat")(io)` for chat logic

### 5. Cleaned `mates_backend/server.js`
- [x] Removed all Socket.IO code (http, Server, jwt, socket models, io.use, io.on)
- [x] Now only Express REST API
- [x] Uses `app.listen()` instead of `server.listen()`

### 6. Updated Frontend
- [x] `socket.js` now connects to `NEXT_PUBLIC_SOCKET_URL` with auth token
- [x] `.env` has `NEXT_PUBLIC_SOCKET_URL="http://10.131.229.224:5001"`

### 7. Installed Dependencies
- [x] `npm install` in socket-server/

