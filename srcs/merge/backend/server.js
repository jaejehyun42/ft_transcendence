const fastify = require('fastify');
const fs = require('fs');
const path = require('path');
const port = 3000;

// Fastify 인스턴스 생성 (HTTPS 옵션 포함)
const app = fastify({
	logger: true,
	https: {
		key: fs.readFileSync(path.join(__dirname, 'certs', 'server.key')),
		cert: fs.readFileSync(path.join(__dirname, 'certs', 'server.crt'))
	}
});

require('./plugins/server_plugin')(app);
const dbModule = require('./db/user');
app.register(dbModule.dbPlugin);
const dbPlugin = require('./db/initdb');
console.log(typeof dbPlugin); // 'object'인지 확인
app.register(dbPlugin);

app.register(require('@fastify/static'), {
    root: path.join(__dirname, '../dist'),
    prefix: '/',
    list: true, // 디버깅용: 터미널에서 파일 리스트 확인
  });

app.setNotFoundHandler((req, reply) => {
    if (req.url.includes('.') || req.url.startsWith('/api/')) {
        reply.code(404).send('Not Found');
    } else {
        reply.sendFile('index.html'); // ✅ Vite 빌드된 SPA 반환
    }
});

// ✅ API 라우트
app.register(require('./routes/login'));
app.register(require('./routes/profile'));

// 서버 시작
const start = async () => {
  try {
    await app.listen({ port: port, host: '0.0.0.0' });
    app.log.info(`Server is running on https://0.0.0.0:${port}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();