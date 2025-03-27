export async function checkJWTAuth(
    route: { content: string },
    app: HTMLElement,
    router: any
): Promise<boolean> {
    try {
        const res = await fetch("/auth/check", {
            method: "GET",
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
            },
        });

        const data = await res.json();
        if (!data.authenticated) {
            if (data.message === "Refresh token has expired") {
                console.log("🚨 리프레시 토큰 만료, 로그인 필요");
                alert("리프레시 토큰 만료, 다시 로그인 해주세요.");
                router.navigate("/login");
                return false;
            }
            else{
                console.log("❌ JWT 인증 실패, 로그인 페이지로 이동");
                alert("먼저 로그인 해주세요.");
                router.navigate("/login");
                return false;
            }
        }

        console.log(data);
        console.log("✅ JWT 인증 성공, 페이지 렌더링");
        app.innerHTML = route.content;
        return true;

    } catch (error) {
        console.error("🚨 JWT 인증 오류:", error);
        router.navigate("/login");
        return false;
    }
}

export async function checkOAuth(
    router: any
): Promise<boolean> {
    try {
        const res = await fetch("/auth/oauth", {
            method: "GET",
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
            },
        });

        const data = await res.json();
        if (!data.authenticated) {
            console.log("❌ 구글 로그인 인증 실패, 로그인 페이지로 이동");
            alert("먼저 로그인 해주세요.");
            router.navigate("/login");
            return false;
        }

        console.log("✅ 구글 로그인 인증 성공");
        return true;

    } catch (error) {
        console.error("🚨 구글 인증 오류:", error);
        router.navigate("/login");
        return false;
    }
}

// JWT 토큰 유무 확인
export async function checkJWTexist(
    route: { content: string },
    app: HTMLElement,
    router: any
): Promise<boolean> {
    try {
        const res = await fetch("/auth/check", {
            method: "GET",
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
            },
        });

        const data = await res.json();
        if (data.authenticated) {
            console.log("✅ JWT 인증이 이미 완료됨, 대시보드 페이지로 이동");
            router.navigate("/dashboard");
            return false;
        }

        console.log("✅ JWT 인증 필요, OTP 페이지 렌더링");
        app.innerHTML = route.content;
        return true;

    } catch (error) {
        console.error("🚨 JWT 인증 오류:", error);
        alert("JWT 인증 요청 중 오류 발생!");
        router.navigate("/login");
        return false;
    }
}
