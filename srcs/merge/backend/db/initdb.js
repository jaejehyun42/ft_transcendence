const fp = require('fastify-plugin');
const sqlite3 = require('sqlite3').verbose();

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
              user1 TEXT,
              user2 TEXT,
              user1_score INTEGER DEFAULT 0,
              user2_score INTEGER DEFAULT 0,
              match_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );
        `;
  
        db.serialize(() => {
            db.run(userTableSql, (err) => {
            if (err) {
                  console.error('users 테이블 생성 오류:', err.message);
                  reject(err);
                  return;
            }
            console.log('users 테이블 생성 성공');
  
            db.run(gameTableSql, (err) => {
                if (err) {
                    console.error('gamedb 테이블 생성 오류:', err.message);
                    reject(err);
                } else {
                    console.log('gamedb 테이블 생성 성공');
                    resolve();
                }
            });
  
            db.run(matchHistoryTableSql, (err) => {
                if (err) {
                    console.error('matchhistory 테이블 생성 오류:', err.message);
                    reject(err);
                } else {
                    console.log('matchhistory 테이블 생성 성공');
                    resolve();
                }
            });
        });
    });
});
}

// Fastify 플러그인으로 데이터베이스 초기화
async function dbPlugin(fastify, options) {
    try {
        const dbPath = '/data/mydb.sqlite';
        const db = await connectDB(dbPath);
        await createTable(db);
        fastify.decorate('db', db); // Fastify 인스턴스에 db를 등록
    } catch (err) {
        console.error('데이터베이스 초기화 오류:', err.message);
        process.exit(1);
    }
}

module.exports = fp(dbPlugin);
