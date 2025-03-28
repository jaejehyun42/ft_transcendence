import { router } from "../router";
import { loadLanguage } from "../locales/lang"
import { setPlayer1 } from "./game.js";

export const profilePage = `
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
    <main class="flex-1 flex justify-center items-center">
        <div id="content" class="bg-white p-8 rounded-lg shadow-md w-96">
            <h2 data-i18n="editprofile" class="text-3xl mb-6 text-center font-semibold"></h2>

            <!-- 프로필 이미지 변경 -->
            <div class="flex flex-col items-center mb-4">
                <img id="avatar" src="" class="w-32 h-32 rounded-full border border-gray-300">
                <input id="avatar-input" type="file" accept="image/*" class="hidden">
                <button id="upload-btn" onclick="document.getElementById('avatar-input').click()" 
                    data-i18n="changephoto" class="mt-2 px-4 py-2 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600">
                </button>
            </div>

            <!-- 이름 변경 입력 필드 -->
            <div class="mb-4">
                <label data-i18n="nickname" for="nickname-input" class="block text-gray-700 font-medium"></label>
                <input data-i18n="enternewname" id="nickname-input" type="text" placeholder="Enter new name" 
                    class="w-full p-2 border border-gray-300 rounded-md text-black">
            </div>

            <!-- 저장 버튼 -->
            <button data-i18n="savechanges" id="save-btn" 
                class="w-full px-4 py-2 bg-green-500 text-white rounded-md text-lg font-semibold hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed">
            </button>

            <!-- 상태 메시지 표시 -->
            <p data-i18n="status-message" id="profile-status" class="mt-4 text-center text-sm"></p>
        </div>
    </main>
`;

export async function loadProfile() {
    try {
        const response = await fetch("/profile/send"); // ✅ 서버에서 유저 정보 가져오기
        const data = await response.json();

        if (data.error) {
            console.error("❌ 프로필 로드 실패:", data.error);
            router.navigate("/login");
            return;
        }

        // ✅ HTML 요소 업데이트
        const avatar = document.getElementById("user-avatar") as HTMLImageElement;
        const nickname = document.getElementById("user-nickname") as HTMLParagraphElement;
        const editavatar = document.getElementById("avatar") as HTMLImageElement;

        if (avatar) {
            avatar.src = data.profile_picture || "/Basic_image.webp"; // ✅ 기본 이미지 처리
        }

        if (nickname) {
            setPlayer1(data.nickname);
            nickname.textContent = data.nickname; // ✅ 닉네임 업데이트
        }
        
        if (editavatar)
            editavatar.src = data.profile_picture || "/Basic_image.webp"; // ✅ 수정 기본 이미지 처리

        console.log("✅ 프로필 로드 완료:", data);
    } catch (error) {
        console.error("❌ 프로필 정보를 불러오는 중 오류 발생:", error);
    }
}

