const authenticateJWT = require('../auth/jwt');
const db = fastify.db;

fastify.get('/api/users/:id', async (request, reply) => {
    try {
        const { id } = request.params;

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
