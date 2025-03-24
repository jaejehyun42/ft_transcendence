async function userInfoRoute(fastify, options){
    const db = fastify.db;

    fastify.get('/api/users/:nickname', async (request, reply) => {
        try {
            const { nickname } = request.params;
    
            const user = await new Promise((resolve, reject) => {
                db.get(
                    'SELECT profile_picture FROM users WHERE nickname = ?', [nickname], (err, row) => {
                        if (err) {
                            reject(err);
                        } else {
                            resolve(row);
                        }
                    }
                );
            });
    
            if (!user) {
                return reply.status(404).send({ error: 'User not found' });
            }
    
            return reply.send({
                profile_picture: user.profile_picture,
            });
        } catch (error) {
            fastify.log.error(error);
            return reply.status(500).send({ error: 'Database query failed' });
        }
    });
}

module.exports = userInfoRoute;