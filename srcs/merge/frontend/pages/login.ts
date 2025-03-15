export const loginPage = `
    <div class="relative w-screen h-screen flex items-center justify-center bg-gray-900">
        <!-- 배경 이미지 -->
        <div class="absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat" style="background-image: url('/bg.webp');"></div>

        <!-- 배경 블러 효과 -->
        <div class="absolute inset-0 w-full h-full" style="backdrop-filter: blur(10px); background: rgba(0, 0, 0, 0.07);"></div>

        <!-- 로그인 컨테이너 (완전히 투명하게 만들기) -->
        <div class="relative z-10 flex flex-col items-center justify-center px-10 py-12 shadow-lg">
            <h1 class="text-5xl font-bold text-white mb-6">LOGIN</h1>
            <button id="loginBtn" class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg text-xl transition-all duration-300">
                CLICK TO GOOGLE LOGIN
            </button>
        </div>
    </div>
`;

export function setupLogin() {
    console.log("🔥 setupLogin 실행됨!");

    document.getElementById("loginBtn")?.addEventListener("click", async () => {
        window.location.href = "/login"; // ✅ 로그인 요청

        /*// ✅ 로그인 성공 여부를 1초 간격으로 확인
        setTimeout(async function check() {
            try {
                const response = await fetch("/db-save");
                const data = await response.json();

                if (data.success) {
                    console.log("✅ DB 저장 완료! OTP 페이지로 이동");
                    router.navigate("/otp"); // ✅ OTP 페이지로 이동
                } else {
                    console.log("⌛ 로그인 진행 중...");
                    setTimeout(check, 1000); // ✅ 1초 후 다시 확인
                }
            } catch (error) {
                console.error("❌ 로그인 확인 중 오류 발생:", error);
            }
        }, 1000); // 🔥 1초마다 `/db-save` 확인*/
    });
}