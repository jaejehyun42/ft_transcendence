const authenticateJWT = require('../auth/jwt');
const db = fastify.db;

fastify.get('/api/game-stats', async (request, reply) => {
    try {
        const authResponse = await fastify.inject({
            method: 'GET',
            url: '/auth/check',
            cookies: request.cookies // 현재 요청의 쿠키를 전달
        });

        const authData = authResponse.json();
        if (!authData.authenticated) {
            return reply.redirect('/');
        }
        
        const db = fastify.db;
        db.all(`SELECT * FROM gamedb`, [], (err, rows) => {
            if (err) {
                console.error("게임 데이터 조회 오류:", err.message);
                return reply.status(500).send({ error: "데이터 조회 오류" });
            }
            reply.send(rows);
        });
    } catch (error) {
        console.error("게임 데이터 조회 오류:", error);
        return reply.status(500).send({ error: "서버 오류" });
    }
});