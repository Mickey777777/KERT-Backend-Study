// ===== 2주차 점검 코드입니다. 읽지 않아도 되고, 수정하지 마세요 =====
//
// 1. 터미널 하나에서 week02 폴더로 이동해 서버를 켭니다    node app.js
// 2. 터미널을 하나 더 열고 week02 폴더에서 실행합니다      node check.js
//    (포트를 3000 이 아닌 번호로 바꿨다면                  node check.js 3001)

const fs = require('fs');
const path = require('path');

const DEFAULT_PORT = 3000;
const MISSING_ID = 999999;
const MAX_DELETE_ROUNDS = 5;
const PORT = process.argv[2] ?? DEFAULT_PORT;
const BASE_URL = `http://localhost:${PORT}`;
const RUN = Date.now().toString(36);

const results = {};
let group = '';

function section(name) {
  group = name;
  results[name] = { passed: 0, total: 0 };
  console.log(`\n[${name}]`);
}

async function check(name, fn) {
  results[group].total++;
  try {
    await fn();
    results[group].passed++;
    console.log(`PASS  ${name}`);
  } catch (err) {
    console.log(`FAIL  ${name}`);
    console.log(`      ${err.message}`);
  }
}

function expect(condition, message) {
  if (!condition) throw new Error(message);
}

async function request(method, urlPath, form) {
  const options = { method, redirect: 'manual' };
  if (form) options.body = new URLSearchParams(form);
  const res = await fetch(BASE_URL + urlPath, options);
  const location = res.headers.get('location');
  return {
    status: res.status,
    location: location === null ? null : new URL(location, BASE_URL).pathname,
    body: await res.text(),
  };
}

function isRedirect(res) {
  return res.status >= 300 && res.status < 400;
}

function describe(res) {
  return isRedirect(res) ? `${res.status} → ${res.location}` : `${res.status}`;
}

