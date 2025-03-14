export const profilePage = `
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
    <main class="flex-1 flex justify-center items-center">
        <div id="content" class="bg-white p-8 rounded-lg shadow-md w-96">
            <h2 data-i18n="editprofile" class="text-3xl mb-6 text-center font-semibold"></h2>

            <!-- 프로필 이미지 변경 -->
            <div class="flex flex-col items-center mb-4">
                <img id="avatar" src="/Basic_image.webp" alt="User Avatar" class="w-32 h-32 rounded-full border border-gray-300">
                <input id="avatar-input" type="file" accept="image/*" class="hidden">
                <button onclick="document.getElementById('avatar-input').click()" 
                    data-i18n="changephoto" class="mt-2 px-4 py-2 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600">
                </button>
            </div>

            <!-- 이름 변경 입력 필드 -->
            <div class="mb-4">
                <label data-i18n="username" for="username-input" class="block text-gray-700 font-medium"></label>
                <input data-i18n="enternewname" id="username-input" type="text" placeholder="Enter new name" 
                    class="w-full p-2 border border-gray-300 rounded-md text-black">
            </div>

            <!-- 저장 버튼 -->
            <button data-i18n="savechanges" id="save-btn" 
                class="w-full px-4 py-2 bg-green-500 text-white rounded-md text-lg font-semibold hover:bg-green-600">
            </button>
        </div>
    </main>
`;

export async function loadProfile() {
    try {
        const response = await fetch("/profile"); // ✅ 서버에서 유저 정보 가져오기
        const data = await response.json();

        if (data.error) {
            console.error("❌ 프로필 로드 실패:", data.error);
            return;
        }

        // ✅ HTML 요소 업데이트
        const avatar = document.querySelector("img[alt='User Avatar']") as HTMLImageElement;
        const username = document.querySelector("p.text-lg.font-semibold") as HTMLParagraphElement;

        if (avatar) {
            avatar.src = data.profile_picture || "/Basic_image.webp"; // ✅ 기본 이미지 처리
        }

        if (username) {
            username.textContent = data.nickname || "User Name"; // ✅ 닉네임 업데이트
        }

        console.log("✅ 프로필 로드 완료:", data);
    } catch (error) {
        console.error("❌ 프로필 정보를 불러오는 중 오류 발생:", error);
    }
}

export function editProfile() {
    document.getElementById("save-btn")?.addEventListener("click", async (event) => {
        event.preventDefault();

        const nicknameInput = document.getElementById("username-input") as HTMLInputElement;
        const avatarInput = document.getElementById("avatar-input") as HTMLInputElement;

        if (!nicknameInput || !avatarInput) {
            console.error("❌ 닉네임 또는 프로필 사진 입력 필드가 없습니다.");
            return;
        }

        const formData = new FormData();
        formData.append("nickname", nicknameInput.value); // ✅ 닉네임 추가
        if (avatarInput.files?.length) {
            formData.append("profile_picture", avatarInput.files[0]); // ✅ 이미지 추가 (파일 존재 시)
        }

        try {
            const response = await fetch("/profile", {
                method: "POST",
                body: formData,
            });

            const data = await response.json();
            if (data.success) {
                console.log("✅ 프로필 업데이트 성공!");

                // ✅ 프로필 업데이트 후 화면 즉시 반영
                loadProfile();
            } else {
                console.error("❌ 프로필 업데이트 실패:", data.error);
            }
        } catch (error) {
            console.error("❌ 프로필 업데이트 중 오류 발생:", error);
        }
    });
}