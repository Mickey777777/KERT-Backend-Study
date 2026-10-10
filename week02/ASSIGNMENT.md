# 2주차 과제 — EJS 템플릿과 폼으로 게시판 만들기

**기간** 2026.10.12(월) ~ 10.16(금) 23:59
**브랜치** `Feat/ejs-board`
**제출** 내 레포에 PR → 내 `main` 에 머지 → PR 링크를 카카오톡에 제출.

> 모든 작업은 이 `week02/` 폴더 안에서 진행 합니다.
> VSCode 통합 터미널에서 `pwd`(macOS) 또는 `Get-Location`(Windows PowerShell)로 위치가 `.../week02` 인지 확인하세요.

## 0. 시작하기 전에

GitHub 내 레포 화면에서 **Sync fork** → **Update branch** 를 눌러 이 `week02/` 폴더를 먼저 받아옵니다.

```bash
git switch main
git pull
git switch -c Feat/ejs-board
cd week02
```

## 1. 프로젝트 준비

```bash
npm init -y
npm install express ejs
```

그리고 **반드시** `.gitignore` 를 이 폴더(`week02/`)에 만들어 주세요!!

```
node_modules/
*.db
.env
```

과제를 끝내면 `week02/` 는 대략 이렇게 됩니다.

```
week02/
├── .gitignore
├── ASSIGNMENT.md
├── README.md
├── app.js
├── check.js            ← 점검 코드 (수정하지 않기)
├── package.json
├── package-lock.json
├── node_modules/
└── views/
    ├── list.ejs
    ├── detail.ejs
    ├── new.ejs
    └── partials/
        ├── header.ejs
        └── footer.ejs
```

## 2. [과제] 필수

`app.js` 에 아래 시작 데이터를 넣고 시작하세요.

```javascript
const posts = [
  { id: 1, title: 'Express 설치했어요', author: 'kim', content: 'npm install express 끝!' },
  { id: 2, title: '서버가 안 켜져요', author: 'lee', content: 'EADDRINUSE 에러가 나요' },
  { id: 3, title: 'EJS 질문', author: 'park', content: '<%= %> 랑 <%- %> 차이가 뭔가요?' },
];
```

| 메서드 | 주소 | 요구사항 |
|---|---|---|
| GET | `/` | `/posts` 로 redirect |
| GET | `/posts` | `list.ejs` 렌더. 글마다 `[id] 제목 (작성자)`, 제목을 누르면 상세로 이동. 글이 없으면 `글이 없습니다` |
| GET | `/posts/new` | `new.ejs` 렌더. 입력칸 `name` 은 `title` · `author` · `content` |
| POST | `/posts` | 폼 데이터로 글 저장 후 새 글 상세로 redirect |
| GET | `/posts/:id` | `detail.ejs` 렌더. 제목 · 작성자 · 내용과 삭제 버튼. 없는 글은 404 |
| POST | `/posts/:id/delete` | 글 삭제 후 `/posts` 로 redirect |

- 글을 삭제한 뒤 새로 써도 `id` 가 겹치지 않게
- header · footer 를 `views/partials/` 로 분리해서 세 화면에서 같이 쓰기
- 이 폴더의 `README.md` 빈칸 채우기

## 3. 점검 — `check.js`

서버(`node app.js`)를 켠 상태에서 터미널을 하나 더 열고 실행합니다. 이 파일은 **수정하지 마세요.**

```bash
node check.js
```

`필수 14 / 14 통과` 가 되어야 합니다.

## 4. 도전 과제

아래 기능은 선택적 참여이며, 가능한 구현해보시는 것을 추천드립니다.

- [ ] 검색: `/posts?keyword=Express` 로 접속하면 제목에 `keyword` 가 들어간 글만 보여주기
- [ ] 빈 제목 막기: 제목이 비어 있거나 공백뿐이면 저장하지 않기 (400 응답 또는 글쓰기 화면)
- [ ] 나만의 404 페이지: 없는 주소 · 없는 글일 때 `views/404.ejs` 를 렌더 (상태 코드는 404)

## 제출 순서 요약

```bash
git status                     # node_modules 없는지 확인
git add .
git commit -m "feat: add ejs board"
git push -u origin Feat/ejs-board
```

GitHub → **Compare & pull request** → base repository를 **내 레포**로 바꾸기 → Create → **Squash and merge** → PR 링크 제출.
자세한 내용은 레포 루트의 `README.md` 를 참고하세요.
