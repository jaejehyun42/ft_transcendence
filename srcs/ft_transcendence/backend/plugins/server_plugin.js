const fastifySession = require('@fastify/session');
const fastifyCookie = require('@fastify/cookie');
const fastifyMultipart = require('@fastify/multipart');
const fastifySwagger = require('@fastify/swagger');
const fastifySwaggerUi = require('@fastify/swagger-ui');
const registerGoogleOAuth = require('../auth/oauth.js');

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

module.exports = function (app) {
    // 세션 및 쿠키 설정
    app.register(fastifyCookie);
    app.register(fastifySession, {
        secret: 'a secret with minimum length of 32 characters',
		cookie: {
			secure: true,
			httpOnly: true,
			sameSite: 'lax'
		}
    });
    
    app.register(require('@fastify/cors'), {
		origin: true,
		credentials: true, // 쿠키를 포함한 요청 허용
	  });

    app.register(fastifyMultipart);

    app.register(registerGoogleOAuth, {
        GOOGLE_CLIENT_ID,
        GOOGLE_CLIENT_SECRET
    });  

    app.register(require('@fastify/view'), {
    engine: {
        ejs: require('ejs')
    }
    });


app.register(fastifySwagger, {
    swagger: {
      info: {
        title: 'Fastify API',
        description: 'Swagger API docs',
        version: '1.0.0'
      },
      host: 'localhost:3000',
      schemes: ['http', 'https'],
      consumes: ['application/json'],
      produces: ['application/json'],
    }
  });
  
  app.register(fastifySwaggerUi, {
    routePrefix: '/docs', // Swagger 문서를 볼 경로
  });
}