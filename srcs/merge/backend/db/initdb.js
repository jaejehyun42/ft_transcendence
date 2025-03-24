const fp = require('fastify-plugin');
const sqlite3 = require('sqlite3').verbose();

const userTableSql = `
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT,
    nickname TEXT UNIQUE,
    email TEXT,
    profile_picture TEXT,
    otp_secret TEXT,
    refresh_token TEXT
);
`;

const gameTableSql = `
CREATE TABLE IF NOT EXISTS gamedb (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  ai_win INTEGER DEFAULT 0,
  ai_lose INTEGER DEFAULT 0,
  human_win INTEGER DEFAULT 0,
  human_lose INTEGER DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
`;

const matchHistoryTableSql = `
CREATE TABLE IF NOT EXISTS matchhistory (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user1 INTEGER,
    user2_nickname TEXT,
    user1_score INTEGER DEFAULT 0,
    user2_score INTEGER DEFAULT 0,
    match_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user1) REFERENCES users(id) ON DELETE CASCADE
);
`;

function insertAIUser(db) {
	return new Promise((resolve, reject) => {
		// 먼저 AI 유저 존재 여부 확인
		db.get(`SELECT id FROM users WHERE username = 'AI' AND nickname = 'AI'`, (err, row) => {
			if (row) {
				console.log('ℹ️ AI 유저가 이미 존재합니다. 삽입을 생략합니다.');
				return resolve(); // 이미 존재하면 종료
			}

			// 존재하지 않을 경우 삽입 진행
			db.run(
				`INSERT INTO users (username, nickname, email, profile_picture) VALUES ('AI', 'AI', 'ai@pong.com', '/AI_player')`,
				function (err) {
					if (err) {
						console.error('❌ AI 유저 추가 실패:', err.message);
						return reject(err);
					}
					const aiUserId = this.lastID;
					console.log(`✅ AI 유저 추가 완료 (ID: ${aiUserId})`);

					db.run(`INSERT INTO gamedb (user_id) VALUES (?)`, [aiUserId], (err) => {
						if (err) {
							console.error('❌ gamedb 삽입 실패:', err.message);
							return reject(err);
						}
						console.log('✅ gamedb에 AI 유저 등록 완료');
						resolve();
					});
				}
			);
		});
	});
}

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
  
function runAsync(db, sql) {
	return new Promise((resolve, reject) => {
		db.run(sql, (err) => {
			if (err) return reject(err);
			resolve();
		});
	});
}

async function initTables(db){
	await runAsync(db, userTableSql);
	await runAsync(db, gameTableSql);
	await runAsync(db, matchHistoryTableSql);
	await insertAIUser(db);
}

// Fastify 플러그인으로 데이터베이스 초기화
async function dbPlugin(fastify, options) {
    try {
        const dbPath = '/data/mydb.sqlite';
        const db = await connectDB(dbPath);
        await initTables(db); 
        fastify.decorate('db', db); // Fastify 인스턴스에 db를 등록
    } catch (err) {
        console.error('데이터베이스 초기화 오류:', err.message);
        process.exit(1);
    }
}

module.exports = fp(dbPlugin);
