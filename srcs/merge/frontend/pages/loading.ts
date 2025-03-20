export const loadingPage = `
    <div id="loading-screen" class="fixed inset-0 flex items-center justify-center bg-gray-900 text-white opacity-0 transition-opacity duration-500">
        <h1 class="text-[100px] font-bold">PONG</h1>
    </div>
`;

// 🔥 2초 후 로그인 화면으로 이동 후 로그인 창 띄우기 
export function loadingScreen(router: any) {
    console.log("🔥 loading screen 실행됨!");
    const app = document.getElementById("router");
    if (!app) return;

    setTimeout(() => {
        const loadingScreen = document.getElementById("loading-screen");
        if (loadingScreen) {
            loadingScreen.classList.add("opacity-100");
        }
    }, 50); // 50ms 후 페이드 인

    setTimeout(() => {
        const loadingScreen = document.getElementById("loading-screen");
        if (loadingScreen) {
            loadingScreen.classList.remove("opacity-100");
            loadingScreen.classList.add("opacity-0");
        }
    }, 1700); // 1700ms 후 페이드 아웃

    setTimeout(() => {
        router.navigate("/login");
    }, 2000);
}