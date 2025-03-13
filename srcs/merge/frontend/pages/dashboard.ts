export const dashboardPage = `
<body class="flex h-screen bg-gray-100">
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
		class="fixed left-0 z-50 left-0 w-64 h-full bg-white shadow-lg p-4 flex flex-col items-center space-y-4
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
			<h2 class="text-5xl mb-10 text-center font-semibold">📊 DASHBOARD</h2>
			<p class="text-xl text-center">Hello! this is Dashboard page.</p>
		</div>
	</main>

	<script>
		const sidebar = document.getElementById('sidebar');
		const menuToggle = document.getElementById('menu-toggle');
		const closeToggle = document.getElementById('close-toggle');
		const overlay = document.getElementById('overlay');

		menuToggle.addEventListener('click', () => {
			sidebar.classList.remove('-translate-x-full');
			menuToggle.classList.add('hidden');
			overlay.classList.remove('hidden');
			setTimeout(() => {
				overlay.classList.add('opacity-50');
				closeToggle.classList.remove('hidden');
			}, 250);
		});

		closeToggle.addEventListener('click', () => {
			sidebar.classList.add('-translate-x-full');
			closeToggle.classList.add('hidden');
			overlay.classList.remove('opacity-50');
			setTimeout(() => {
				overlay.classList.add('hidden');
				menuToggle.classList.remove('hidden');
			}, 250);
		});
	</script>
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
