"use strict";

function createHistoryBox(user1: string, user2: string, user1_score: number, user2_score: number, match_date: number): void {
    const container = document.getElementById('box-container');
    if (!container) return;
    
    // 승패 색상
    const win_lose_color = document.createElement('div');
    container.appendChild(win_lose_color);
    if(user1_score > user2_score)
        win_lose_color.className = 'col-span-12 pl-2 pr-2 h-32 bg-gradient-to-r from-blue-800 via-blue-800 to-red-800 m-2 rounded-xl';
    else
        win_lose_color.className = 'col-span-12 pl-2 h-32 bg-gradient-to-r from-red-800 via-red-800 to-blue-800 m-2 rounded-xl';

    //정보 들어갈 박스
    const box = document.createElement('div');
    win_lose_color.append(box);
    box.className = 'w-full h-32 bg-white rounded-xl flex items-center justify-between pl-16 gap-16';

    //유저1 이미지
    const user1_img = document.createElement('img');
    user1_img.className = 'bg-red-100 p-1 rounded-full w-24 h-24 object-cover object-center';
    user1_img.src = './ai_icon.png';
    box.append(user1_img);
    
    //유저1 이름
    const user1_name = document.createElement('p');
    user1_name.innerText = user1;
    box.append(user1_name);

     // 중앙 영역 (VS 또는 경기 날짜 표시)
     const center_info = document.createElement('div');
     center_info.className = 'flex flex-col items-center';
     box.append(center_info);
     
     // VS 표시
     const vs_text = document.createElement('p');
     vs_text.textContent = 'VS';
     vs_text.className = 'text-2xl font-bold text-gray-700';
     center_info.append(vs_text);
     
     // 경기 날짜 표시
     const date_display = document.createElement('p');
     date_display.textContent = new Date(match_date).toLocaleDateString();
     date_display.className = 'text-sm text-gray-500';
     center_info.append(date_display);

     //유저2 이름
     const user2_name = document.createElement('p');
     user2_name.innerText = user2;
     box.append(user2_name);

    //유저2 이미지
    const user2_img = document.createElement('img');
    user2_img.className = 'bg-red-100 p-1 rounded-full w-24 h-24 object-cover object-center';
    user2_img.src = './ai_icon.png';
    box.append(user2_img);

    user1_name.className = 'text-2xl font-bold text-black';
    user2_name.className = 'text-2xl font-bold text-black';
}

export function createHistory() {
    for (let i = 0; i < 5; i++) {
        createHistoryBox('user1', 'user2', 10, 5, 2021);
    }
}
