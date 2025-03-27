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
    
            if (!user1) {
                return reply.status(400).send({ error: 'User names are required' });
            }
    
            // 유저 ID 조회
            const user1Id = await dbModule.getUserIdByNickname(db, user1).catch(() => null);
    
            if (!user1Id) {
                console.log(`⚠️ 유저 "${user1}"를 찾을 수 없음. null 반환`);
                return reply.send({ user1: null }); // ✨ null 반환
            }
    
            await addMatchHistory(db, user1Id, user2, user1_score, user2_score);
    
            const result = user1_score > user2_score ? 'win' : 'lose';
            const playerType = user2.startsWith('AI') ? 'ai' : 'human';
    
            await gameModule.updateScore(db, user1Id, playerType, result);
    
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
            const userInfo = request.session.userInfo;
            const user = await dbModule.getUserByEmail(db, userInfo.email);
            const rows = await new Promise((resolve, reject) => {
                const sql = `
                    SELECT 
                        u1.nickname AS user1_nickname,
                        m.user2_nickname,
                        m.user1_score,
                        m.user2_score,
                        m.match_date
                    FROM matchhistory m
                    JOIN users u1 ON m.user1 = u1.id
                    WHERE m.user1 = ?
                    ORDER BY m.match_date DESC
                    LIMIT 5
                `;
                db.all(sql, [user.id], (err, rows) => {
                    if (err) {
                        console.error("❌ matchhistory 조회 오류:", err.message);
                        return reject(new Error("DB 조회 실패"));
                    }
                    console.log(rows);
                    resolve(rows);
                });
            });
            reply.send(rows);
        } catch (error) {
            console.error("❌ 최신 경기 조회 서버 오류:", error.message);
            reply.status(500).send({ error: '서버 오류로 경기 데이터를 가져올 수 없습니다.' });
        }
    });
}

module.exports = matchHistoryRoute;