function detailIds(html) {
  const ids = [];
  for (const match of html.matchAll(/href\s*=\s*["']\/posts\/(\d+)["']/g)) {
    const id = Number(match[1]);
    if (!ids.includes(id)) ids.push(id);
  }
  return ids;
}

async function createPost(title, author, content) {
  const res = await request('POST', '/posts', { title, author, content });
  const match = res.location?.match(/^\/posts\/(\d+)$/);
  expect(isRedirect(res) && match,
    `POST /posts 가 새 글 상세(/posts/숫자)로 redirect 해야 합니다. 실제: ${describe(res)}`);
  return Number(match[1]);
}

function readFile(name) {
  const file = path.join(__dirname, name);
  return fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null;
}

function includesPartial(template, partial) {
  return new RegExp(`include\\(\\s*["'](\\./)?partials/${partial}(\\.ejs)?["']`).test(template);
}

async function main() {
  if (typeof fetch !== 'function') {
    console.log('Node.js 20 이상에서 실행해 주세요. 지금 버전: ' + process.version);
    process.exit(1);
  }
  try {
    await fetch(BASE_URL + '/posts');
  } catch {
    console.log(`${BASE_URL} 에 연결할 수 없습니다.`);
    console.log('다른 터미널에서 week02 폴더로 이동해 node app.js 로 서버를 먼저 켜 주세요.');
    process.exit(1);
  }

  const created = {};

  section('필수');

  await check('GET / 는 /posts 로 redirect', async () => {
    const res = await request('GET', '/');
    expect(isRedirect(res) && res.location === '/posts', `실제: ${describe(res)}`);
  });

  await check('GET /posts 목록에 글 상세 링크가 있다', async () => {
    const res = await request('GET', '/posts');
    expect(res.status === 200, `상태 코드가 200 이어야 합니다. 실제: ${describe(res)}`);
    expect(detailIds(res.body).length > 0,
      '목록에 <a href="/posts/글번호"> 링크가 없습니다. 시작 데이터(posts 배열)를 넣었는지도 확인하세요');
  });

  await check('GET /posts/new 에 title · author · content 를 보내는 폼이 있다', async () => {
    const res = await request('GET', '/posts/new');
    expect(res.status === 200, `상태 코드가 200 이어야 합니다. 실제: ${describe(res)} (라우트 순서를 확인하세요)`);
    const forms = res.body.match(/<form[^>]*>/gi) ?? [];
    const ok = forms.some((tag) => /method\s*=\s*["']?post/i.test(tag) && /action\s*=\s*["']\/posts["']/.test(tag));
    expect(ok, '<form method="POST" action="/posts"> 가 없습니다');
    for (const name of ['title', 'author', 'content']) {
      expect(new RegExp(`name\\s*=\\s*["']${name}["']`).test(res.body), `name="${name}" 인 입력칸이 없습니다`);
    }
  });

  await check('POST /posts 로 글을 쓰면 새 글 상세로 redirect', async () => {
    created.first = { title: `점검글-${RUN}`, author: 'checker', content: `점검내용-${RUN}` };
    created.first.id = await createPost(created.first.title, created.first.author, created.first.content);
  });

  await check('GET /posts/:id 상세에 제목 · 작성자 · 내용이 보인다', async () => {
    expect(created.first?.id, '앞 단계(글쓰기)가 실패해서 확인할 수 없습니다');
    const { id, title, author, content } = created.first;
    const res = await request('GET', `/posts/${id}`);
    expect(res.status === 200, `/posts/${id} 상태 코드가 200 이어야 합니다. 실제: ${describe(res)}`);
    for (const [label, value] of [['제목', title], ['작성자', author], ['내용', content]]) {
      expect(res.body.includes(value), `${label} "${value}" 가 상세 페이지에 없습니다`);
    }
  });

  await check('새 글이 목록에 보인다', async () => {
    expect(created.first?.id, '앞 단계(글쓰기)가 실패해서 확인할 수 없습니다');
    const res = await request('GET', '/posts');
    expect(res.body.includes(created.first.title), `목록에 "${created.first.title}" 가 없습니다`);
    expect(detailIds(res.body).includes(created.first.id), `목록에 /posts/${created.first.id} 링크가 없습니다`);
  });

  await check('없는 글(/posts/999999)은 404', async () => {
    const res = await request('GET', `/posts/${MISSING_ID}`);
    expect(res.status === 404, `실제: ${describe(res)}`);
  });

  await check('숫자가 아닌 주소(/posts/abc)도 404', async () => {
    const res = await request('GET', '/posts/abc');
    expect(res.status === 404, `실제: ${describe(res)}`);
  });

  await check('POST /posts/:id/delete 로 지우면 목록으로 redirect, 글이 사라진다', async () => {
    expect(created.first?.id, '앞 단계(글쓰기)가 실패해서 확인할 수 없습니다');
    const { id, title } = created.first;
    const res = await request('POST', `/posts/${id}/delete`);
    expect(isRedirect(res) && res.location === '/posts', `/posts 로 redirect 해야 합니다. 실제: ${describe(res)}`);
    const detail = await request('GET', `/posts/${id}`);
    expect(detail.status === 404, `지운 글 /posts/${id} 가 404 여야 합니다. 실제: ${describe(detail)}`);
    const list = await request('GET', '/posts');
    expect(!list.body.includes(title), `지운 글 "${title}" 가 아직 목록에 있습니다`);
  });

  await check('글을 지운 뒤 새로 써도 id 가 겹치지 않는다', async () => {
    const a = await createPost(`겹침A-${RUN}`, 'checker', 'a');
    const b = await createPost(`겹침B-${RUN}`, 'checker', 'b');
    await request('POST', `/posts/${a}/delete`);
    const cTitle = `겹침C-${RUN}`;
    const c = await createPost(cTitle, 'checker', 'c');
    expect(c !== b, `A(${a}) · B(${b}) 를 쓰고 A 를 지운 뒤 쓴 C 의 id 가 ${c} 로 B 와 같습니다`);
    const detail = await request('GET', `/posts/${c}`);
    expect(detail.status === 200, `/posts/${c} 상태 코드가 200 이어야 합니다. 실제: ${describe(detail)}`);
    expect(detail.body.includes(cTitle), `C 를 쓰고 이동한 /posts/${c} 에 C 가 아닌 다른 글이 보입니다`);
  });

  await check('글을 모두 지우면 목록에 "글이 없습니다"', async () => {
    for (let round = 0; round < MAX_DELETE_ROUNDS; round++) {
      const ids = detailIds((await request('GET', '/posts')).body);
      if (ids.length === 0) break;
      for (const id of ids) {
        await request('POST', `/posts/${id}/delete`);
      }
    }
    const after = await request('GET', '/posts');
    expect(detailIds(after.body).length === 0, '모든 글에 삭제 요청을 보냈는데 목록에 글이 남아 있습니다');
    expect(after.body.includes('글이 없습니다'), '목록에 "글이 없습니다" 문구가 없습니다');
  });

  await check('.gitignore 에 node_modules 가 있다', async () => {
    const gitignore = readFile('.gitignore');
    expect(gitignore !== null, 'week02/.gitignore 파일이 없습니다');
    expect(gitignore.includes('node_modules'), '.gitignore 에 node_modules/ 가 없습니다');
  });

  await check('list · detail · new 가 partials/header · footer 를 include 한다', async () => {
    for (const partial of ['header', 'footer']) {
      expect(readFile(`views/partials/${partial}.ejs`) !== null, `views/partials/${partial}.ejs 가 없습니다`);
    }
    for (const view of ['list', 'detail', 'new']) {
      const template = readFile(`views/${view}.ejs`);
      expect(template !== null, `views/${view}.ejs 가 없습니다`);
      for (const partial of ['header', 'footer']) {
        expect(includesPartial(template, partial), `views/${view}.ejs 에 <%- include('partials/${partial}') %> 가 없습니다`);
      }
    }
  });

  await check('README.md 에 실행 방법을 적었다', async () => {
    const readme = readFile('README.md');
    expect(readme !== null, 'week02/README.md 가 없습니다');
    const match = readme.replace(/<!--[\s\S]*?-->/g, '').match(/##\s*실행 방법([\s\S]*?)(\n##\s|$)/);
    expect(match && match[1].trim() !== '', 'README.md 의 「실행 방법」 아래가 비어 있습니다');
  });

  section('도전');

  await check('검색: /posts?keyword= 에 맞는 글만 보인다', async () => {
    const hit = `찾을글-${RUN}`;
    const miss = `다른글-${RUN}`;
    await createPost(hit, 'checker', 'hit');
    await createPost(miss, 'checker', 'miss');
    const res = await request('GET', `/posts?keyword=${encodeURIComponent(hit)}`);
    expect(res.body.includes(hit), `keyword=${hit} 로 검색했는데 "${hit}" 가 안 보입니다`);
    expect(!res.body.includes(miss), `keyword=${hit} 로 검색했는데 상관없는 "${miss}" 도 보입니다`);
  });

  await check('빈 제목 · 공백뿐인 제목은 저장되지 않는다', async () => {
    for (const title of ['', '   ']) {
      const before = detailIds((await request('GET', '/posts')).body).length;
      const res = await request('POST', '/posts', { title, author: 'checker', content: 'empty' });
      const after = detailIds((await request('GET', '/posts')).body).length;
      const label = title === '' ? '빈 제목' : '공백뿐인 제목';
      expect(res.status < 500, `${label}을 보냈더니 서버 에러(${res.status})가 났습니다. 터미널의 에러 메시지를 확인하세요`);
      expect(!/^\/posts\/\d+$/.test(res.location ?? ''), `${label}인데 새 글 상세로 redirect 했습니다 (${describe(res)})`);
      expect(after === before, `${label}인데 목록의 글이 ${before}개 → ${after}개로 늘었습니다`);
    }
  });

  await check('나만의 404: 없는 주소 · 없는 글에 views/404.ejs', async () => {
    expect(readFile('views/404.ejs') !== null, 'views/404.ejs 가 없습니다');
    const page = await request('GET', `/no-such-page-${RUN}`);
    expect(page.status === 404, `없는 주소의 상태 코드가 404 여야 합니다. 실제: ${describe(page)}`);
    expect(!page.body.includes('Cannot GET'), '없는 주소에 Express 기본 화면(Cannot GET ...)이 나옵니다');
    const post = await request('GET', `/posts/${MISSING_ID}`);
    expect(post.status === 404, `없는 글의 상태 코드가 404 여야 합니다. 실제: ${describe(post)}`);
    expect(post.body.trim() !== '글이 없습니다' && post.body.includes('<'),
      '없는 글에 send(\'글이 없습니다\') 대신 404.ejs 를 render 해 주세요');
  });

  console.log('\n점검하면서 글을 쓰고 지웠습니다. 서버를 재시작하면 처음 데이터로 돌아옵니다.\n');
  for (const [name, { passed, total }] of Object.entries(results)) {
    console.log(`${name} ${passed} / ${total} 통과`);
  }
}

main();
