# Backend API & Database (MySQL) — WIP

이 문서는 WIP 프론트엔드와 연동되는 백엔드의 API 설계, 권장 스키마(MySQL 기반), 인증/실시간 아키텍처, 그리고 코드-러너·diff 저장 관련 운영 권고를 정리합니다. 프로젝트 방침에 따라 Prisma는 사용하지 않으며 MySQL을 기본 RDB로 사용합니다.

## 핵심 기술 스택 (권장)

- Runtime: Node.js + TypeScript
- Framework: Express (간단한 서비스) 또는 NestJS (구조화된 대규모 서비스)
- ORM / Query: TypeORM (TypeScript 친화적) 또는 `knex` + `Objection`/Raw SQL (복잡한 쿼리 제어 필요 시)
- Database: MySQL (검색·정렬·관계형 처리에 최적화)
- Real-time: Socket.io (WebSocket 기반 이벤트 브로드캐스트)
- Auth: JWT stored in HttpOnly cookie (CSRF 대책 필요)

## API 설계 (주요 엔드포인트)

모든 API는 `/api` 프리픽스를 사용하고 JSON을 송수신합니다. 인증 필요 엔드포인트는 JWT 검사 미들웨어를 통과해야 합니다.

- Auth
   - POST `/api/auth/signup` { nickname, email, password } → 201 { user }
   - POST `/api/auth/login` { email, password } → 200 + Set-Cookie(HttpOnly JWT)
   - POST `/api/auth/logout` → 204 (Clear cookie)
   - GET `/api/auth/me` → 200 { user }

- Channels
   - GET `/api/channels` → 200 [{ id, name, topic, createdAt }]
   - GET `/api/channels/:id/messages?limit=&before=` → 200 [{ message }]

- Messages
   - POST `/api/messages` { channelId, content, codeBlocks: [{ language,fileName,code }] } → 201 { message }
      - 서버는 메시지와 관련 CodeBlock 레코드를 별도 테이블에 저장하고, 필요한 경우 Socket.io로 브로드캐스트합니다.
   - PUT `/api/messages/:id` { content, codeBlocks } → 200 { message }
      - 편집은 원본 보존 정책을 따릅니다: 메시지 자체를 덮어쓰기보다 편집이력(또는 'reply'로 변경 전/후 저장)으로 남기는 것이 권장됩니다.

- Snippets (사용자 개인 스니펫)
   - GET `/api/snippets` → 200 [{ snippet }]  // 사용자 소유 필터링
   - POST `/api/snippets` { title, language, fileName, code, tags } → 201 { snippet }
   - PUT `/api/snippets/:id` { ... } → 200 { snippet }  // 소유자만 가능
   - DELETE `/api/snippets/:id` → 204  // 소유자만 가능

- Runner / Sandbox (비동기 작업 권장)
   - POST `/api/runner/execute` { language, code, timeoutMs } → 202 { jobId }
   - GET `/api/runner/execute/:jobId` → 200 { status, stdout, stderr, exitCode }
      - 실제 실행은 별도의 격리 환경(도커/서버리스 컨테이너)에서 수행하고 결과를 DB 또는 캐시(레디스)에 보관합니다.

## 데이터베이스 스키마 제안 (요약)

관계형 구조로 `messages`와 `code_blocks`를 분리해 대용량 코드 블록 처리를 유연하게 합니다.

- users
   - id PK, email, hashed_password, nickname, created_at

- channels
   - id PK, name, topic, created_at

- messages
   - id PK, channel_id FK, author_id FK, content TEXT, created_at, updated_at, status

- code_blocks
   - id PK, message_id FK (nullable for standalone snippets), snippet_id FK (nullable), language, file_name, code LONGTEXT, original_code LONGTEXT (nullable), modified_code LONGTEXT (nullable), runner_output JSON (nullable)
   - 인덱스: message_id, snippet_id, language

- snippets
   - id PK, owner_id FK, title, language, file_name, code LONGTEXT, tags JSON, created_at

설계 노트:
- Code 블록의 크기가 커질 수 있으므로 `LONGTEXT` 또는 별도 object storage/파일 스토리지(예: S3) 참조 전략을 고려하세요.
- `original_code` / `modified_code`는 diff 이력을 위한 보존 필드입니다. 필요시 압축(예: gzip)하거나 별도 스토리지에 적재하고 DB에는 메타/참조만 저장하는 것이 권장됩니다.

## 실시간(소켓) 전략

