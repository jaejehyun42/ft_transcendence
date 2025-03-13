const sqlite3 = require('sqlite3').verbose();
const fp = require('fastify-plugin');

// 데이터베이스 연결 함수
async function connectDB(dbPath) {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('데이터베이스 연결 오류:', err.message);
        reject(err);
      } else {
        console.log('SQLite 데이터베이스에 연결되었습니다.');
        resolve(db);
      }
    });
  });
}

// 테이블 생성 함수 (애플리케이션 시작 시 한 번만 호출)
async function createTable(db) {  
	return new Promise((resolve, reject) => {
	  const sql = `
		CREATE TABLE IF NOT EXISTS users (
		  id INTEGER PRIMARY KEY AUTOINCREMENT,
		  username TEXT UNIQUE,
		  nickname TEXT UNIQUE,
		  email TEXT,
		  profile_picture TEXT,
		  otp_secret TEXT
		)
	  `;
	  db.run(sql, (err) => {
		if (err) {
		  console.error('테이블 생성 오류:', err.message);
		  reject(err);
		} else {
		  console.log('테이블 생성 성공');
		  resolve();
		}
	  });
	});
  }

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
		} else {
		  console.log(`사용자 ${username} 추가 성공`);
		  resolve();
		}
	  });
	});
  }

// NICKNAME ADD
async function addNick(db, nickname, profile_picture) { 
	return new Promise((resolve, reject) => {
		const sql = `INSERT INTO users (nickname, profile_picture) VALUES (?, ?)`;
		db.run(sql, [nickname, profile_picture], function (err) {
		if (err) {
			console.error('사용자 nickname 정보 추가 오류:', err.message);
			reject(err);
		} else {
			console.log(`사용자 ${nickname} 추가 성공`);
			resolve({ id: this.lastID, nickname });
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

// Fastify 플러그인으로 데이터베이스 초기화
async function dbPlugin(fastify, options) {
  try {
    const dbPath = '/data/mydb.sqlite';
    const db = await connectDB(dbPath);
    await createTable(db);
    console.log('데이터베이스 초기화 완료');
    fastify.decorate('db', db); // Fastify 인스턴스에 db를 등록
  } catch (err) {
    console.error('데이터베이스 초기화 오류:', err.message);
    process.exit(1);
  }
}

module.exports = {
	dbPlugin: fp(dbPlugin), // fastify-plugin으로 감싸서 export
	executeQuery,
	addUser,
	addNick,
	getUserByEmail,
	updateOtpSecret
  };