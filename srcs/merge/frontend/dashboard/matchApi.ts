import { createHistoryBox } from "./match_history.js"

type MatchData = {
	user1: string;
	user2: string;
	user1_score: number;
	user2_score: number;
	match_date: string; // ISO 날짜 문자열
};

async function fetchRecentMatches() {
    try {
        const res = await fetch('/api/match-history/latest');
        if (!res.ok) 
            throw new Error(`HTTPS ${res.status}`);
        const data = await res.json();
        console.log("🎮 최근 경기 5개:", data);
        return data;
    } catch (err) {
        console.error('❌ 경기 데이터 불러오기 실패:', err);
        return [];
    }
}

export async function getProfilePictureByNickname(nickname: string) {
	try {
		const res = await fetch(`/api/users/${encodeURIComponent(nickname)}`, {
			method: 'GET',
			headers: { 'Content-Type': 'application/json' },
		});

		if (!res.ok) {
			throw new Error(`❌ 사용자 정보 조회 실패: ${res.status}`);
		}

		const data = await res.json();
		console.log('✅ 프로필 이미지:', data.profile_picture);
		return data.profile_picture;
	} catch (err) {
		console.error('❌ 프로필 이미지 가져오기 실패:', err);
		return null;
	}
}

export async function loadMatchHistory() {
	try {
		const matches = await fetchRecentMatches(); // 🔹 5개의 경기 기록 가져오기

		matches.forEach((match: MatchData) => {
			const { user1, user2, user1_score, user2_score, match_date } = match;

			// 🔸 날짜 문자열 → timestamp 변환 (선택 사항)
			const timestamp = new Date(match_date).getTime();

			createHistoryBox(user1, user2, user1_score, user2_score, timestamp);
		});
	} catch (err) {
		console.error('❌ 경기 히스토리 박스 생성 중 오류:', err);
	}
}