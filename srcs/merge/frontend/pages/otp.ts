export let otpPage = `
<div class="container">
        <h1>Google OTP 인증</h1>
        <div id="qr-code-container">
            <h3>QR 코드:</h3>
            <img id="qr-code" src="/generate-qr" alt="QR Code">
            <p>Google Authenticator 앱으로 QR 코드를 스캔하세요.</p>
        </div>
        <div id="otp-container">
            <h3>OTP 입력:</h3>
            <input type="text" id="otp-input" placeholder="6자리 숫자를 입력하세요" maxlength="6">
            <button id="verify-btn">인증하기</button>
            <p id="result" class="error"></p>
        </div>
    </div>
    <style>
        body {
            background-color: #111;
            color: white;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
        }

        .container {
            background-color: #333;
            padding: 20px;
            border-radius: 10px;
            text-align: center;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
            width: 350px;
        }

        h1 {
            font-size: 26px;
            font-weight: bold;
            margin-bottom: 15px;
        }

        h3 {
            font-size: 18px;
            margin-bottom: 10px;
        }

        #qr-code-container {
            display: flex;
            flex-direction: column;
            align-items: center;
        }

        #qr-code {
            width: 200px;
            height: 200px;
            margin-bottom: 10px;
        }

        #otp-container {
            display: flex;
            flex-direction: column;
            align-items: center;
        }

        input {
            width: 80%;
            padding: 8px;
            font-size: 16px;
            text-align: center;
            border: 1px solid #ccc;
            border-radius: 5px;
            margin-bottom: 10px;
        }

        button {
            background-color: #4CAF50;
            color: white;
            border: none;
            padding: 10px 20px;
            font-size: 16px;
            border-radius: 5px;
            cursor: pointer;
            transition: background 0.3s;
        }

        button:hover {
            background-color: #45a049;
        }

        #result {
            margin-top: 10px;
            font-size: 14px;
            font-weight: bold;
        }

        .error {
            color: red;
        }
    </style>
`;

export function setupOTP() {
    document.getElementById("verify-btn")?.addEventListener("click", async () => {
        const otpInput = document.getElementById("otp-input") as HTMLInputElement;
        const resultMessage = document.getElementById("result");

        if (!otpInput || !resultMessage) return;

        const otp = otpInput.value.trim();
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
    });
}