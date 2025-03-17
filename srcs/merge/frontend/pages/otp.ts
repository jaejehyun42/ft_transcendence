export let otpPage = `
    <div class="fixed inset-0 flex justify-center items-center bg-gray-200">
        <div class="bg-blue-400 p-6 rounded-lg text-center shadow-lg w-80">
            <h1 class="text-xl font-bold mb-4">
                Google OTP 인증
            </h1>
            
            <div id="qr-code-container" class="flex flex-col items-center">
                <h3 class="text-lg mb-2">
                    QR 코드:
                </h3>
                <img id="qr-code" src="/generate-qr" alt="QR Code" class="w-48 h-48 mb-2">
                <p class="text-sm">
                    Google Authenticator 앱으로 <span class="w-full block text-center"> QR 코드를 스캔하세요.
                </p>
            </div>
            
            <div id="otp-container" class="flex flex-col items-center mt-4">
                <h3 class="text-lg mb-2">
                    OTP 입력:
                </h3>
                <input type="text" id="otp-input" placeholder="6자리 숫자를 입력하세요" maxlength="6" 
                    class="w-4/5 p-2 text-center text-gray-900 bg-gray-100 border border-gray-300 rounded mb-2">
                <button id="verify-btn" 
                    class="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded transition">인증하기</button>
                <p id="result" class="mt-2 text-sm font-bold text-red-500"></p>
            </div>
        </div>
    </div>
`;

export function setupOTP() {
    const otpInput = document.getElementById("otp-input") as HTMLInputElement;
    const verifyBtn = document.getElementById("verify-btn") as HTMLButtonElement;
    const resultMessage = document.getElementById("result");

    if (!otpInput || !verifyBtn || !resultMessage) return;

    // 버튼 클릭 이벤트
    verifyBtn.addEventListener("click", async () => {
        await handleOTPVerification();
    });

    // 엔터 키 이벤트 추가
    otpInput.addEventListener("keyup", async (event) => {
        if (event.key === "Enter") {
            await handleOTPVerification();
        }
    });

    async function handleOTPVerification() {
        const otp = otpInput.value.trim();
        if (!resultMessage) return;

        if (otp.length !== 6 || isNaN(Number(otp))) {
            resultMessage.textContent = "OTP는 6자리 숫자여야 합니다.";
            resultMessage.classList.add("error");
            return;
        }

        const response = await fetch("/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token: otp }),
        });

        const data = await response.json();
        if (data.success) {
            window.location.href = "/dashboard"; // ✅ OTP 성공 시 이동
        } else {
            resultMessage.textContent = "OTP 인증 실패!";
            resultMessage.classList.add("error");
        }
    }
}
