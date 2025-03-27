import { getProfilePictureByNickname } from "./matchApi";
import { loadLanguage } from "../locales/lang";

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
        <h3 class="mt-3 text-sm font-medium text-gray-900" data-i18n="noMatches"></h3>
        <p class="mt-1 text-sm text-gray-500" data-i18n="playMessage"></p>
    `;
    container.appendChild(messageElement);

    const currentLang = localStorage.getItem("language") || "en";
    await loadLanguage(currentLang);
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
    box.className = 'grid-cols-5 w-full h-32 bg-white rounded-xl grid grid-cols-3 items-center px-4 py-4';

    // 왼쪽 영역 (첫 번째 열) - 유저1
    const left_column = document.createElement('div');
    left_column.className = 'col-span-2 flex items-center justify-start gap-4';
    box.appendChild(left_column);
    
    //유저1 이미지
    const user1_img = document.createElement('img');
    user1_img.className = 'bg-blue-100 p-1 rounded-full w-24 h-24 object-cover object-center';
    user1_img.src = await getProfilePictureByNickname(user1);
    left_column.appendChild(user1_img);

    const user1_txtbox = document.createElement('div');
    user1_txtbox.className = 'flex flex-col items-start';
    left_column.appendChild(user1_txtbox);

    //유저1 승패
    const user1_winlose = document.createElement('p');
    if (user1_score > user2_score)
        user1_winlose.innerHTML = `<p data-i18n="win"> </p>`;
    else if (user1_score < user2_score)
        user1_winlose.innerHTML = `<p data-i18n="lose"> </p>`;
    else
        user1_winlose.innerHTML = `<p data-i18n="draw"> </p>`;
    user1_winlose.className = 'text-3xl font-bold text-black';
    user1_txtbox.appendChild(user1_winlose);

    //유저1 이름
    const user1_name = document.createElement('p');
    user1_name.textContent = user1;
    user1_name.className = 'text-2xl font-bold text-black w-full truncate';
    user1_txtbox.appendChild(user1_name);

    //유저1 점수
    const user1_score_text = document.createElement('p');
    user1_score_text.textContent = `score: ${user1_score}`;
    user1_score_text.className = 'text-sm font-bold text-gray-500';
    user1_txtbox.appendChild(user1_score_text);

    // 중앙 영역 (두 번째 열) - VS 및 날짜
    const center_column = document.createElement('div');
    center_column.className = 'col-span-1 flex flex-col items-center justify-center';
    box.appendChild(center_column);
    
    // 경기 날짜 표시
    const date_display = document.createElement('p');
    date_display.textContent = new Date(match_date).toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric'
    });
    date_display.className = 'text-sm text-gray-500';
    center_column.appendChild(date_display);

    // VS 표시
    const vs_text = document.createElement('p');
    vs_text.textContent = 'VS';
    vs_text.className = 'text-xl font-bold text-gray-500';
    center_column.appendChild(vs_text);

    // 오른쪽 영역 (세 번째 열) - 유저2
    const right_column = document.createElement('div');
    right_column.className = 'col-span-2 flex items-center justify-end gap-4';
    box.appendChild(right_column);
    
    const user2_txtbox = document.createElement('div');
    user2_txtbox.className = 'flex flex-col items-end';
    right_column.appendChild(user2_txtbox);

    //유저2 승패
    const user2_winlose = document.createElement('p');
    if (user1_score < user2_score)
        user2_winlose.innerHTML = `<p data-i18n="win"> </p>`;
    else if (user1_score > user2_score)
        user2_winlose.innerHTML = `<p data-i18n="lose"> </p>`;
    else
        user2_winlose.innerHTML = `<p data-i18n="draw"> </p>`;
    user2_winlose.className = 'text-3xl font-bold text-black max-h-48 truncate';
    user2_txtbox.appendChild(user2_winlose);

    //유저2 이름
    const user2_name = document.createElement('p');
    user2_name.textContent = user2;
    user2_name.className = 'text-2xl font-bold text-black w-full text-right truncate';
    user2_txtbox.appendChild(user2_name);

    //유저2 점수
    const user2_score_text = document.createElement('p');
    user2_score_text.textContent = `score: ${user2_score}`;
    user2_score_text.className = 'text-sm font-bold text-gray-500';
    user2_txtbox.appendChild(user2_score_text);

    //유저2 이미지
    const user2_img = document.createElement('img');
    user2_img.className = 'bg-blue-100 p-1 rounded-full w-24 h-24 object-cover object-center justify-end';
    user2_img.src = await getProfilePictureByNickname(user2);
    right_column.append(user2_img);    
    
    const currentLang = localStorage.getItem("language") || "en";
    await loadLanguage(currentLang);
}