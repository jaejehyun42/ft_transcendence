export const loginPage = `
    <div class="relative w-screen h-screen flex items-center justify-center bg-gray-900">
        <!-- 배경 이미지 -->
        <div class="absolute inset-0 w-full h-full bg-center bg-no-repeat" 
            style="background-image: url('/Pixel_Pong.webp'); background-size: cover; filter: brightness(0.7);">
        </div>

        <!-- 로그인 컨테이너 -->
        <div class="relative z-10 flex flex-col items-center justify-center px-12 py-10 bg-gray-700/100 rounded-xl shadow-2xl border border-gray-700">
            <h1 class="text-6xl font-extrabold text-white mb-8 tracking-wide">
                LOGIN
            </h1>
            <button id="loginBtn" 
                class="relative bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg text-xl transition-all duration-300 shadow-lg border border-blue-400"
                style="box-shadow: 0 0 12px rgba(0, 162, 255, 0.8); text-shadow: 0 0 10px rgba(255, 255, 255, 0.8);">
                CLICK TO GOOGLE LOGIN
            </button>
        </div>
    </div>
`;

export function setupLogin() {
    console.log("🔥 setupLogin 실행됨!");

    document.getElementById("loginBtn")?.addEventListener("click", async () => {
        window.location.href = "/oauth/login"; // ✅ 로그인 요청
    });
}