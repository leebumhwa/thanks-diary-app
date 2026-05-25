# 감사 일기 📔

매일 감사한 일 3가지를 기록하는 일기장 앱입니다.

## 기술 스택

- **Frontend**: React 19 + Vite
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **배포**: Vercel

## 주요 기능

- 이메일/비밀번호 로그인
- 일기 작성 (날짜, 기분, 내용, 감사한 일 3가지, 사진)
- 일기 검색 및 기분 필터
- 다크/라이트 테마
- PIN 잠금

## 시작하기

### 1. 저장소 클론

```bash
git clone https://github.com/leebumhwa/thanks-diary-app.git
cd thanks-diary-app
npm install
```

### 2. 환경 변수 설정

```bash
cp .env.example .env
```

`.env` 파일에 Supabase 프로젝트 URL과 anon key를 입력하세요.

### 3. Supabase 설정

Supabase SQL Editor에서 `supabase-schema.sql`을 실행하세요.

### 4. 개발 서버 실행

```bash
npm run dev
```

## 배포 (Vercel)

Vercel에서 `VITE_SUPABASE_URL`과 `VITE_SUPABASE_ANON_KEY` 환경 변수를 설정하고 배포하세요.
