const dbModule = require('../db/user');
const authenticateJWT = require('../auth/jwt');

fastify.get('/api/users/:id', async (request, reply) => {
    try {
        const { id } = request.params;
        const db = await initDB();

        // 사용자 정보 조회
        const user = await db.get('SELECT nickname, profile_picture FROM users WHERE id = ?', [id]);

        if (!user) {
            return reply.status(404).send({ error: 'User not found' });
        }

        return reply.send(user);
    } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send({ error: 'Database query failed' });
    }
});
