# WIP Frontend

WIP 프론트엔드 레포지토리입니다. 개발 중인 코드나 아이디어를 팀원과 바로 공유하고, 채팅 안에서 코드 블록과 실행 결과를 같이 확인할 수 있도록 만든 협업형 메신저 화면입니다.

## 사용 기술

- React
- TypeScript
- Vite
- styled-components
- Zustand
- react-markdown
- Socket.io Client

## 주요 기능

- 로그인, 회원가입, 비밀번호 찾기 화면
- 채널 기반 채팅 화면
- DM, 친구, 알림, 검색, 스니펫 화면
- Markdown 메시지 렌더링
- 코드 블록 문법 강조
- 코드 diff 표시
- 실행 결과를 확인하는 runner 패널
- 로컬 mock 데이터와 백엔드 API 어댑터 분리

## 폴더 구조

```txt
src/components   화면을 구성하는 컴포넌트
src/pages        라우팅 단위 페이지
src/services     API, mock 데이터, 소켓 연동 로직
src/store        Zustand 상태 관리
src/styles       전역 스타일과 테마
src/types        공통 타입 정의
src/utils        문자열, 시간, 코드 처리 유틸
```

## 실행 방법

```bash
npm install
npm run dev
```

백엔드 API와 연결하려면 `.env.example`을 참고해서 `.env` 파일을 만들고 아래 값을 설정합니다.

```txt
VITE_API_MODE=http
VITE_API_BASE_URL=http://localhost:3000/api
```

## 빌드

```bash
npm run build
```

현재 빌드는 정상적으로 통과합니다. Vite에서 번들 크기 경고가 나올 수 있는데, 실행을 막는 오류는 아니고 이후 코드 스플리팅으로 개선할 부분입니다.

## 백엔드 연동

백엔드 기본 주소는 `http://localhost:3000/api`입니다. 주요 API는 로그인, 채널, 메시지, DM, 친구, 스니펫, 알림, runner 기능을 기준으로 연결됩니다.
