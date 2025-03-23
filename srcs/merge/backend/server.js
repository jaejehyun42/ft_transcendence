const fastify = require('fastify');
const fs = require('fs');
const path = require('path');
const port = 3000;

const certPath = path.resolve(__dirname, '../cert/.certificate'); // 절대 경로 변환
const certData = fs.readFileSync(certPath, 'utf8');
console.log("✅ Certificate loaded successfully!");

function parseCertificate(certFileContent) {
	const parts = certFileContent.split('-----END PRIVATE KEY-----');
	if (parts.length !== 2) {
		throw new Error('.certificate 파일 형식이 올바르지 않습니다.');
	}

	const key = parts[0] + '-----END PRIVATE KEY-----\n'; // 개인 키
	const cert = parts[1].trim(); // 인증서
	return { key, cert };
}

const { key, cert } = parseCertificate(certData);

const app = fastify({
	logger: true,
	https: {
		key,
		cert
	}
});

require('./plugins/server_plugin')(app);
const dbPlugin = require('./db/initdb');
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
app.register(require('./routes/auth'));
app.register(require('./routes/game-stats'));
app.register(require('./routes/match-results'));
app.register(require('./routes/userinfo'));

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