const fs = require('fs');
const path = require('path');
const dbModule = require('../db/user');
const authenticateJWT = require('../auth/jwt');

async function profileRoute(fastify, options) {
  const db = fastify.db;
  
  fastify.get('/profile/send', async (request, reply) => {
    try {
        // 1️⃣ `/auth/check` API 호출하여 JWT 검증
        const authResponse = await fastify.inject({
            method: 'GET',
            url: '/auth/check',
            cookies: request.cookies // 현재 요청의 쿠키를 전달
        });

        const authData = authResponse.json();
        if (!authData.authenticated) {
            return reply.redirect('/');
        }

        // 2️⃣ 인증된 사용자 정보 가져오기
        const user = await dbModule.getUserByEmail(db, authData.user.email);
        if (!user) {
            return reply.status(404).send({ error: "사용자를 찾을 수 없습니다." });
        }

        // 3️⃣ 사용자 프로필 정보 응답
        return reply.send({
            nickname: user.nickname || user.username,
            profile_picture: user.profile_picture || ""
        });
    } catch (error) {
        console.error("🚨 프로필 정보 가져오기 오류:", error);
        return reply.status(500).send({ error: "서버 오류 발생" });
    }
  });

  fastify.post('/profile/save', { preHandler: authenticateJWT.authenticateJWT}, async (request, reply) => {
      try {
        let nickname;
        let profilePicturePath;
        
        const uploadDir = '/app/uploads';
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir);
        }

        const parts = request.parts();
        for await (const part of parts) {
          if (part.fieldname === 'nickname') {
            nickname = part.value;
            const isNicknameTaken = await dbModule.checkNicknameExists(db, nickname);
    
            if (isNicknameTaken) {
                console.log('이미 존재하는 닉네임입니다.');
                return reply.status(409).send({ error: '이미 존재하는 닉네임입니다.' });
            }
          } else if (part.fieldname === 'profile_picture' && part.filename) {

            // 고유 파일명 생성: 타임스탬프와 원본 파일명을 사용
            const filename = Date.now() + '_' + part.filename;
            profilePicturePath = `/uploads/${filename}`; // 상대 경로 저장

            // 파일을 저장할 스트림 생성 및 파이핑
            const filePath = path.join(uploadDir, filename);
            const writeStream = fs.createWriteStream(filePath);
            await part.file.pipe(writeStream);
            console.log('File saved to:', profilePicturePath);
          }
        }

      if (!nickname || !profilePicturePath) {
        console.log('닉네임 또는 프로필 사진 데이터가 누락되었습니다.');
        return reply.status(400).send({ error: '닉네임과 프로필 사진(이미지) 모두 필요합니다.' });
      }

      const result = await dbModule.updateInfo(db, request.session.userInfo.email, nickname, profilePicturePath);
      
      // 성공 응답 전송
      return reply.send({
        id: result.id,
        nickname: result.nickname,
        message: '프로필이 성공적으로 저장되었습니다.',
        success: true
      });
    } catch (err) {
      console.error('프로필 저장 중 오류:', err);
      return reply.status(500).send({ error: err.message });
    }
  });
}

module.exports = profileRoute;