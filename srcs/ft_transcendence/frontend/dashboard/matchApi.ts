import { createHistoryBox, NonMatchHistory } from "./match_history.js"

type MatchData = {
    user1_nickname: string;
    user2_nickname: string;
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
    const AI_PROFILE_PICTURE = "AI_player.png";
    const DEFAULT_PROFILE_PICTURE = "/Basic_image.webp";

	try {
        if (nickname === "AI" || nickname.startsWith('AI'))
            return AI_PROFILE_PICTURE;

		const res = await fetch(`/api/users/${encodeURIComponent(nickname)}`, {
			method: 'GET',
			headers: { 'Content-Type': 'application/json' },
		});

		if (!res.ok) {
			return DEFAULT_PROFILE_PICTURE;
		}

		const data = await res.json();
		return data.profile_picture ?? DEFAULT_PROFILE_PICTURE;
	} catch (err) {
		console.error('❌ 프로필 이미지 가져오기 실패:', err);
		return DEFAULT_PROFILE_PICTURE;
	}
}

export async function loadMatchHistory() {
	try {
		const matches = await fetchRecentMatches(); // 🔹 5개의 경기 기록 가져오기

		if (matches.length === 0)
		{
			console.log("ℹ️ 최근 경기 없음 → NonMatchHistory() 실행");
			await NonMatchHistory();
		}
		else
		{
			matches.forEach((match: MatchData) => {
				const { user1_nickname, user2_nickname, user1_score, user2_score, match_date } = match;   
				const timestamp = new Date(match_date).getTime();
	
				createHistoryBox(user1_nickname, user2_nickname, user1_score, user2_score, timestamp);
			});
		}
	} catch (err) {
		console.error('❌ 경기 히스토리 박스 생성 중 오류:', err);
	}
}
