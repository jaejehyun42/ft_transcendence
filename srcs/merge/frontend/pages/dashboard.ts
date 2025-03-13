export const dashboardPage = `
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
		<button data-i18n="profile" id="profile" class="nav-btn w-full text-center p-2 rounded-lg hover:bg-blue-100" data-page="profile"></button>

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
			<h2 class="text-5xl mb-10 text-center font-semibold">📊 DASHBOARD</h2>
			<p class="text-xl text-center">Welcome! Here is Dashboard Page.</p>
		</div>
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