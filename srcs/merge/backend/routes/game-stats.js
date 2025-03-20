const authenticateJWT = require('../auth/jwt');

async function gameStatsRoute(fastify, options) {
    const db = fastify.db;

    fastify.get('/api/game-stats/:id', async (request, reply) => {
        try {
            const { id } = request.params;
            const authResponse = await fastify.inject({
                method: 'GET',
                url: '/auth/check',
                cookies: request.cookies
            });
    
            const authData = await authResponse.json();
            if (!authData.authenticated) {
                return reply.redirect('/');
            }
    
            // 🔹 DB에서 특정 ID의 데이터 조회
            const db = fastify.db;
            const row = await new Promise((resolve, reject) => {
                db.get(`SELECT * FROM gamedb WHERE id = ?`, [id], (err, row) => {
                    if (err) {
                        console.error("게임 데이터 조회 오류:", err.message);
                        reject(new Error("데이터 조회 오류"));
                    } else if (!row) {
                        reject(new Error(`id=${id}인 데이터를 찾을 수 없습니다.`));
                    } else {
                        resolve(row);
                    }
                });
            });
    
            return reply.send([row]);
        } catch (error) {
            console.error("게임 데이터 조회 오류:", error);
            return reply.status(500).send({ error: error.message });
        }
    });
}

module.exports = gameStatsRoute;