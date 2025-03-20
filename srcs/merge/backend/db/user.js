async function executeQuery(db, sql, params = []) { 
	return new Promise((resolve, reject) => {
	  db.all(sql, params, (err, rows) => {
		if (err) {
		  console.error('쿼리 실행 오류:', err.message);
		  reject(err);
		} else {
		  resolve(rows);
		}
	  });
	});
}

// 사용자 정보 추가 함수
async function addUser(db, username, email) { 
	return new Promise((resolve, reject) => {
	  const sql = `INSERT INTO users (username, email) VALUES (?, ?)`;
	  db.run(sql, [username, email], (err) => {
		if (err) {
		  console.error('사용자 정보 추가 오류:', err.message);
		  reject(err);
		  return;
		}		
		console.log(`사용자 ${username} 추가 성공`);
		console.log('ID:', this.lastID);

		// 해당 유저의 기본 게임 데이터 추가
		const gameSql = `INSERT INTO gamedb (user_id) VALUES (?)`;
		db.run(gameSql, [this.lastID], function (err) {
		  if (err) {
			console.error('게임 데이터 추가 오류:', err.message);
			reject(err);
		  } else {
			console.log('게임 데이터 추가 성공');
			resolve(this.lastID);
		  }
		});
	  });
	});
}

async function checkNicknameExists(db, nickname) {
    return new Promise((resolve, reject) => {
        const sql = `SELECT email FROM users WHERE nickname = ?`;

        db.get(sql, [nickname], (err, row) => {
            if (err) {
                console.error('닉네임 중복 검사 오류:', err.message);
                reject(err);
                return;
            }
			resolve(!!row);
        });
    });
}

async function updateInfo(db, email, newNickname, newProfilePicture) { 
    return new Promise((resolve, reject) => {
		const sql = `
		UPDATE users 
		SET 
			nickname = COALESCE(?, nickname), 
			profile_picture = COALESCE(?, profile_picture) 
		WHERE email = ?
		`;

        db.run(sql, [newNickname, newProfilePicture, email], function (err) {
            if (err) {
                console.error('사용자 nickname 업데이트 오류:', err.message);
                reject(err);
            } else if (this.changes === 0) { 
                reject(new Error(`User with email ${email} not found`));
            } else {
                console.log(`사용자 ${email} 닉네임 변경 완료: ${newNickname}`);
                resolve({ email, nickname: newNickname });
            }
        });
    });
}

async function getUserByEmail(db, email) {
	return new Promise((resolve, reject) => {
		const sql = `SELECT * FROM users WHERE email = ?`;
		db.get(sql, [email], (err, row) => {
			if (err) {
				console.error('사용자 조회 오류:', err.message);
				reject(err);
			} else {
				resolve(row);
			}
		});
	});
}

async function getUserByRefreshToken(db, refreshToken) {
    const query = 'SELECT id, email FROM users WHERE refresh_token = ?';
    const results = await executeQuery(db, query, [refreshToken]);

    if (results.length > 0) {
        return results[0]; // 첫 번째 결과 반환 (유저 정보)
    }
    return null;
}

// OTP 시크릿 업데이트
async function updateOtpSecret(db, email, otpSecret) {
	return new Promise((resolve, reject) => {
	  const sql = `UPDATE users SET otp_secret = ? WHERE email = ?`;
	  db.run(sql, [otpSecret, email], function (err) {
		if (err) {
		  console.error('OTP 시크릿 업데이트 오류:', err.message);
		  reject(err);
		} else if (this.changes === 0) {  // 변경된 행이 없으면 로그 출력
		  console.warn(`OTP 시크릿 업데이트 실패: 사용자 ${email} 없음`);
		  resolve(false);
		} else {
		  console.log(`OTP 시크릿 업데이트 성공: ${email}`);
		  resolve(true);
		}
	  });
	});
}

async function saveRefreshToken(db, userId, refreshToken) {
    return new Promise((resolve, reject) => {
        const query = `UPDATE users SET refresh_token = ? WHERE id = ?`;
        db.run(query, [refreshToken, userId], function (err) {
            if (err) {
                console.error('리프레시 토큰 저장 오류:', err.message);
                reject(err);
            } else {
                console.log(`리프레시 토큰 저장 성공 (User ID: ${userId})`);
                resolve(true);
            }
        });
    });
}

async function invalidateRefreshToken(db, refreshToken) {
    return new Promise((resolve, reject) => {
        const query = `DELETE FROM users WHERE refresh_token = ?`;
        db.run(query, [refreshToken], function (err) {
            if (err) {
                console.error('리프레시 토큰 무효화 오류:', err.message);
                reject(err);
            } else {
                console.log(`리프레시 토큰 무효화 성공 (Refresh Token: ${refreshToken})`);
                resolve(true);
            }
        });
    });
}

module.exports = {
	executeQuery,
	addUser,
	checkNicknameExists,
	updateInfo,
	getUserByRefreshToken,
	getUserByEmail,
	updateOtpSecret,
	saveRefreshToken,
	invalidateRefreshToken
};
