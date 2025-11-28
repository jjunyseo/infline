# 🔥 Firebase 설정 가이드

이 문서는 Infline 프로젝트의 Firebase 백엔드 설정 방법을 안내합니다.

## 1. Firebase 프로젝트 생성

### Step 1: Firebase Console 접속
1. [Firebase Console](https://console.firebase.google.com/)에 접속
2. Google 계정으로 로그인
3. **"프로젝트 추가"** 클릭

### Step 2: 프로젝트 설정
1. 프로젝트 이름: `infline` (또는 원하는 이름)
2. Google Analytics: 선택 사항 (권장: 활성화)
3. **"프로젝트 만들기"** 클릭

---

## 2. 웹 앱 등록

### Step 1: 앱 추가
1. 프로젝트 대시보드에서 **웹 아이콘 (`</>`)** 클릭
2. 앱 닉네임: `infline-web`
3. **Firebase Hosting** 체크박스는 선택하지 않음 (Vercel 사용)
4. **"앱 등록"** 클릭

### Step 2: Firebase 구성 정보 복사
아래와 같은 구성 정보가 표시됩니다:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "infline-xxxxx.firebaseapp.com",
  projectId: "infline-xxxxx",
  storageBucket: "infline-xxxxx.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};
```

이 값들을 `.env.local` 파일에 추가합니다:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=infline-xxxxx.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=infline-xxxxx
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=infline-xxxxx.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef123456
```

---

## 3. Authentication 설정

### Step 1: Authentication 활성화
1. Firebase Console 왼쪽 메뉴에서 **"빌드" → "Authentication"** 클릭
2. **"시작하기"** 클릭

### Step 2: 로그인 방법 설정

#### 이메일/비밀번호 로그인
1. **"Sign-in method"** 탭 클릭
2. **"이메일/비밀번호"** 클릭
3. **"사용 설정"** 토글 활성화
4. **"저장"** 클릭

#### Google 로그인 (선택 사항)
1. **"Google"** 클릭
2. **"사용 설정"** 토글 활성화
3. 프로젝트 지원 이메일 선택
4. **"저장"** 클릭

---

## 4. Firestore Database 설정

### Step 1: Firestore 생성
1. Firebase Console 왼쪽 메뉴에서 **"빌드" → "Firestore Database"** 클릭
2. **"데이터베이스 만들기"** 클릭
3. 위치 선택: `asia-northeast3` (서울) 권장
4. **"테스트 모드에서 시작"** 선택 (나중에 보안 규칙 설정)
5. **"만들기"** 클릭

### Step 2: 보안 규칙 설정
**"규칙"** 탭에서 다음 규칙을 입력:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 사용자 프로필
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // 라인 데이터
    match /lines/{lineId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null && 
        resource.data.creatorId == request.auth.uid;
    }
    
    // 포스트 데이터
    match /posts/{postId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null && 
        resource.data.authorId == request.auth.uid;
    }
  }
}
```

**"게시"** 클릭하여 규칙 적용

---

## 5. 환경 변수 설정 (최종)

`.env.local` 파일:

```env
# Mapbox
NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_token

# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

---

## 6. Vercel 배포 시 환경 변수

Vercel 프로젝트 설정에서 위의 모든 환경 변수를 추가하세요:

1. Vercel 대시보드 → 프로젝트 선택
2. **"Settings"** → **"Environment Variables"**
3. 각 변수 추가

---

## 7. 데이터 구조

### users 컬렉션
```typescript
{
  uid: string;           // Firebase Auth UID
  email: string;
  displayName: string;
  photoURL?: string;
  location?: {
    lat: number;
    lon: number;
  };
  createdAt: Timestamp;
  lastLoginAt: Timestamp;
}
```

### lines 컬렉션
```typescript
{
  id: string;
  creatorId: string;     // users.uid 참조
  createdAt: Timestamp;
  expiresAt: Timestamp;  // 24시간 후
  origin: {
    lat: number;
    lon: number;
  };
  bearing: number;       // 방향각 (0-360)
  color: string;
  riderCount: number;
}
```

### posts 컬렉션
```typescript
{
  id: string;
  lineId: string;        // lines.id 참조
  authorId: string;      // users.uid 참조
  content: string;
  imageURL?: string;
  createdAt: Timestamp;
}
```

---

## 완료 체크리스트

- [ ] Firebase 프로젝트 생성
- [ ] 웹 앱 등록 및 구성 정보 복사
- [ ] Authentication 활성화 (이메일/비밀번호)
- [ ] Firestore Database 생성
- [ ] 보안 규칙 설정
- [ ] `.env.local` 환경 변수 설정
- [ ] Vercel 환경 변수 설정

---

문제가 있으시면 [Firebase 공식 문서](https://firebase.google.com/docs)를 참조하세요.

