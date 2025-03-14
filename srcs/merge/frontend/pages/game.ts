import { setupTournament } from "./tournament.js";
import { startGameLoop, stopGameLoop } from "../games/loop.js";
import { loadLanguage } from "../locales/lang";

document.addEventListener("showGameOptions", () => {
	setupGame();
});

export const gamePage = `
	<!-- 오버레이 추가 -->
	<div id="overlay" class="fixed top-0 left-0 z-40 w-full h-full bg-black opacity-0 hidden transition-opacity duration-300"></div>

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
			<img src="./src/Basic_image.webp" alt="User Avatar" class="w-35 h-35 rounded-full border border-gray-300">
			<p class="mt-4 mb-8 text-xl font-semibold text-gray-700">User Name</p>
		</div>
	
		<!-- 네비게이션 버튼 -->
		<button data-i18n="dashboard" id="dashboard" class="nav-btn w-full text-xl text-center p-4 rounded-lg hover:bg-blue-100" data-page="home"></button>
		<button data-i18n="game" id="game" class="nav-btn w-full text-xl text-center p-4 rounded-lg hover:bg-blue-100" data-page="game"></button>
		<button data-i18n="profile" id="profile" class="nav-btn w-full text-xl text-center p-4 rounded-lg hover:bg-blue-100" data-page="status"></button>

		<!-- 언어 변경 버튼 (사이드바 하단) -->
		<div class="mt-auto mb-4">
			<button id="lang-toggle" class="p-2 rounded-full bg-gray-800 hover:bg-gray-700 transition duration-300">
				<img src="flag-usa.png" alt="Change Language" class="w-8 h-8">
			</button>
		</div>
	</aside>

	<!-- 메인 콘텐츠 영역 -->
	<main class="flex-1 flex">
		<div id="content" class="flex-1 bg-white p-6 rounded-lg shadow-md m-4">
			<h2 class="text-5xl mb-10 text-center font-semibold">🏠 HOME</h2>
			<p class="text-xl text-center">안녕하세요! 이곳의 우리의 홈페이지입니다!</p>
		</div>
	</main>
`;

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
			</div>
		</div>
	`;

	const currentLang = localStorage.getItem("language") || "en";
		await loadLanguage(currentLang);

	// 버튼 이벤트 추가
	document.getElementById("local-mode")!.addEventListener("click", () => startGame("local", "local"));
	document.getElementById("ai-mode")!.addEventListener("click", () => startGame("local", "AI"));
	document.getElementById("tournament-mode")!.addEventListener("click", () => setupTournament());
}

export async function startGame(player1: string, player2: string): Promise<string>
{
	stopGameLoop();
	const contentDiv = document.getElementById("content");
	if (!contentDiv)
		throw new Error("Error: Cannot find content element!");

	if (player1.startsWith("AI"))
		[player1, player2] = [player2, player1];
	contentDiv.innerHTML = `
		<div class="relative flex flex-col items-center h-full">
			<!-- 헤더 -->
			<h2 data-i18n="game" class="text-5xl font-semibold absolute top-3 left-1/2 transform -translate-x-1/2">
			</h2>

			<div class="flex flex-col space-y-6 justify-center items-center flex-grow">
				<!-- 플레이어 닉네임 -->
				<div id="scoreBoard" class="text-2xl font-bold">${player1} | ${player2}</div>
				<!-- 게임 캔버스 -->
				<canvas id="gameCanvas" width="1200" height="600" class="border-2 border-black"></canvas>
			</div>
		</div>
	`;

	const currentLang = localStorage.getItem("language") || "en";
		await loadLanguage(currentLang);

	const canvas = document.getElementById("gameCanvas") as HTMLCanvasElement;
	if (!canvas)
		throw new Error("🚨 Error: Cannot find gameCanvas element!");

	if (player1.startsWith("AI") || player2.startsWith("AI"))
		return await startGameLoop(canvas, player1, player2, "PvE");
	else
		return await startGameLoop(canvas, player1, player2, "PvP");
}