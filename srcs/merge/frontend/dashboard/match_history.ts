"use strict";

export function createHistoryBox(count: number): void {
    const container = document.getElementById('box-container');
    if (!container) return;

    for (let i = 0; i < count; i++) {
        const win_lose_box = document.createElement('div');
        if (i % 2 === 0) {
            win_lose_box.className = 'col-span-12 pl-2 h-32 bg-red-800 m-2 rounded-xl';
        } else {
            win_lose_box.className = 'col-span-12 pl-2 h-32 bg-blue-800 m-2 rounded-xl';
        }

        const box = document.createElement('div');
        box.className = 'w-full h-32 bg-white rounded-xl flex items-center pl-16 gap-16';

        const oppo_img = document.createElement('img');
        oppo_img.className = 'bg-red-100 p-1 rounded-full w-24 h-24 object-cover object-center';
        oppo_img.src = './ai_icon.png';

        const win_lose_txt = document.createElement('p');
        if (i % 2 === 0) {
            win_lose_txt.innerText = 'WIN';
        } else {
            win_lose_txt.innerText = 'LOSE';
        }
        win_lose_txt.className = 'text-2xl font-bold text-black';

        win_lose_box.append(box);
        box.append(oppo_img);
        box.append(win_lose_txt);
        container.appendChild(win_lose_box);
    }
}