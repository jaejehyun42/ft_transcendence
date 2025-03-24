// import { createHistory } from "../dashboard/match_history.js"
import { loadMatchHistory } from "../dashboard/matchApi.js"
import { setUpChart } from "../dashboard/chart.js"

export const dashboardPage = `
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
			<img id="user-avatar" src="" class="w-35 h-35 rounded-full border border-gray-300">
			<p id="user-nickname" class="mt-4 mb-8 text-xl font-semibold text-gray-700"></p>
		</div>
	
		<!-- 네비게이션 버튼 -->
		<button data-i18n="dashboard" id="dashboard" class="nav-btn w-full text-xl text-center p-4 rounded-lg hover:bg-blue-100" data-page="home"></button>
		<button data-i18n="game" id="game" class="nav-btn w-full text-xl text-center p-4 rounded-lg hover:bg-blue-100" data-page="game"></button>
		<button data-i18n="editprofilenoemoge" id="profile" class="nav-btn w-full text-xl text-center p-4 rounded-lg hover:bg-blue-100" data-page="status"></button>

		<!-- 언어 변경 버튼 (사이드바 하단) -->
		<div class="mt-auto mb-4">
			<button id="lang-toggle" class="flex items-center px-4 py-2 rounded-lg bg-gray-500 text-white hover:bg-gray-300 transition duration-300">
			</button>

		<!-- 로그아웃 버튼 -->
			<button data-i18n="logout" id="logout-btn" class="w-full mt-4 flex items-center justify-center px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-300 transition duration-300">
			</button>
		</div>
	</aside>

	<!-- 메인 콘텐츠 영역 -->
	<main class="flex-1 flex h-screen">
		<div id="content" class="flex-1 bg-white p-6 rounded-lg shadow-md m-4 flex flex-col items-center max-h-screen"></div>
	</main>
`;



export function ToOther(router: any) {
	document.getElementById("dashboard")?.addEventListener("click", () => {
		console.log("✅ 대시보드 버튼 클릭됨!");
		router.navigate("/dashboard");
	});

	document.getElementById("game")?.addEventListener("click", () => {
		console.log("✅ 게임 버튼 클릭됨!");
		router.navigate("/game");
	});

	document.getElementById("profile")?.addEventListener("click", () => {
		console.log("✅ 프로필 버튼 클릭됨!");
		router.navigate("/profile");
	});
}

export async function setDashBoard()
{
	const contentDiv = document.getElementById("content");
	if (!contentDiv)
		throw new Error("Error: Cannot find content element!");

	contentDiv.innerHTML = `
		<h2 class="text-5xl mt-8 text-center font-semibold">📊 DASHBOARD</h2>
		<div class="w-3/4 flex rounded-xl mt-8 p-10 bg-red-100 justify-center">
			<canvas id="totalWinRate" class="w-1/4"></canvas>
			<canvas id="PvEWinRate" class="w-1/4"></canvas>
			<canvas id="PvPWinRate" class="w-1/4"></canvas>
			<ul class="w-1/4 text-xl m-5 font-serif flex flex-col justify-center">
				<li class="m-2">Total Winning rate</li>
				<li class="m-2">PvE Winning rate</li>
				<li class="m-2">PvP Winning rate</li>
			</ul>
		</div>

		<div class="w-3/4 flex-1 rounded-xl mt-8 p-10 bg-red-100 overflow-y-auto justify-center">
			<div id="box-container" class="grid grid-cols-12 items-center"></div>
		</div>			
		`;
		
		// createHistory();
		loadMatchHistory();
		setUpChart();
}
	
