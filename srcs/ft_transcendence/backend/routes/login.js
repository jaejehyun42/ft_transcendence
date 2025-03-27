const axios = require('axios');
const otp = require('../auth/otp.js');
const dbModule = require('../db/user');
const qrcode = require('qrcode');
const { generateJWT, setAuthCookies } = require('../auth/jwt');

async function loginRoute(fastify, options) {
	fastify.get('/oauth/login', async (request, reply) => {
		return reply.redirect('/login/google');
    });
	
	fastify.get('/login/success', async (request, reply) => {
		const accessToken = request.session.accessToken;
		try {
		  const response = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
			headers: { Authorization: `Bearer ${accessToken}` }
		  });
		  const userInfo = response.data;
	  
		  // 사용자 정보를 처리합니다.
		  request.session.userInfo = {
			username: userInfo.name,
			email: userInfo.email
		  };
		  return reply.redirect('/db-save');
		} catch (error) {
			console.error('Error fetching user info:', error);
			// 만약 accessToken이 만료되었다면 refreshToken을 사용하여 갱신합니다.
			if (error.response.status === 401) {
				const refreshToken = request.session.refreshToken;
				const newTokenResponse = await axios.post('https://oauth2.googleapis.com/token', {
					grant_type: 'refresh_token',
					refresh_token: refreshToken,
					client_id: clientId,
					client_secret: clientSecret
				});
			
				const newAccessToken = newTokenResponse.data.access_token;
				request.session.accessToken = newAccessToken;		
				// 갱신된 accessToken으로 다시 시도합니다.
				return reply.redirect('/login/success');
			}
			return reply.redirect('/fail');
		}
	});

	fastify.get('/db-save', async (request, reply) => {
		const userInfo = request.session.userInfo;
	
		if (!userInfo || !userInfo.email) {
		console.error('userInfo 또는 email 속성이 없습니다.');
		request.session.errorMessage = '사용자 정보가 없습니다.';
		return reply.send({ success: true, userName: userInfo.name, email: userInfo.email });
		}

		request.session.user = {
			id: userInfo.id,
			email: userInfo.email,
			nickname: userInfo.id || "User",
			profile_picture: userInfo.profile_picture || "/Basic_image.webp"
		};
	
		const db = fastify.db;
	
		try {
			const existingUser = await dbModule.executeQuery(
			db,
			'SELECT id FROM users WHERE email = ?',
			[userInfo.email]
			);
		
			if (existingUser.length > 0) {
				request.session.successMessage = '이미 존재하는 이메일입니다.';
				return reply.redirect("/otp"); // ✅ 브라우저 직접 접근 시 OTP 페이지로 이동
				//return reply.send({ success: true, userName: userInfo.name, email: userInfo.email });
			} else {
				await dbModule.addUser(db, userInfo.username, null, userInfo.email);
				request.session.successMessage = '로그인 성공!';
				return reply.redirect("/otp");
				//return reply.send({ success: true, userName: userInfo.name, email: userInfo.email });
			}
		} catch (dbError) {
			request.session.errorMessage = '데이터베이스 오류가 발생했습니다.';
			return reply.redirect("/");
			//return reply.send({ success: true, userName: userInfo.name, email: userInfo.email }); // succcess: false?
		}
	});

	fastify.get('/generate-qr', async (request, reply) => {
		const userInfo = request.session.userInfo;
		if (!userInfo || !userInfo.email) {
			return reply.status(400).send({ success: false, message: '사용자 정보가 없습니다.' });
		}
	
		const db = fastify.db;
		try {
			// 1. 데이터베이스에서 기존 사용자 조회
			const existingUser = await dbModule.getUserByEmail(db, userInfo.email);
	
			let secret, qrCodeDataUrl;
			if (existingUser && existingUser.otp_secret) {
			  // 기존 사용자면 OTP 시크릿 유지
			  secret = { base32: existingUser.otp_secret };
			  qrCodeDataUrl = await qrcode.toDataURL(`otpauth://totp/ft_transcendence?secret=${secret.base32}`);
			} else {
			  // 신규 사용자면 OTP 시크릿 생성 후 DB 저장
			  const otpData = await otp.generateOTP();
			  secret = otpData.secret;
			  qrCodeDataUrl = otpData.qrCodeDataUrl;
			  await dbModule.updateOtpSecret(db, userInfo.email, secret.base32);
			}
		
			// 2. QR 코드 반환
			request.session.otpSecret = secret.base32;
			reply.type('image/png').send(Buffer.from(qrCodeDataUrl.split(',')[1], 'base64'));
		  } catch (error) {
			console.error('OTP 생성 오류:', error);
			reply.status(500).send({ success: false, message: 'OTP 생성 오류 발생' });
		  }
	});

	fastify.post('/verify', async (request, reply) => {
		const db = fastify.db;
		const { token } = request.body;
		const userInfo = request.session.userInfo;
		const secret = request.session.otpSecret;
	
		if (!token || !secret) {
			return reply.status(400).send({ success: false, message: '토큰 또는 시크릿이 없습니다.' });
		}
		
		const existingUser = await dbModule.getUserByEmail(db, userInfo.email);
		if (!existingUser || !existingUser.id) {
			return reply.status(500).send({ success: false, message: '사용자 ID를 가져올 수 없습니다.' });
		}
		if (!existingUser.otp_secret) {
            return reply.status(400).send({ success: false, message: 'OTP 시크릿이 없습니다.' });
        }

		try {
			const isValid = otp.verifyOTP(token, { base32: secret });
	
			if (isValid) {
				// OTP 인증 성공 -> JWT 발급
                const userId = existingUser.id;
                const { accessToken, refreshToken } = generateJWT({ userId, email: userInfo.email });
                setAuthCookies(reply, accessToken, refreshToken);
                await dbModule.saveRefreshToken(db, userId, refreshToken);
				return reply.send({ success: true, message: 'OTP 인증 성공' }); // ✅ JSON 응답 반환
			} else {
				return reply.status(401).send({ success: false, message: 'OTP 인증 실패' });
			}
		} catch (error) {
			fastify.log.error('❌ OTP 검증 중 오류 발생:', error);
			return reply.status(500).send({ success: false, message: 'OTP 검증 중 오류 발생: ' + error.message });
		}
	});	  

    fastify.get('/fail', async (request, reply) => {
        return 'fail!';
    });
}

module.exports = loginRoute;