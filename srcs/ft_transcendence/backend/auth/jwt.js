const jwt = require('jsonwebtoken');
const dbModule = require('../db/user');

const JWT_SECRET = process.env.JWT_SECRET ;
const REFRESH_SECRET = process.env.REFRESH_SECRET;
// JWT 생성 함수
function generateJWT(user) {
	const accessToken = jwt.sign(
		{ id: user.id, email: user.email },
		JWT_SECRET,
		{ expiresIn: '15m' }
	  );
	
	  const refreshToken = jwt.sign(
		{ id: user.id },
		REFRESH_SECRET,
		{ expiresIn: '60m' }
	  );
	
	  return { accessToken, refreshToken };
}

function setAuthCookies(reply, accessToken, refreshToken) {
    // ✅ 액세스 토큰 → 쿠키 저장
    reply.setCookie('access_jwt', accessToken, { 
        httpOnly: true, 
        secure: true, 
        sameSite: 'Lax', 
        path: '/', // 모든 경로에서 쿠키 접근 가능
        maxAge: 15 * 60 * 1000 // 15분 (초 단위)
    });

    // ✅ 리프레시 토큰 → 쿠키 저장
    reply.setCookie('refresh_jwt', refreshToken, { 
        httpOnly: true, 
        secure: true, 
        sameSite: 'Lax', 
        path: '/', // 모든 경로에서 쿠키 접근 가능
        maxAge: 60 * 60 * 1000 // 1시간 (초 단위)
    });
}

module.exports = { generateJWT, setAuthCookies };