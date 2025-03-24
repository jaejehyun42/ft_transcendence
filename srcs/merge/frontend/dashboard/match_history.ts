async function getProfilePictureByNickname(nickname: string) {
    const AI_PROFILE_PICTURE = "AI_player.png"
    const DEFAULT_PROFILE_PICTURE = "/Basic_image.webp"

	try {
        console.log("Profile nickname: ", nickname);
        if (nickname == "AI")
            return AI_PROFILE_PICTURE;
		const res = await fetch(`/api/users/${encodeURIComponent(nickname)}`, {
			method: 'GET',
			headers: { 'Content-Type': 'application/json' },
		});

		if (!res.ok) {
			console.warn(`⚠️ 사용자 정보 없음 (${res.status}), 기본 이미지 사용`);
			return DEFAULT_PROFILE_PICTURE;
		}

		const data = await res.json();
		return data.profile_picture || DEFAULT_PROFILE_PICTURE;

	} catch (err) {
		console.error('❌ 프로필 이미지 가져오기 실패:', err);
		return null;
	}
}

export async function NonMatchHistory() {
    const container = document.getElementById('box-container');
    
    if (!container) {
        console.warn('⚠️ box-container 요소를 찾을 수 없습니다.');
        return;
    }

    const messageElement = document.createElement('div');
    messageElement.className = 'col-span-12 text-center py-10';
    messageElement.innerHTML = `
        <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h3 class="mt-2 text-sm font-medium text-gray-900" data-i18n="no_recent_matches">최근 경기 기록이 없습니다</h3>
        <p class="mt-1 text-sm text-gray-500" data-i18n="play_game_message">새로운 게임을 플레이해보세요!</p>
    `;

    container.appendChild(messageElement);
}

export async function createHistoryBox(user1: string, user2: string, user1_score: number, user2_score: number, match_date: number) {
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
    user1_img.src = await getProfilePictureByNickname(user1);
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
    user2_img.src = await getProfilePictureByNickname(user2);
    box.append(user2_img);

    user1_name.className = 'text-2xl font-bold text-black';
    user2_name.className = 'text-2xl font-bold text-black';
}
