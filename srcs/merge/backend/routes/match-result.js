const authenticateJWT = require('../auth/jwt');
const db = fastify.db;

fastify.post('/api/match-results', async (request, reply) => {
    try {
        const { user1, user2, user1_score, user2_score } = request.body;

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
            updateScore(db, user1, user2 == 'ai' ? 'al' : 'human', user1_score > user2_score ? 'win' : 'lose')
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