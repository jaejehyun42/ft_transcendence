// userId??
// user = getUserByEmail(db, email);
// userId = user.id

// 사용예시
// const aiScore = await getScoreData(db, userId, 'ai'); AI 상대 전적 가져오기
// const humanScore = await getScoreData(db, userId, 'human'); 인간 상대 전적 가져오기

async function getScoreData(db, userId, type) {
	return new Promise((resolve, reject) => {
	  let sql;

	  // type에 따라 SQL 문을 동적으로 생성
	  if (type === 'ai') {
		sql = `SELECT ai_win AS win, ai_lose AS lose FROM gamedb WHERE user_id = ?`;
	  } else if (type === 'human') {
		sql = `SELECT human_win AS win, human_lose AS lose FROM gamedb WHERE user_id = ?`;
	  } else {
		reject(new Error('Invalid type: Use "ai" or "human"'));
		return;
	  }

	  db.get(sql, [userId], (err, row) => {
		if (err) {
		  console.error('게임 데이터 조회 오류:', err.message);
		  reject(err);
		} else {
		  resolve(row || { win: 0, lose: 0 });
		}
	  });
	});
}

async function updateScore(db, userId, player, result) {
    return new Promise((resolve, reject) => {
        let sql;

        // AI 또는 Human 선택
        let winColumn, loseColumn;
        if (player === 'ai') {
            winColumn = 'ai_win';
            loseColumn = 'ai_lose';
        } else if (player === 'human') {
            winColumn = 'human_win';
            loseColumn = 'human_lose';
        } else {
            reject(new Error('Invalid player type: Use "ai" or "human"'));
            return;
        }

        // 승리 또는 패배 선택
        if (result === 'win') {
            sql = `
                UPDATE gamedb
                SET ${winColumn} = ${winColumn} + 1
                WHERE user_id = ?
            `;
        } else if (result === 'lose') {
            sql = `
                UPDATE gamedb
                SET ${loseColumn} = ${loseColumn} + 1
                WHERE user_id = ?
            `;
        } else {
            reject(new Error('Invalid result type: Use "win" or "lose"'));
            return;
        }

        db.run(sql, [userId], function (err) {
            if (err) {
                console.error(`${player.toUpperCase()} ${result} 업데이트 오류:`, err.message);
                reject(err);
            } else {
                console.log(`user_id: ${userId} - ${player.toUpperCase()} ${result} 업데이트 완료`);
                resolve();
            }
        });
    });
}

module.exports = {
    getScoreData,
    updateScore
}