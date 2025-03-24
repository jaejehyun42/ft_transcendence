const gameModule = require('../db/game');
const { addMatchHistory } = require('../db/match');
const dbModule = require('../db/user')

async function matchHistoryRoute(fastify, options){
    const db = fastify.db;

    fastify.post('/api/match-results/save', async (request, reply) => {
        const db = fastify.db;
        try {
            const { user1, user2, user1_score, user2_score } = request.body;
            console.log('📥 경기 데이터 수신:', { user1, user2, user1_score, user2_score });
    
            if (!user1 || !user2) {
                return reply.status(400).send({ error: 'User names are required' });
            }
    
            const user1Id = await dbModule.getUserIdByNickname(db, user1);
            const user2Id = await dbModule.getUserIdByNickname(db, user2);

            if (!user1Id ||!user2Id) {
                return reply.status(404).send({ error: 'User not found' });
            }
    
            await addMatchHistory(db, user1Id, user2Id, user1_score, user2_score);

            const result = user1_score > user2_score ? 'win' : 'lose';
            const playerType = user2.startsWith('AI') ? 'ai' : 'human';
    
            await gameModule.updateScore(db, user1Id, playerType, result);
            await gameModule.updateScore(db, user2Id, playerType, result);
    
            // 최종 응답
            return reply.status(201).send({
                user1,
                user2,
                user1_score,
                user2_score,
                match_date: new Date().toISOString(),
            });
        } catch (error) {
            console.error('❌ 서버 오류:', error);
            if (!reply.sent) {
                return reply.status(500).send({ error: 'Server error' });
            }
        }
    });

    fastify.get('/api/match-history/latest', async (request, reply) => {
        try {
            const rows = await new Promise((resolve, reject) => {
                const sql = `
                    SELECT user1, user2, user1_score, user2_score, match_date
                    FROM matchhistory
                    ORDER BY match_date DESC
                    LIMIT 5
                `;
    
                db.all(sql, [], (err, rows) => {
                    if (err) {
                        console.error("❌ matchhistory 조회 오류:", err.message);
                        reject(new Error("DB 조회 실패"));
                    } else {
                        resolve(rows);
                    }
                });
            });
            reply.send(rows); // ✅ 최신 5개 경기 정보 반환
    
        } catch (error) {
            console.error("❌ 최신 경기 조회 서버 오류:", error.message);
            reply.status(500).send({ error: '서버 오류로 경기 데이터를 가져올 수 없습니다.' });
        }
    });
}

module.exports = matchHistoryRoute;