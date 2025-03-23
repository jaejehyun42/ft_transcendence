const authenticateJWT = require('../auth/jwt');
const gameModule = require('../db/game')

async function matchHistoryRoute(fastify, options){
    const db = fastify.db;

    fastify.post('/api/match-results/save', async (request, reply) => {
        try {
            const { user1, user2, user1_score, user2_score } = request.body;
            console.log('📥 경기 데이터 수신:', { user1, user2, user1_score, user2_score });
            // 필수 값 확인
            if (!user1 || !user2) {
                return reply.status(400).send({ error: 'User names are required' });
            }
    
            // `matchhistory` 테이블에 데이터 삽입
            const sql = `INSERT INTO matchhistory (user1, user2, user1_score, user2_score) VALUES (?, ?, ?, ?)`;
            
            db.run(sql, [user1, user2, user1_score || 0, user2_score || 0], function (err) {
                if (err) {
                    console.error('DB 저장 오류:', err.message);
                    return reply.status(500).send({ error: 'Database insert failed' });
                }
    
                const matchId = this.lastID; // 삽입된 데이터의 ID 가져오기
    
                // 🏆 `gamedb` 테이블 업데이트 (승/패 반영)
                gameModule.updateScore(db, user1, user2 == 'ai' ? 'ai' : 'human', user1_score > user2_score ? 'win' : 'lose')
                    .then(() => {
                        reply.status(201).send({
                            match_id: matchId,
                            user1,
                            user2,
                            user1_score,
                            user2_score,
                            match_date: new Date().toISOString()
                        });
                    })
                    .catch((error) => {
                        console.error('Score update error:', error);
                        reply.status(500).send({ error: 'Score update failed' });
                    });
            });
    
        } catch (error) {
            console.error('Server error:', error);
            reply.status(500).send({ error: 'Server error' });
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