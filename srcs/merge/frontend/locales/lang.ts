export async function loadLanguage(lang: string): Promise<void> {
    try {
        const url = `/locales/${lang}.json`

        const response = await fetch(url);

        const translations = await response.json();

        // ✅ 언어 전부 바꾸기(로드)
        document.querySelectorAll("[data-i18n]").forEach((element) => {
            const key = element.getAttribute("data-i18n");
            if (key && translations[key]) {
                if (element.tagName === "INPUT") {
                    (element as HTMLInputElement).setAttribute("placeholder", translations[key]); // ✅ 입력 필드 업데이트
                } else if (element.tagName === "BUTTON") {
                    element.textContent = translations[key]; // ✅ 버튼 업데이트
                } else {
                    element.textContent = translations[key]; // ✅ 기본 텍스트 업데이트
                }
            }
        });

        // ✅ 언어가 정상적으로 로드된 경우에만 저장
        localStorage.setItem("language", lang);
    } catch (error) {
        console.error("Error loading language:", error);
    }
}
export function initLanguageToggle(): void {
    const langToggleBtn = document.getElementById("lang-toggle") as HTMLButtonElement;
    if (!langToggleBtn) {
        console.warn("⚠️ 언어 변경 버튼이 없음. 페이지 로딩 후 다시 실행 필요.");
        return;
    }

    console.log("✅ 언어 변경 버튼 초기화됨!");

    let currentLang: string = localStorage.getItem("language") || "en";

    function updateLanguageIcon(): void {
        const imgElement = langToggleBtn.querySelector("img") as HTMLImageElement;
        if (imgElement) {
            imgElement.src = currentLang === "en" ? "/icons/flag-usa.png" : "/icons/flag-korea.png";
        }
    }

    updateLanguageIcon();

    langToggleBtn.onclick = async () => { // ✅ 기존 이벤트 리스너 제거 후 새로 추가
        currentLang = currentLang === "en" ? "ko" : "en";
        localStorage.setItem("language", currentLang);
        await loadLanguage(currentLang);
        updateLanguageIcon();
    };
}