export function editProfile() {
    const avatarInput = document.getElementById("avatar-input") as HTMLInputElement;
    const avatar = document.getElementById("avatar") as HTMLImageElement;
    const saveBtn = document.getElementById("save-btn") as HTMLButtonElement;
    const cooldownUntil = parseInt(localStorage.getItem("saveCooldownUntil") || "0");
    let currentLang: string = localStorage.getItem("language") || "en";

    if (!avatarInput || !avatar) {
        console.error("❌ avatarInput 또는 avatar 요소를 찾을 수 없습니다.");
        return;
    }

    if (cooldownUntil > Date.now()) {
        saveBtn.disabled = true;
        saveBtn.removeAttribute("data-i18n"); // 번역 중단하고 텍스트 직접 표시
        saveBtn.setAttribute("data-i18n", "editprofiletimeout");
        loadLanguage(currentLang); // 번역 다시 적용

        const timeout = cooldownUntil - Date.now();
        setTimeout(() => {
            saveBtn.disabled = false;
            saveBtn.setAttribute("data-i18n", "savechanges");
            loadLanguage(localStorage.getItem("language") || "en");
            localStorage.removeItem("saveCooldownUntil");
        }, timeout);
    }

    // ✅ change 이벤트 리스너를 editProfile 실행 즉시 등록
    avatarInput.addEventListener('change', function () {
        console.log("✅ 파일 선택 감지됨!");
        if (avatarInput.files && avatarInput.files[0]) {
            const allowedTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp"];

            if (!allowedTypes.includes(avatarInput.files?.[0].type)) { // 파일 타입 체크
                alert("❌ 허용되지 않는 파일 형식입니다! (png, jpeg, jpg, webp만 가능)");
                avatarInput.value = ""; // 파일 입력 필드 초기화
            }
            const maxSize = 3 * 1024 * 1024; // 3MB
            if (avatarInput.files[0].size > maxSize) {
                alert("❌ 파일이 너무 큽니다! 3MB 이하만 업로드 가능합니다.");
                avatarInput.value = ""; // 입력 필드 초기화
            }
            const reader = new FileReader();
            reader.onload = function (e) {
                if (typeof e.target?.result === "string") {
                    avatar.src = e.target.result;
                    console.log("✅ 아바타 이미지 변경됨!");
                }
            };
            reader.readAsDataURL(avatarInput.files[0]);
        }
    });

    document.getElementById("save-btn")?.addEventListener("click", async (event) => {
        event.preventDefault();

        const nicknameInput = document.getElementById("nickname-input") as HTMLInputElement;
        const statusMessage = document.getElementById("profile-status") as HTMLParagraphElement;

        if (!nicknameInput) {
            console.error("❌ 닉네임 또는 프로필 사진 입력 필드가 없습니다.");
            return;
        }

        const newNickname = nicknameInput.value.trim();
        const newAvatar = avatarInput.files?.[0];
        let currentLang: string = localStorage.getItem("language") || "en";

        if (!newNickname && !newAvatar) {
            console.warn("⚠ 변경 사항이 없습니다.");
            statusMessage.className = "mt-4 text-center text-sm text-yellow-300";
            statusMessage.setAttribute("data-i18n", "nochanges");
            loadLanguage(currentLang);
            return;
        }
        else if (newNickname.length > 10) {
            console.error("⚠ 닉네임은 10자 이하로 입력해야합니다.");
            statusMessage.className = "mt-4 text-center text-sm text-red-500";
            statusMessage.setAttribute("data-i18n", "nicknamelength");
            loadLanguage(currentLang);
            return;
        }
        else if (newNickname.startsWith("AI") || newNickname.startsWith("Player"))
        {
            console.error("⚠ 닉네임은 AI나 Player로 시작하면 안 됩니다.")
            statusMessage.className = "mt-4 text-center text-sm text-red-500";
            statusMessage.setAttribute("data-i18n", "nicknameForbidden");
            loadLanguage(currentLang);
            return;
        }

        const formData = new FormData();
        if (newNickname)
            formData.append("nickname", newNickname); // 닉네임이 변경된 경우 추가
        if (newAvatar)
            formData.append("profile_picture", newAvatar); // 프로필 이미지가 변경된 경우 추가

        try {
            const response = await fetch("/profile/save", {
                method: "POST",
                body: formData,
            });

            const data = await response.json();
            if (data.success) {
                console.log("✅ 프로필 업데이트 성공!");
                statusMessage.className = "mt-4 text-center text-sm text-green-300";
                statusMessage.setAttribute("data-i18n", "profileupdatesuccess");
                loadLanguage(currentLang);
                loadProfile(); // ✅ 프로필 업데이트 후 화면 즉시 반영

                const cooldownEndTime = Date.now() + 60_000; // 현재 시간 + 1
                localStorage.setItem("saveCooldownUntil", cooldownEndTime.toString()); // 간단하게 localStorage 사용
                const saveBtn = document.getElementById("save-btn") as HTMLButtonElement;
                if (saveBtn) {
                    saveBtn.disabled = true;
                    saveBtn.removeAttribute("data-i18n"); // 번역 중단하고 텍스트 직접 표시
                    saveBtn.setAttribute("data-i18n", "editprofiletimeout");

                    const timeout = cooldownEndTime - Date.now();
                    setTimeout(() => {
                        saveBtn.disabled = false;
                        saveBtn.setAttribute("data-i18n", "savechanges"); // 원래 번역 키 복원
                        loadLanguage(currentLang); // 번역 다시 적용
                        localStorage.removeItem("saveCooldownUntil");
                    }, timeout); // 1분
                }
            } else {
                console.error("❌ 프로필 업데이트 실패:", data.error);
                statusMessage.className = "mt-4 text-center text-sm text-red-500";
                if (data.error == "이미 존재하는 닉네임입니다.")
                    statusMessage.setAttribute("data-i18n", "nicknamealreadyexist");
		        else if (data.error == "request file too large")
                    statusMessage.setAttribute("data-i18n", "filetoolarge");
                else if (data.error == "AI 닉네임 사용 불가")
                    statusMessage.setAttribute("data-i18n", "ainicknamenotallowed");
                loadLanguage(currentLang);
            }
        } catch (error) {
            console.error("❌ 프로필 업데이트 중 오류 발생:", error);
            statusMessage.className = "mt-4 text-center text-sm text-red-500";
            statusMessage.setAttribute("data-i18n", "networkerror");
            loadLanguage(currentLang);
        }
    });
}
