async function addMatchHistory(db, user1Id, user2_nickname, user1Score, user2Score) {
	try {
		return new Promise((resolve, reject) => {
			const sql = `
				INSERT INTO matchhistory (user1, user2_nickname, user1_score, user2_score)
				VALUES (?, ?, ?, ?)
			`;

			db.run(sql, [user1Id, user2_nickname, user1Score, user2Score], function (err) {
				if (err) {
					console.error('❌ 경기 기록 추가 오류:', err.message);
					reject(err);
				} else {
					console.log(`✅ 경기 기록 추가 완료 (Match ID: ${this.lastID})`);
					resolve(this.lastID);
				}
			});
		});
	} catch (error) {
		console.error('❌ addMatchHistory 오류:', error);
		throw error;
	}
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
    addMatchHistory,
    getRecentMatches
}