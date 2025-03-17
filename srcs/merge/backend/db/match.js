const fp = require('fastify-plugin');
const { dbPlugin } = require('./initdb.js');

//사용 예시 await addMatchHistory(db, 'user1', 'user2', 10, 8);  user1 vs user2 경기 결과: 10 vs 8
async function addMatchHistory(db, user1, user2, user1Score, user2Score) {
	return new Promise((resolve, reject) => {
		const sql = `
			INSERT INTO matchhistory (user1, user2, user1_score, user2_score)
			VALUES (?, ?, ?, ?)
		`;

		db.run(sql, [user1, user2, user1Score, user2Score], function (err) {
			if (err) {
				console.error('경기 기록 추가 오류:', err.message);
				reject(err);
			} else {
				console.log(`경기 기록 추가 완료 (Match ID: ${this.lastID})`);
				resolve(this.lastID);
			}
		});
	});
}

async function getRecentMatches(db) {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT * FROM matchhistory
            ORDER BY match_date DESC
            LIMIT 5
        `;

        db.all(sql, [], (err, rows) => {
            if (err) {
                console.error('최근 경기 기록 조회 오류:', err.message);
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}

module.exports = {
    dbPlugin: fp(dbPlugin),
    addMatchHistory,
    getRecentMatches
}