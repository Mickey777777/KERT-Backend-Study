const express = require('express');

const app = express();
const PORT = 3000;

app.get('/', (req, res) => {
  res.send('<h1>Hello Express!</h1>');
});

app.listen(PORT, () => {
  console.log(`서버 실행 중: http://localhost:${PORT}`);
});
