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
		{ expiresIn: '1d' }
	  );
	
	  return { accessToken, refreshToken };
}

function setAuthCookies(reply, accessToken, refreshToken) {
    // ✅ 액세스 토큰 → 쿠키 저장
    reply.setCookie('access_token', accessToken, { 
        httpOnly: true, 
        secure: true, 
        sameSite: 'Lax', 
        path: '/', // 모든 경로에서 쿠키 접근 가능
        maxAge: 15 * 60 // 15분 (초 단위)
    });

    // ✅ 리프레시 토큰 → 쿠키 저장
    reply.setCookie('refresh_token', refreshToken, { 
        httpOnly: true, 
        secure: true, 
        sameSite: 'Lax', 
        path: '/', // 모든 경로에서 쿠키 접근 가능
        maxAge: 7 * 24 * 60 // 7일 (초 단위)
    });
}

async function authenticateJWT(request, reply) {
    try {
        const accessToken = request.cookies.access_token; 
        const refreshToken = request.cookies.refresh_token;

        if (!accessToken || !refreshToken) {
            console.log("🚨 토큰 없음, 로그인 필요");
            return reply.redirect('/login');
        }

        let decoded;
        try {
            decoded = jwt.verify(accessToken, process.env.JWT_SECRET);
        } catch (error) {
            if (error.name === 'TokenExpiredError') {
                console.log("🔄 Access Token 만료, Refresh Token으로 갱신 시도");
            } else {
                console.log("🚨 Access Token이 유효하지 않음:", error.message);
                return reply.redirect('/login');
            }
        }

        const db = request.server.db;
        const user = await dbModule.getUserByRefreshToken(db, refreshToken);
        if (!user) {
            console.log("🚨 Refresh Token이 DB에 없음, 다시 로그인 필요");
            return reply.redirect('/login');
        }

        // ✅ Access Token 재발급 (인증할 때마다 연장)
        const newAccessToken = jwt.sign(
            { userId: user.id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '15m' } // Access Token 15분 유지
        );

        reply.setCookie('accessToken', newAccessToken, {
            httpOnly: true,
            secure: true,
            sameSite: 'Strict',
            maxAge: 15 * 60 * 1000 // 15분
        });

        request.user = { userId: user.id, email: user.email }; // 유저 정보 저장
        return;
    } catch (error) {
        console.error("🚨 JWT 인증 오류:", error);
        return reply.redirect('/login');
    }
}

module.exports = { generateJWT, setAuthCookies, authenticateJWT };