- 인증: WebSocket 연결 시 초기 핸드쉐이크에서 HttpOnly JWT를 사용해 토큰을 검증하거나, 연결 직후 `authenticate` 이벤트로 토큰 전송 후 서버에서 검증합니다.
- 구독: 채널별로 Socket.io room을 사용. 예: `socket.join('channel:ch-123')`.
- 이벤트
   - `message:created` — 서버가 메시지 저장 후 브로드캐스트
   - `message:edited` — 편집 히스토리/요약 브로드캐스트
   - `runner:job:update` — 러너 실행 상태 브로드캐스트

## 인증/보안 권고

- JWT를 HttpOnly cookie에 저장하고 CSRF 토큰(CSRF double submit 또는 SameSite 쿠키) 적용.
- 파일 업로드(또는 대용량 코드 저장)는 바이너리 검사/크기 제한/악성코드 스캐닝 도입.
- 러너는 격리된 환경에서 실행하고 네트워크, 파일시스템 접근을 엄격히 제한하세요.

## 운영·성능 고려사항

- 대규모 diff·코드 저장: 메시지 테이블에는 메타(참조 id)만 저장하고, 실제 코드 블록은 `code_blocks` 또는 외부 스토리지에 보관.
- 읽기 성능: 메시지 페이징 인덱스(채널+created_at), code_blocks는 message_id로 조인 인덱스 생성.
- 캐시: 최근 메시지/채널 목록은 Redis에 캐시해 응답 속도를 높이세요.

## 마이그레이션·개발 워크플로

- TypeORM(또는 선택한 쿼리러)을 사용해 마이그레이션 스크립트를 관리하세요.
- 로컬 개발: MySQL docker-compose 서비스 + 관리자용 데이터(seed) 스크립트 제공.

---

원하시면 이 문서를 기반으로 구체적인 DB DDL(테이블 정의 SQL)과 OpenAPI(또는 Swagger) 스펙을 생성해 드리겠습니다.
# Backend Architecture & Stack

This document outlines the technology stack and initial architecture for the backend implementation of the "WIP" platform.

## Tech Stack: Node.js

To maximize full-stack development efficiency and share types between the frontend and backend, the backend will be built entirely within the Node.js ecosystem using TypeScript.

- **Runtime/Environment**: **Node.js**
- **Framework**: **Express** (or **NestJS** for a more highly structured, scalable architecture)
- **Language**: **TypeScript** (allows sharing interfaces/types like `User`, `Message`, `Channel` with the React frontend)
- **Database Access**: **mysql** or a lightweight custom repository layer for direct MySQL queries
- **Database**: **MySQL** (Suitable for relational data, transactional consistency, and predictable scaling)
- **Real-time**: **Socket.io** (Essential for handling real-time chat, live diffing updates, and DM events)

## Key Architectural Considerations

1. **Real-time Communication (WebSockets)**
   - As a messaging app, relying solely on REST APIs is insufficient. A WebSocket server using Socket.io will run alongside the Node.js HTTP server.
   - **Strategy**: Client sends a message via REST API -> Backend saves to MySQL through the Node.js data layer -> Server broadcasts the message via Socket.io to all users currently connected and subscribed to that specific `channel_id` room.
   - **Direct Messages (DMs)**: DMs are treated as private channels. WebSocket events for DMs are handled securely by isolating them into specific Socket.io rooms, ensuring only the two participants receive the broadcast.

2. **Code Runner Integration (Runner Mock / Sandbox)**
   - The design spec (CLAUDE.md) mentions an "Integrated Runner Mock".
   - If actual code execution is implemented in the future, the Node.js backend must delegate this to a secure environment (e.g., Docker containers or Serverless sandboxes) to safely execute isolated code blocks and stream the output back to the client.

3. **Authentication / Authorization**
   - Implement **JWT (JSON Web Token)** for stateless authentication.
   - Use HttpOnly cookies for storing tokens to prevent XSS attacks while ensuring robust CSRF protections are in place. Middleware in Node.js will verify the token before allowing access to protected routes or WebSocket connections.

4. **Diffing & Text Processing Optimization**
   - Since messages contain both `originalCode` and `modifiedCode` for live diff rendering, the database payload size could grow significantly.
   - For performance, consider separating large code blocks into an optimized storage layer or applying compression if the real-time diffing payload impacts database latency.

5. **MySQL Schema Design**
   - Use `InnoDB` so foreign keys, transactions, and row-level locking work reliably for chat and DM writes.
   - Use `utf8mb4` for all text columns so markdown content, code snippets, and multilingual text are stored safely.
   - For UUID primary keys, decide early whether to store them as `CHAR(36)` for simplicity or as compact binary values for better index performance.
