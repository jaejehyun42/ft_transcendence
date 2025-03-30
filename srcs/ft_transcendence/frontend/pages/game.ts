import { setupTournament } from "./tournament.js";
import { startGameLoop, stopGameLoop } from "../games/loop.js";
import { loadLanguage } from "../locales/lang.js";
import { runAutoTraining } from "../games/AI.js";

document.addEventListener("showGameOptions", () => {
	setupGame();
});

export let userName = "Nick Name";

export const gamePage = `
	<!-- 오버레이 추가 -->
	<div id="overlay" class="fixed top-0 left-0 z-40 w-full h-full bg-black opacity-0 hidden 2xl:hidden transition-opacity duration-300"></div>

	<!-- 토글 버튼 -->
	<button id="menu-toggle" class="fixed top-5 left-5 z-50 w-10 h-10 text-xl text-white rounded-lg 2xl:hidden" 
		style="background-color: rgba(45, 45, 248, 0.3);">
		☰
	</button>

	<!-- 닫기 버튼 -->
	<button id="close-toggle" class="fixed top-6 left-64 z-50 w-10 h-10 text-xl text-white rounded-r-lg hidden 2xl:hidden" 
		style="background-color: rgba(248, 45, 45, 0.3);">
		✖
	</button>

	<!-- 반응형 사이드바 -->
	<aside id="sidebar"
		class="fixed top-0 z-50 left-0 w-64 h-full bg-white shadow-lg p-4 flex flex-col items-center space-y-4
		transform -translate-x-full transition-transform duration-300 2xl:translate-x-0 2xl:relative">

		<!-- 페이지 제목 -->
		<h1 class="mt-2 mb-6 text-5xl text-center font-bold text-blue-600">PONG</h1>
	
		<!-- 유저 아바타 및 이름 -->
		<div class="flex flex-col mt-2 items-center">
			<img id="user-avatar" src="" class="w-35 h-35 rounded-full border border-gray-300">
			<p id="user-nickname" class="mt-4 mb-8 text-xl font-semibold text-gray-700"></p>
		</div>
	
		<!-- 네비게이션 버튼 -->
		<button data-i18n="dashboard" id="dashboard" class="nav-btn w-full text-xl text-center p-4 rounded-lg bg-blue-50 hover:bg-blue-100" data-page="home"></button>
		<button data-i18n="game" id="game" class="nav-btn w-full text-xl text-center p-4 rounded-lg bg-blue-50 hover:bg-blue-100" data-page="game"></button>
		<button data-i18n="editprofilenoemoge" id="profile" class="nav-btn w-full text-xl text-center p-4 rounded-lg bg-blue-50 hover:bg-blue-100" data-page="status"></button>

		<!-- 언어 변경 버튼 (사이드바 하단) -->
		<div class="mt-auto mb-4">
			<button id="lang-toggle" class="flex items-center px-4 py-2 rounded-lg bg-gray-500 text-lg text-white hover:bg-gray-300 transition duration-300">
			</button>

		<!-- 로그아웃 버튼 -->
			<button data-i18n="logout" id="logout-btn" class="w-full mt-4 flex items-center justify-center px-4 py-2 rounded-lg bg-red-500 text-lg text-white hover:bg-red-300 transition duration-300">
			</button>
		</div>
	</aside>

	<!-- 메인 콘텐츠 영역 -->
	<main class="flex-1 flex">
		<div id="content" class="flex-1 bg-white p-6 rounded-lg shadow-md m-4"></div>
	</main>

`;

export function setPlayer1(nickname: string)
{
	userName = nickname;
}

export function escapeHTML(input: string)
{
    return input.replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#039;");
}

