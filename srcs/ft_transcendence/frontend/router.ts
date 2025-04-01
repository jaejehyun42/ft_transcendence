import { initSidebarEvents } from "./sidebar.js"
import { initLanguageToggle, loadLanguage } from "./locales/lang.js";
import { loadingPage, loadingScreen } from "./pages/loading.js";
import { loginPage, setupLogin } from "./pages/login.js";
import { otpPage, setupOTP } from "./pages/otp.js";
import { checkJWTAuth, checkOAuth, checkJWTexist } from "./auth/auth.js";
import { dashboardPage, ToOther, setDashBoard } from "./pages/dashboard.js";
import { gamePage, setupGame } from "./pages/game.js";
import { profilePage, loadProfile, editProfile } from "./pages/profile.js";
import { logout } from "./auth/logout.js"

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

        let authSuccess = true;
        if (path !== "/login" && path !== "/" && path !== "/otp")
            authSuccess = await checkJWTAuth(route, app, this);
        else if (path === "/otp"){
            authSuccess = await checkOAuth(this);
            if (!authSuccess) return;
            authSuccess = await checkJWTexist(route, app, this);
        }
        else
            app.innerHTML = route.content;

        if (!authSuccess) return;

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
        pageFuncs: [initSidebarEvents, ToOther, loadProfile, setDashBoard, logout]
    },
    "/game": {
        content: gamePage,
        pageFuncs: [initSidebarEvents, setupGame, ToOther, loadProfile, logout]
    },
    "/profile": {
        content: profilePage,
        pageFuncs: [initSidebarEvents, ToOther, loadProfile, editProfile, logout]

    }
};

// 📌 라우터 실행
export const router = new Router(routes);
router.render();
