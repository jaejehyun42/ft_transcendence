export function createHistoryBox(user1: string, user2: string, user1_score: number, user2_score: number, match_date: number): void {
    const container = document.getElementById('box-container');
    if (!container) return;

    // 승패 색상
    const win_lose_color = document.createElement('div');
    container.append(win_lose_color);
    if (user1_score > user2_score)
        win_lose_color.className = 'col-span-12 pl-2 pr-2 h-32 bg-gradient-to-r from-blue-800 via-blue-800 to-red-800 m-2 rounded-xl';
    else if (user1_score < user2_score)
        win_lose_color.className = 'col-span-12 pl-2 pr-2 h-32 bg-gradient-to-r from-red-800 via-red-800 to-blue-800 m-2 rounded-xl';
    else
        win_lose_color.className = 'col-span-12 pl-2 pr-2 h-32 bg-gray-600 m-2 rounded-xl';

    //정보 들어갈 박스
    const box = document.createElement('div');
    win_lose_color.append(box);
    box.className = 'w-full h-32 bg-white rounded-xl flex items-center p-8 justify-between';

    //유저1 이미지
    const user1_img = document.createElement('img');
    user1_img.className = 'bg-red-100 p-1 rounded-full w-24 h-24 object-cover object-center';
    user1_img.src = './ai_icon.png';
    box.append(user1_img);

    const user1_txtbox = document.createElement('div');
    user1_txtbox.className = 'flex flex-col items-center';
    box.append(user1_txtbox);

    //유저1 이름
    const user1_name = document.createElement('p');
    if (user1_score > user2_score)
        user1_name.textContent = `승: ${user1}`;
    else if (user1_score < user2_score)
        user1_name.textContent = `패: ${user1}`;
    else
        user1_name.textContent = `무: ${user1}`;
    user1_txtbox.append(user1_name);

    const user1_score_text = document.createElement('p');
    user1_score_text.textContent = `score: ${user1_score}`;
    user1_score_text.className = 'text-sm font-bold text-gray-500';
    user1_txtbox.append(user1_score_text);

    // 중앙 영역 (VS 또는 경기 날짜 표시)
    const center_info = document.createElement('div');
    center_info.className = 'flex flex-col items-center';
    box.append(center_info);

    // 경기 날짜 표시
    const date_display = document.createElement('p');
    date_display.textContent = new Date(match_date).toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric'
    });
    date_display.className = 'text-sm text-gray-500';
    center_info.append(date_display);

    // VS 표시
    const vs_text = document.createElement('p');
    vs_text.textContent = 'VS';
    vs_text.className = 'text-xl font-bold text-gray-500';
    center_info.append(vs_text);

    const user2_txtbox = document.createElement('div');
    user2_txtbox.className = 'flex flex-col items-center';
    box.append(user2_txtbox);

    //유저2 이름
    const user2_name = document.createElement('p');
    if (user1_score < user2_score)
        user2_name.textContent = `승: ${user2}`;
    else if (user1_score > user2_score)
        user2_name.textContent = `패: ${user2}`;
    else
        user2_name.textContent = `무: ${user2}`;
    user2_txtbox.append(user2_name);

    const user2_score_text = document.createElement('p');
    user2_score_text.textContent = `score: ${user2_score}`;
    user2_score_text.className = 'text-sm font-bold text-gray-500';
    user2_txtbox.append(user2_score_text);

    //유저2 이미지
    const user2_img = document.createElement('img');
    user2_img.className = 'bg-red-100 p-1 rounded-full w-24 h-24 object-cover object-center';
    user2_img.src = './ai_icon.png';
    box.append(user2_img);

    user1_name.className = 'text-2xl font-bold text-black';
    user2_name.className = 'text-2xl font-bold text-black';
}

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

async function loadMatchHistory() {
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

export function createHistory() {
    loadMatchHistory();
}
