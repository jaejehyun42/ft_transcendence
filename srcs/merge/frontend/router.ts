import "../public/styles.css";
import { initLanguageToggle, loadLanguage } from "./locales/lang.js";
import { loadingPage, loadingScreen } from "./pages/loading.js";
import { loginPage, setupLogin } from "./pages/login.js";
import { otpPage, setupOTP } from "./pages/otp.js";
import { dashboardPage, ToOther } from "./pages/dashboard.js";
import { gamePage, setupGame } from "./pages/game.js";
import { profilePage, loadProfile, editProfile } from "./pages/profile.js";

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

        // ✅ HTML 렌더링
        app.innerHTML = route.content;
        initLanguageToggle();

        // ✅ 페이지 변경 시 언어 업데이트
        const currentLang = localStorage.getItem("language") || "en";
        await loadLanguage(currentLang);

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
        pageFuncs: [ToOther, loadProfile]
    },
    "/game": {
        content: gamePage,
        pageFuncs: [setupGame, ToOther, loadProfile]
    },
    "/profile": {
        content: profilePage,
        pageFuncs: [ToOther, loadProfile, editProfile]
    }
};

// 📌 라우터 실행
export const router = new Router(routes);
router.render();