// 게임 옵션 선택 화면 렌더링
export async function setupGame()
{
	const contentDiv = document.getElementById("content");
	if (!contentDiv)
		throw new Error("Error: Cannot find content element!");

	contentDiv.innerHTML = `
		<div class="relative flex flex-col items-center h-full">
			<!-- 헤더 -->
			<h2 data-i18n="selectmode" class="text-5xl font-semibold absolute top-3 left-1/2 transform -translate-x-1/2">
			</h2>
			
			<!-- 버튼 -->
			<div class="flex flex-col space-y-6 justify-center items-center flex-grow">
				<button data-i18n="localmatch" id="local-mode" class="btn bg-blue-500 text-white text-xl py-6 px-6 rounded-lg shadow-lg hover:bg-blue-600 transition duration-300">
				</button>
				<button data-i18n="aimatch" id="ai-mode" class="btn bg-green-500 text-white text-xl py-6 px-6 rounded-lg shadow-lg hover:bg-green-600 transition duration-300">
				</button>
				<button data-i18n="tournament" id="tournament-mode" class="btn bg-red-500 text-white text-xl py-6 px-6 rounded-lg shadow-lg hover:bg-red-600 transition duration-300">
				</button>
				<button data-i18n="autoTraining" id="auto-train-btn" class="btn bg-purple-500 text-white text-xl py-6 px-6 rounded-lg shadow-lg hover:bg-purple-600 transition duration-300">
				</button>
			</div>
		</div>

		<!-- 닉네임 입력 모달 -->
		<div id="nickname-modal-wrapper" class="absolute inset-0 z-60 hidden flex items-center justify-center"
			style="background-color: rgba(0, 0, 0, 0.45)">
			<div id="nickname-modal" class="bg-white p-6 rounded-lg shadow-lg flex flex-col items-center justify-center">
				<h3 data-i18n="enterNickname" class="text-2xl font-semibold mb-4"></h3>
				<input type="text" id="player2-name" placeholder="Player 2" class="border px-4 py-2 mb-4 w-full" maxlength="10">
				<div class="flex space-x-4">
					<button id="start-local-game" class="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600">Start</button>
					<button id="close-modal" class="bg-gray-400 text-white px-4 py-2 rounded-lg hover:bg-gray-500">Cancel</button>
				</div>
			</div>
		</div>
	`;

	const currentLang = localStorage.getItem("language") || "en";
		await loadLanguage(currentLang);

	let result;
	document.getElementById("local-mode")!.addEventListener("click", () => {
		document.getElementById("nickname-modal-wrapper")!.classList.remove("hidden");
	});

	document.getElementById("start-local-game")!.addEventListener("click", async () => {
		const player2Input = document.getElementById("player2-name") as HTMLInputElement;
		const player2 = player2Input.value.trim() || "Player 2";
		document.getElementById("nickname-modal-wrapper")!.classList.add("hidden");
	
		if (userName === player2) {
			alert(`Duplicate Nickname: "${player2}". Please use Unique Nickname.`);
			return;
		}
		if (player2.startsWith("AI") || player2 === "???") {
			alert(`Forbidden Nickname: ${player2}. Please use Another Nickname`);
			return;
		}
	
		const res = await fetch(`/profile/${encodeURIComponent(player2)}`);
		const data = await res.json();
	
		if (data.exists) {
			alert(`Nickname "${player2}" is already taken. Please choose another one.`);
			return;
		}
	
		result = await startGame(userName, player2);
		if (result !== "???") setupGame();
	});

	document.getElementById("ai-mode")!.addEventListener("click", async () => {
		result = await startGame(userName, "AI")
		if (result != "???") setupGame();
	});
	document.getElementById("tournament-mode")!.addEventListener("click", async () => {
		setupTournament(userName)
	});
	document.getElementById("close-modal")!.addEventListener("click", () => {
		document.getElementById("nickname-modal-wrapper")!.classList.add("hidden");
	});
	document.getElementById('auto-train-btn')!.addEventListener('click', async () => {
		const btn = document.getElementById('auto-train-btn') as HTMLButtonElement;
		btn.disabled = true;
		btn.textContent = '학습 중... (0%)';
		
		// 진행 상태 업데이트 콜백
		// const progressCallback = (progress :number) => {
		//   btn.textContent = `학습 중... (${Math.round(progress)}%)`;
		// };
		
		try {
		  await runAutoTraining(500);
		  btn.textContent = '학습 완료!';
		} catch (e) {
		  console.error('학습 실패:', e);
		  btn.textContent = '학습 실패';
		} finally {
		  setTimeout(() => {
			btn.disabled = false;
			btn.textContent = '자동 학습 시작';
		  }, 2000);
		}
	  });
}

export async function startGame(player1: string, player2: string): Promise<string>
{
	stopGameLoop();
	const contentDiv = document.getElementById("content");
	if (!contentDiv)
		throw new Error("Error: Cannot find content element!");

	if (player1.startsWith("AI") || player2 === userName)
		[player1, player2] = [player2, player1];

	contentDiv.innerHTML = `
		<div class="relative flex flex-col items-center h-full">
			<!-- 헤더 -->
			<h2 data-i18n="gameBoard" class="text-5xl font-semibold absolute top-3 left-1/2 transform -translate-x-1/2"></h2>

			<div class="flex flex-col space-y-6 justify-center items-center flex-grow">
				<!-- 플레이어 닉네임 -->
				<div id="scoreBoard" class="text-2xl font-bold w-full flex justify-between px-8 mb-2">
					<span class="bg-red-500 text-white text-center px-4 py-2 min-w-[150px] rounded-full">${escapeHTML(player1)}</span>
					<span class="bg-blue-500 text-white text-center px-4 py-2 min-w-[150px] rounded-full">${escapeHTML(player2)}</span>
				</div>
				<!-- 게임 캔버스 -->
				<canvas id="gameCanvas" width="1200" height="600"></canvas>
			</div>
		</div>
	`;

	const currentLang = localStorage.getItem("language") || "en";
		await loadLanguage(currentLang);

	const canvas = document.getElementById("gameCanvas") as HTMLCanvasElement;
	if (!canvas)
		throw new Error("🚨 Error: Cannot find gameCanvas element!");

	let result: { [key:string]: string | null };
	if (player1.startsWith("AI") || player2.startsWith("AI"))
		result = await startGameLoop(canvas, player1, player2, "PvE");
	else
		result = await startGameLoop(canvas, player1, player2, "PvP");
	
	if (result["winner"])
	{
		sendMatchResult(result);
		return result["winner"];
	}
	else
		return "???";
}

async function sendMatchResult(result: { [key: string]: string | null })
{
	const dataToSend = {
		user1: result["name_1p"] || '',
		user2: result["name_2p"] || '',
		user1_score: result["score_1p"] || '0',
		user2_score: result["score_2p"] || '0'
	};
	
	try {
		const response = await fetch('/api/match-results/save', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(dataToSend),
		});
	
		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}
	
		const data = await response.json();
		console.log('Match result sent successfully:', data);
	}
	catch (error) {
		console.error('Error sending match result:', error);
	}
}
