import type { ChatMessage } from '@/types/message';
import type { Channel } from '@/types/channel';

export const MOCK_USER_ID = 'user-alice';
export const MOCK_USER_NAME = '지윤';
export const MOCK_USER2_ID = 'user-bob';
export const MOCK_USER2_NAME = '서준';

export const MOCK_CHANNELS: Channel[] = [
  {
    id: 'ch-general',
    name: 'general',
    description: '아키텍처와 일일 개발 메모',
    createdAt: Date.now() - 86400000,
    memberIds: [MOCK_USER_ID, MOCK_USER2_ID],
  },
  {
    id: 'ch-backend',
    name: 'backend',
    description: 'API, 데이터베이스, runner 작업',
    createdAt: Date.now() - 86400000,
    memberIds: [MOCK_USER_ID, MOCK_USER2_ID],
  },
  {
    id: 'ch-frontend',
    name: 'frontend',
    description: 'UI polish와 인터랙션 설계',
    createdAt: Date.now() - 86400000,
    memberIds: [MOCK_USER_ID, MOCK_USER2_ID],
  },
];

const BASE_TIME = Date.now() - 3600000;

const validateTokenOriginal = `function validateToken(token) {
  // 토큰 형태를 먼저 확인합니다.
  if (!token || typeof token !== 'string') {
    return { valid: false, reason: 'missing_token' };
  }

  const parts = token.split('.');
  if (parts.length !== 3) {
    return { valid: false, reason: 'malformed' };
  }

  try {
    const payload = JSON.parse(atob(parts[1]));
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      return { valid: false, reason: 'expired' };
    }
    return { valid: true, payload };
  } catch {
    return { valid: false, reason: 'decode_error' };
  }
}`;

const validateTokenModified = `function validateToken(token) {
  if (!token || typeof token !== 'string') throw new Error('missing_token');

  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('malformed');

  try {
    const payload = JSON.parse(atob(parts[1]));
    const nowSec = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < nowSec) throw new Error('expired');
    return payload;
  } catch (error) {
    if (error instanceof Error && ['missing_token', 'malformed', 'expired'].includes(error.message)) {
      throw error;
    }
    throw new Error('decode_error');
  }
}`;

const decodeTokenPython = `import base64
import json
import time

def decode_token(token):
    parts = token.split(".")
    if len(parts) != 3:
        raise ValueError("잘못된 토큰 형식")

    padding = 4 - len(parts[1]) % 4
    payload_b64 = parts[1] + "=" * padding
    payload = json.loads(base64.b64decode(payload_b64))

    now = int(time.time())
    if payload.get("exp", 0) < now:
        raise ValueError("토큰이 만료되었습니다")

    return payload

test_payload = {"sub": "user-1", "exp": int(time.time()) + 3600}
print("디코딩된 payload:", test_payload)
print("토큰이 유효합니다")`;

export const MOCK_MESSAGES: ChatMessage[] = [
  {
    id: 'msg-1',
    channelId: 'ch-general',
    authorId: MOCK_USER2_ID,
    authorName: MOCK_USER2_NAME,
    content:
      '인증 모듈 초안을 올려뒀어요. 토큰 refresh 흐름은 아직 거칠지만, 첫 리뷰를 받을 정도는 됐습니다.\n\n걱정되는 부분:\n- 만료 시간이 1시간으로 하드코딩되어 있음\n- refresh 엔드포인트가 아직 없음\n- 에러 메시지가 너무 일반적임',
    codeBlocks: [],
    createdAt: BASE_TIME,
    status: 'in-progress',
    kind: 'task',
  },
  {
    id: 'msg-2',
    channelId: 'ch-general',
    authorId: MOCK_USER_ID,
    authorName: MOCK_USER_NAME,
    content: `처음 작성한 토큰 검증 함수입니다:\n\n\`\`\`javascript\n${validateTokenOriginal}\n\`\`\`\n\n15번째 줄에서 만료 시간을 현재 Unix timestamp와 비교합니다.`,
    codeBlocks: [
      {
        id: 'block-msg2-1',
        language: 'javascript',
        fileName: 'validate-token.js',
        code: validateTokenOriginal,
      },
    ],
    createdAt: BASE_TIME + 300000,
    status: 'in-progress',
    kind: 'task',
  },
  {
    id: 'msg-3',
    channelId: 'ch-general',
    authorId: MOCK_USER2_ID,
    authorName: MOCK_USER2_NAME,
    content: `토큰 payload를 빠르게 확인하려고 작은 Python 스크립트를 추가했어요:\n\n\`\`\`python\n${decodeTokenPython}\n\`\`\``,
    codeBlocks: [
      {
        id: 'block-msg3-1',
        language: 'python',
        fileName: 'decode_token.py',
        code: decodeTokenPython,
        runnerOutput: {
          stdout: "디코딩된 payload: {'sub': 'user-1', 'exp': 1748345600}\n토큰이 유효합니다",
          stderr: '',
          exitCode: 0,
          durationMs: 42,
        },
      },
    ],
    createdAt: BASE_TIME + 600000,
    status: 'in-progress',
    kind: 'task',
  },
  {
    id: 'msg-4',
    channelId: 'ch-general',
    authorId: MOCK_USER_ID,
    authorName: MOCK_USER_NAME,
    content:
      '`validateToken`은 `{ valid, reason }` 객체를 반환하는 것보다 타입이 있는 에러를 throw하는 쪽이 더 쓰기 쉬울 것 같아요. 제안 변경:',
    codeBlocks: [
      {
        id: 'block-msg4-1',
        language: 'javascript',
        fileName: 'validate-token-refactor.js',
        code: validateTokenModified,
        originalCode: validateTokenOriginal,
        modifiedCode: validateTokenModified,
      },
    ],
    createdAt: BASE_TIME + 900000,
    status: 'completed',
    kind: 'task',
  },
  {
    id: 'msg-5',
    channelId: 'ch-general',
    authorId: MOCK_USER2_ID,
    authorName: MOCK_USER2_NAME,
    content:
      'throw 기반 버전이 더 읽기 좋네요. 작은 의견 하나만 더하면, `nowSec`를 분리해두면 만료 체크를 테스트하기 더 쉬울 것 같아요.',
    codeBlocks: [],
    quoteRef: {
      messageId: 'msg-2',
      lineNumber: 15,
      lineContent: '    const now = Math.floor(Date.now() / 1000);',
    },
    createdAt: BASE_TIME + 1200000,
    status: 'in-progress',
    kind: 'chat',
  },
];
