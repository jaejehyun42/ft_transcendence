const fs = require('fs');
const path = require('path');
const dbModule = require('../db/user');
const authenticateJWT = require('../auth/jwt');

async function profileRoute(fastify, options) {
  fastify.get('/profile', { preHandler: authenticateJWT.authenticateJWT }, async (request, reply) => {
    try {
        const user = request.session.user;
        if (!user) {
            return reply.status(401).send({ error: "인증이 필요합니다." });
        }

        return reply.send({
            nickname: user.nickname || "",
            profile_picture: user.profile_picture || ""
        });
    } catch (error) {
        console.error("프로필 정보 가져오기 오류:", error);
        return reply.status(500).send({ error: "프로필 정보를 가져오는 중 오류가 발생했습니다." });
    }
});

  fastify.post('/profile/save',  {}, async (request, reply) => {
      try {
        let nickname;
        let profilePicturePath;
        
        const uploadDir = '/app/public/uploads';
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir);
        }

        const parts = request.parts();
        for await (const part of parts) {
          if (part.fieldname === 'nickname') {
            nickname = part.value;
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

      const db = fastify.db;
                
      const result = await dbModule.addNick(db, nickname, profilePicturePath);

      return reply.send({
        id: result.id,
        nickname: result.nickname,
        message: '프로필이 성공적으로 저장되었습니다.',
        success: true
      });
    } catch (err) {
      console.error('프로필 저장 중 오류:', err);
      if (err && err.code === 'SQLITE_CONSTRAINT') {
        return reply.status(409).send({ error: '이미 존재하는 닉네임입니다.'});
      }
      return reply.status(500).send({ error: err.message });
    }
  });

  fastify.get('/logout', async (request, reply) => {
    try {
      if (request.session.accessToken) {
      const revokeUrl = `https://accounts.google.com/o/oauth2/revoke?token=${request.session.accessToken}`;
    
      // Google에 액세스 토큰 무효화 요청
      await fetch(revokeUrl, { method: 'POST' }).catch(err => console.error('Google 토큰 무효화 실패:', err));
      }
    
      // Fastify 세션 삭제 (올바른 방식)
      request.session.destroy(err => {
      if (err) {
        console.error('세션 삭제 중 오류:', err);
        return reply.status(500).send({ error: '세션 삭제 실패' });
      }
      
      // 클라이언트에서 Google 로그아웃을 실행하도록 /logout-client로 리디렉트
      return reply.redirect('/login');
      });
    
    } catch (error) {
      console.error('로그아웃 중 오류:', error);
      return reply.status(500).send({ error: '로그아웃 실패' });
    }
    });
  }

module.exports = profileRoute;