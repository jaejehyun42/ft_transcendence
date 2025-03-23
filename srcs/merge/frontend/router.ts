import { initSidebarEvents } from "./sidebar.js"
import { initLanguageToggle, loadLanguage } from "./locales/lang.js";
import { loadingPage, loadingScreen } from "./pages/loading.js";
import { loginPage, setupLogin } from "./pages/login.js";
import { otpPage, setupOTP } from "./pages/otp.js";
import { dashboardPage, ToOther, setDashBoard } from "./pages/dashboard.js";
import { gamePage, setupGame } from "./pages/game.js";
import { profilePage, loadProfile, editProfile } from "./pages/profile.js";

// 언어 변경 지원 페이지
const languageSupportPage = ["/dashboard", "/game", "/profile"];

class Router {
    private routes: {
        [key: string]: { 
            content: string; 
            pageFuncs?: ((router: Router) => void)[] 
        };
    };

    constructor(routes: {
        [key: string]: { 
            content: string; 
            pageFuncs?: ((router: Router) => void)[] 
        };
    }) {
        this.routes = routes;

        // 🔥 뒤로 가기, 앞으로 가기 감지
        window.addEventListener("popstate", () => this.render());
    }

    public navigate(url: string) {
        if (window.location.pathname !== url) // 히스토리 중복 체크, 루프백은 히스토리 X
            history.pushState(null, "", url);
        this.render();
    }

    public async render() {
        console.log("render() 실행됨 ");
        const path = window.location.pathname;
        const app = document.getElementById("router");
        if (!app) return;

        const route = this.routes[path] || { content: "<h1>404 Not Found</h1>" };

        if (path != "/login" && path != "/" && path != "/otp") {
            try {
                // ✅ JWT 인증 요청 (쿠키 포함)
                const authResponse = await fetch('/auth/check', {
                    method: 'GET',
                    credentials: 'include', // 중요한 옵션 (쿠키 포함)
                    headers: {
                        'Content-Type': 'application/json'
                    },
                });

                const authData = await authResponse.json();

                if (!authData.authenticated) {
                    console.log("❌ JWT 인증 실패, 로그인 페이지로 이동");
                    alert("먼저 로그인 해주세요.");
                    router.navigate("/login");
                    return;
                }

                console.log("✅ JWT 인증 성공, 페이지 렌더링");
                app.innerHTML = route.content;

            } catch (error) {
                console.error("🚨 JWT 인증 요청 중 오류 발생:", error);
                alert("JWT 인증 요청중 오류 발생!");
                router.navigate("/login");
                return;
            }
        }
        else if (path == "/otp"){
            try {
            const oauthResponse = await fetch('/auth/oauth', {
                    method: 'GET',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                });
            const oauthData = await oauthResponse.json();

            if (!oauthData.authenticated) {
                console.log("❌ 구글 로그인 인증 실패, 로그인 페이지로 이동");
                alert("먼저 로그인 해주세요.");
                router.navigate("/login");
                return;
            }

            console.log("✅ 구글 로그인 인증 성공, otp 페이지 렌더링");
            app.innerHTML = route.content;

            } catch (error) {
                console.error("🚨 인증 요청 중 오류 발생:", error);
                alert("구글 로그인 인증 요청중 오류 발생!");
                router.navigate("/login");
                return;
            }
        }
        else // 인증 페이지면 바로 렌더링
            app.innerHTML = route.content;

        // ✅ 페이지 변경 시 언어 업데이트
        if (languageSupportPage.includes(path))
        {
            initLanguageToggle();

            const currentLang = localStorage.getItem("language") || "en";
            await loadLanguage(currentLang);
        }

        // ✅ 해당 페이지의 이벤트 리스너 등록
        if (route.pageFuncs) {
            route.pageFuncs.forEach((func) => func(this));
        }
    }
}

// 📌 URL에 따른 페이지 등록 (각 페이지에 필요한 기능 추가)
const routes = {
    "/": { 
        content: loadingPage, 
        pageFuncs: [loadingScreen]
    },
    "/login": { 
        content: loginPage, 
        pageFuncs: [setupLogin]
    },
    "/otp": { 
        content: otpPage, 
        pageFuncs: [setupOTP]
    },
    "/dashboard": { 
        content: dashboardPage,
        pageFuncs: [initSidebarEvents, ToOther, loadProfile, setDashBoard]
    },
    "/game": {
        content: gamePage,
        pageFuncs: [initSidebarEvents, setupGame, ToOther, loadProfile]
    },
    "/profile": {
        content: profilePage,
        pageFuncs: [initSidebarEvents, ToOther, loadProfile, editProfile]
    }
};

// 📌 라우터 실행
export const router = new Router(routes);
router.render();