import { startGameLoop, stopGameLoop } from "../games/loop.js";

export const gamePage = `
<div class="flex h-screen bg-gray-900">
    <!-- 사이드바 (왼쪽 고정) -->
    <aside class="fixed left-0 top-0 w-64 h-full bg-black shadow-lg p-4 flex flex-col items-center space-y-4">
		<!-- 페이지 제목 -->
		<h1 class="mt-2 mb-6 text-3xl font-bold text-blue-600">PONG</h1>
	
		<!-- 유저 아바타 및 이름 -->
		<div class="flex flex-col items-center">
            <img src="/Basic_image.webp" alt="User Avatar" class="w-30 h-30 rounded-full border border-gray-300">
			<p class="mt-2 mb-4 text-lg font-semibold text-gray-700"></p>
		</div>
	
		<!-- 네비게이션 버튼 -->
		<button data-i18n="dashboard" id="dashboard" class="nav-btn w-full text-center p-2 rounded-lg hover:bg-blue-100" data-page="home"></button>
		<button data-i18n="game" id="game" class="nav-btn w-full text-center p-2 rounded-lg hover:bg-blue-100" data-page="game"></button>
		<button data-i18n="profile" id="profile" class="nav-btn w-full text-center p-2 rounded-lg hover:bg-blue-100" data-page="status"></button>

		<!-- 언어 변경 버튼 (사이드바 하단) -->
		<div class="mt-auto mb-4">
			<button id="lang-toggle" class="p-2 rounded-full bg-gray-800 hover:bg-gray-700 transition duration-300">
				<img src="flag-usa.png" alt="Change Language" class="w-8 h-8">
			</button>
		</div>
	</aside>

	<!-- 메인 콘텐츠 영역 -->
	<main class="text-5xl mb-10 text-center font-semibold">
		<h2 data-i18n="game"></h2>
			<div class="flex flex-col items-center gap-5 h-full p-5">
				<!-- 점수판 -->
				<div id="scoreBoard" class="text-2xl font-bold">
    				<span data-i18n="player1"></span>: <span id="score1">0</span> | 
    				<span data-i18n="player2"></span>: <span id="score2">0</span>
				</div>
				<!-- 게임 캔버스 -->
				<canvas id="gameCanvas" width="1200" height="600" class="border-2 border-black"></canvas>
			</div>
    </main>
`;

export function setupGameCanvas() {
    console.log("🔥 setupGameCanvas 실행됨!");
    stopGameLoop();
	const canvas = document.getElementById("gameCanvas") as HTMLCanvasElement;
	if (!canvas)
		throw new Error("🚨 Error: Cannot find gameCanvas element!");

	startGameLoop(canvas);
}