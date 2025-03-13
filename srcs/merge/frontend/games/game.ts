import { startButton } from "./loop.js";
import { ball, paddleLeft, paddleRight, paddleHeight, paddleWidth, countdownText, ballSize } from "./draw.js";

const WINNING_SCORE = 11;
let gameRunning = false;
let leftScore = 0, rightScore = 0;
let countdownEndTime: number | null = null;

let ballSpeedX = 0.3, ballSpeedY = 0.2;
const constSpeedX = 0.3, constSpeedY = 0.2;
const paddleSpeed = 0.4;

const keys: { [key: string]: boolean } = {};
window.addEventListener("keydown", (e) => (keys[e.key] = true));
window.addEventListener("keyup", (e) => (keys[e.key] = false));

export function startGame()
{
    const gameContainer = document.getElementById('gameCanvas'); // 게임 캔버스 ID

    document.addEventListener('keydown', (event) => { // 애로우키 스크롤 방지
        if (document.activeElement === gameContainer) {
            const keysToPrevent = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];

            if (keysToPrevent.includes(event.key)) {
                event.preventDefault();
            }
        }
    });

    if (!ball || !paddleLeft || !paddleRight) return;

    gameRunning = true;
    leftScore = 0;
    rightScore = 0;

    ballSpeedX = Math.random() > 0.5 ? constSpeedX : -constSpeedX;
    ballSpeedY = Math.random() > 0.5 ? constSpeedY : -constSpeedY;
    setCountdown();
}

export function resetGame() {
    gameRunning = false;
    leftScore = 0;
    rightScore = 0;
    countdownEndTime = null;

    if (ball) {
        ball.position.x = 0;
        ball.position.y = 0;
    }

    if (paddleLeft) paddleLeft.position.y = 0;
    if (paddleRight) paddleRight.position.y = 0;

    ballSpeedX = 0.2 * (Math.random() > 0.5 ? 1 : -1);
    ballSpeedY = 0.15 * (Math.random() > 0.5 ? 1 : -1);

    if (startButton) startButton.isVisible = true;  // ✅ 시작 버튼 보이게 설정
}

export function resetBall()
{
    if (!ball) return;

    ball.position.x = 0;
    ball.position.y = 0;
    ballSpeedX = Math.random() > 0.5 ? constSpeedX : -constSpeedX;
    ballSpeedY = Math.random() > 0.5 ? constSpeedY : -constSpeedY;
}

export function setCountdown()
{
    countdownEndTime = performance.now() + 3000;
    gameRunning = false;
    resetBall();
}

export function updateCountdown()
{
    if (!countdownEndTime) return;

    let remaining = countdownEndTime - performance.now();
    let count = Math.ceil(remaining / 1000);

    if (remaining > 0)
        countdownText.text = count.toString();
    else
    {
        countdownText.text = "";
        countdownEndTime = null;
        gameRunning = true;
    }
}

export function update()
{
    updateCountdown();

    if (!ball || !paddleLeft || !paddleRight) return;
    if (!gameRunning || countdownEndTime !== null) return;

    // 패들 이동
    if ((keys["w"] || keys["W"] || keys["ㅈ"]) && paddleLeft.position.y < 6) paddleLeft.position.y += paddleSpeed;
    if ((keys["s"] || keys["S"] || keys["ㄴ"]) && paddleLeft.position.y > -6) paddleLeft.position.y -= paddleSpeed;
    if (keys["ArrowUp"] && paddleRight.position.y < 6) paddleRight.position.y += paddleSpeed;
    if (keys["ArrowDown"] && paddleRight.position.y > -6) paddleRight.position.y -= paddleSpeed;

    // 공 이동 (이전 위치 저장)
    ball.position.x += ballSpeedX;
    ball.position.y += ballSpeedY;

    // 벽 충돌 처리
    if (ball.position.y + ballSize / 2 >= 8 || ball.position.y - ballSize / 2 <= -8) {
        ballSpeedY *= -1;
    }

    // 패들 상하단 충돌
    if (ball.position.x >= paddleLeft.position.x - paddleWidth / 2 && ball.position.x <= paddleLeft.position.x + paddleWidth / 2 &&
        ball.position.y + ballSize / 2 >= paddleLeft.position.y - paddleHeight / 2 && ball.position.y - ballSize / 2 <= paddleLeft.position.y + paddleHeight / 2)
    {
        if (ball.position.y > paddleLeft.position.y) {
            ballSpeedY *= -1;
            ball.position.y = paddleLeft.position.y + paddleHeight / 2 + ballSize / 2;
        }
        else {
            ballSpeedY *= -1;
            ball.position.y = paddleLeft.position.y - paddleHeight / 2 - ballSize / 2;
        }
    }
    if (ball.position.x >= paddleRight.position.x - paddleWidth / 2 && ball.position.x <= paddleRight.position.x + paddleWidth / 2 &&
        ball.position.y + ballSize / 2 >= paddleRight.position.y - paddleHeight / 2 && ball.position.y - ballSize / 2 <= paddleRight.position.y + paddleHeight / 2)
    {
        if (ball.position.y > paddleRight.position.y) {
            ballSpeedY *= -1;
            ball.position.y = paddleRight.position.y + paddleHeight / 2 + ballSize / 2;
        }
        else {
            ballSpeedY *= -1;
            ball.position.y = paddleRight.position.y - paddleHeight / 2 - ballSize / 2;
        }
    }

    // 패들 충돌 좌우 처리
    if (ball.position.x - ballSize / 2 <= paddleLeft.position.x + paddleWidth / 2 && ball.position.x + ballSize / 2 >= paddleLeft.position.x - paddleWidth / 2 &&
        ball.position.y <= paddleLeft.position.y + paddleHeight / 2 && ball.position.y >= paddleLeft.position.y - paddleHeight / 2)
    {
        ballSpeedX *= -1;
        ball.position.x = paddleLeft.position.x + paddleWidth;
    }
    if (ball.position.x + ballSize / 2 >= paddleRight.position.x - paddleWidth / 2 && ball.position.x - ballSize / 2 <= paddleRight.position.x + paddleWidth &&
        ball.position.y <= paddleRight.position.y + paddleHeight / 2 && ball.position.y >= paddleRight.position.y - paddleHeight / 2)
    {
        ballSpeedX *= -1;
        ball.position.x = paddleRight.position.x - paddleWidth;
    }

    // 득점 판정
    if (ball.position.x - ballSize / 2 <= -17) {
        rightScore++;
        updateScore();
        if (!checkGameEnd()) setCountdown();
    }
    if (ball.position.x + ballSize / 2 >= 17) {
        leftScore++;
        updateScore();
        if (!checkGameEnd()) setCountdown();
    }
}

// 점수 업데이트
function updateScore()
{
    const scoreBoard = document.getElementById("scoreBoard");
    if (scoreBoard) scoreBoard.textContent = `Player 1: ${leftScore} | Player 2: ${rightScore}`;
}

// 게임 종료 조건 체크
function checkGameEnd(): boolean
{
    if (leftScore >= 10 && rightScore >= 10)
    {
        if (Math.abs(leftScore - rightScore) >= 2)
        {
            gameRunning = false;
            startButton.isVisible = true;
            return true;
        }
    }
    else if (leftScore >= WINNING_SCORE || rightScore >= WINNING_SCORE)
    {
        gameRunning = false;
        startButton.isVisible = true;
        return true;
    }
    return false;
}