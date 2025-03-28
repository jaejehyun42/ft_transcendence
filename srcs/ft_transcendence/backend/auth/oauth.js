// oauth.js
const fastifyOauth2 = require('@fastify/oauth2');
const axios = require('axios');


async function exchangeCodeForToken(options, authCode) {
	const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } = options;
	try {
	  const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', {
		grant_type: 'authorization_code',
		code: authCode,
		redirect_uri: 'https://localhost:3000/login/google/callback',
		client_id: GOOGLE_CLIENT_ID,
     	client_secret: GOOGLE_CLIENT_SECRET
	  });
  
	  return tokenResponse.data;
	} catch (error) {
	  throw new Error(`Error exchanging code for token: ${error.message}`);
	}
  }

async function handleGoogleCallback(request, reply, options) {
	const authCode = request.query.code;
	reply.clearCookie('authToken', {     // 기존의 인증 정보를 무효화
		domain: 'localhost',
		path: '/'
	});

	try {
		const tokenData = await exchangeCodeForToken(options, authCode);
		const accessToken = tokenData.access_token;
		const refreshToken = tokenData.refresh_token;
  
	  // accessToken과 refreshToken을 사용하여 사용자 정보를 조회하거나 저장합니다.
		request.session.accessToken = accessToken;
		request.session.refreshToken = refreshToken;

	// 새로운 인증 정보를 저장합니다.
		reply.setCookie('authToken', accessToken, {
		domain: 'localhost',
		path: '/',
		secure: true,
		httpOnly: true
		});
	  return reply.redirect('/login/success');
	} catch (error) {
	  console.error(error);
	  return reply.redirect('/fail');
	}
}

async function registerGoogleOAuth(fastify, options) {
  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } = options;

  fastify.register(fastifyOauth2, {
    name: 'googleOAuth2',
    scope: ['profile', 'email'],
    credentials: {
      client: {
        id: GOOGLE_CLIENT_ID,
        secret: GOOGLE_CLIENT_SECRET
      },
      auth: fastifyOauth2.GOOGLE_CONFIGURATION
    },
    startRedirectPath: '/login/google',
    callbackUri: 'https://localhost:3000/login/google/callback'
  });


  fastify.get('/login/google/callback', async (request, reply) => {
    await handleGoogleCallback(request, reply, options);

  });
}

module.exports = registerGoogleOAuth;
