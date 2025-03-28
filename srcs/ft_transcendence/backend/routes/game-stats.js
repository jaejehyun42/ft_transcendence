const dbModule = require('../db/user');

async function gameStatsRoute(fastify, options) {
    const db = fastify.db;

    fastify.get('/api/game-stats', async (request, reply) => {
        try {
            const authResponse = await fastify.inject({
                method: 'GET',
                url: '/auth/check',
                cookies: request.cookies
            });
    
            const authData = await authResponse.json();
            if (!authData.authenticated) {
                return reply.redirect('/');
            }
    
            const user = await dbModule.getUserByEmail(db, authData.user.email);
            if (!user) {
                return reply.status(404).send({ error: "사용자를 찾을 수 없습니다." });
           }

            const row = await new Promise((resolve, reject) => {
                db.get(`SELECT * FROM gamedb WHERE user_id = ?`, [user.id], (err, row) => {
                    if (err) {
                        console.error("게임 데이터 조회 오류:", err.message);
                        reject(new Error("데이터 조회 오류"));
                    } else if (!row) {
                        reject(new Error(`user_id=${user.id}인 데이터를 찾을 수 없습니다.`));
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