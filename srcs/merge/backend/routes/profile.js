const fs = require('fs');
const path = require('path');
const dbModule = require('../db/user');

async function profileRoute(fastify, options) {
  const db = fastify.db;
  
  fastify.get('/profile/send', async (request, reply) => {
    try {
        const authResponse = await fastify.inject({
            method: 'GET',
            url: '/auth/check',
            cookies: request.cookies
        });

        const authData = authResponse.json();
        if (!authData.authenticated) {
            return reply.redirect('/');
        }

        const user = await dbModule.getUserByEmail(db, authData.user.email);
        if (!user) {
            return reply.status(404).send({ error: "사용자를 찾을 수 없습니다." });
        }

        return reply.send({
            nickname: user.nickname || user.username,
            profile_picture: user.profile_picture || ""
        });
    } catch (error) {
        console.error("🚨 프로필 정보 가져오기 오류:", error);
        return reply.status(500).send({ error: "서버 오류 발생" });
    }
  });

  fastify.post('/profile/save', async (request, reply) => {
      try {
        let nickname;
        let profilePicturePath;
        
        const uploadDirs = ['/app/dist/uploads', '/app/public/uploads']; // ✅ 두 개의 디렉토리 저장

        // 각 업로드 폴더가 존재하지 않으면 생성
        for (const dir of uploadDirs) {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        }

        const parts = request.parts();
        for await (const part of parts) {
          if (part.fieldname === 'nickname') {
            nickname = part.value;
            const isNicknameTaken = await dbModule.checkNicknameExists(db, nickname);
    
            if (isNicknameTaken) {
                console.log('이미 존재하는 닉네임입니다.');
                // Pause -> resume
                return reply.status(409).send({ error: '이미 존재하는 닉네임입니다.' });
            }
          } else if (part.fieldname === 'profile_picture' && part.filename) {

            // 고유 파일명 생성: 타임스탬프와 원본 파일명을 사용
            const filename = Date.now() + '_' + part.filename;
            profilePicturePath = `/uploads/${filename}`; // 이게 db에 저장하는건지?

            // ✅ 두 개의 디렉토리에 파일 저장
            for (const dir of uploadDirs) {
              const filePath = path.join(dir, filename);
              const writeStream = fs.createWriteStream(filePath);
              await part.file.pipe(writeStream);
              console.log(`File saved to: ${filePath}`);
            }
          }
        }

      if (!nickname && !profilePicturePath) {
        console.log('데이터가 누락되었습니다.');
        return reply.status(409).send({ error: '데이터가 필요합니다.' });
      }

      if (nickname.startsWith('AI')) {
        console.log('AI 닉네임 사용 불가');
        return reply.status(409).send({ error: 'AI 닉네임 사용 불가' });
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