export async function logout(router: any) {
    const logoutButton = document.getElementById("logout-btn");

    if (logoutButton) {
        logoutButton.addEventListener("click", async () => {
            try {
                const res = await fetch("/auth/logout", {
                    method: "GET",
                    credentials: "include", // 쿠키 포함
                });
                const data = await res.json();

                if (res.ok && data.success) {
                    alert("로그아웃 되었습니다.");
                    router.navigate("/"); // 초기 페이지로 이동
                } else {
                    console.error("🚨 로그아웃 실패:", data.message);
                    alert("로그아웃에 실패했습니다.");
                }
            } catch (error) {
                console.error("🚨 로그아웃 요청 오류:", error);
                alert("로그아웃 중 오류가 발생했습니다.");
            }
        });
    }
}