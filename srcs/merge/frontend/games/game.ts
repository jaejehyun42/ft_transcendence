import { Mesh } from "@babylonjs/core";
import { updateAIPosition } from "./AI.js"
import { createImpactEffect } from "./effect.js";
import { scoreText, showWinner } from "./ui.js";
import { name_1p, name_2p, pauseGame, resumeGame } from "./loop.js";
import { ball, paddleLeft, paddleRight, paddleHeight, paddleWidth, ballSize } from "./draw.js";

export let gameRunning = false;
export let gameMode = "PvP";

const WINNING_SCORE = 11;
let leftScore = 0, rightScore = 0;
let countdownEndTime: number | null = null;
export let winner: string | null = null;

const speedIncrease = 1.02;
const maxBounceAngle = Math.PI / 4;

export const paddleSpeed = 24;
const constSpeedX = 18, constSpeedY = 12;
export let ballSpeedX = 18, ballSpeedY = 12;


const keys: { [key: string]: boolean } = {};
export const aiKeys: { [key: string]: boolean } = {};

window.addEventListener("keydown", (e) => {
    if (gameMode === "PvE" && (e.key === "ArrowUp" || e.key === "ArrowDown"))
        return;

    keys[e.key] = true;
});

window.addEventListener("keyup", (e) => {
    if (gameMode === "PvE" && (e.key === "ArrowUp" || e.key === "ArrowDown"))
        return;

    keys[e.key] = false;
});

// 게임 시작
export function startGame(mode: string)
{
    console.log("Game Start")
    winner = null;
    leftScore = 0;
    rightScore = 0;
    gameRunning = true;
    gameMode = mode;
    setCountdown();
    
    if (paddleLeft) paddleLeft.position.y = 0;
    if (paddleRight) paddleRight.position.y = 0;
    resetBall();
    updateAIPosition();
}

// 공 리셋
export function resetBall()
{
    if (!ball) return;

    ball.position.x = 0;
    ball.position.y = 0;
    ballSpeedX = Math.random() > 0.5 ? constSpeedX : -constSpeedX;
    ballSpeedY = Math.random() > 0.5 ? constSpeedY : -constSpeedY;
}

// 카운트 다운 설정
export function setCountdown()
{
    countdownEndTime = performance.now() + 3000;
    gameRunning = false;
    resetBall();
}

// 카운트다운 및 점수 업데이트
export function updateCountdown()
{
    if (!countdownEndTime) return;

    let remaining = countdownEndTime - performance.now();
    let count = Math.ceil(remaining / 1000);

    if (remaining > 0)
        scoreText.text = count.toString();
    else
    {
        gameRunning = true;
        countdownEndTime = null;
        scoreText.text = `${leftScore}  -  ${rightScore}`;
        updateAIPosition();
    }
}

// 오브젝트 업데이트
export function update(deltaTime: number)
{
    updateCountdown();

    if (!ball || !paddleLeft || !paddleRight) return;
    if (!gameRunning || countdownEndTime !== null) return;

    // 패들 이동
    if ((keys["w"] || keys["W"] || keys["ㅈ"]) && paddleLeft.position.y < 6.8) paddleLeft.position.y += paddleSpeed * deltaTime;
    if ((keys["s"] || keys["S"] || keys["ㄴ"]) && paddleLeft.position.y > -6.8) paddleLeft.position.y -= paddleSpeed * deltaTime;
    if (gameMode == "PvP")
    {
        if (keys["ArrowUp"] && paddleRight.position.y < 6.8) paddleRight.position.y += paddleSpeed * deltaTime;
        if (keys["ArrowDown"] && paddleRight.position.y > -6.8) paddleRight.position.y -= paddleSpeed * deltaTime;
    }
    else
    {
        if (aiKeys["ArrowUp"] && paddleRight.position.y < 6.8) paddleRight.position.y += paddleSpeed * deltaTime;
        if (aiKeys["ArrowDown"] && paddleRight.position.y > -6.8) paddleRight.position.y -= paddleSpeed * deltaTime;
    }

    // 공 이동
    ball.position.x += ballSpeedX * deltaTime;
    ball.position.y += ballSpeedY * deltaTime;

    // 벽 충돌 처리
    if (ball.position.y + ballSize / 2 >= 9) {
        ball.position.y = 9 - ballSize / 2;
        ballSpeedY *= -1;
    } 
    else if (ball.position.y - ballSize / 2 <= -9) {
        ball.position.y = -9 + ballSize / 2;
        ballSpeedY *= -1;
    }

    // 패들 상하단 충돌
    if (collisionPaddleHorz(paddleLeft) || collisionPaddleHorz(paddleRight))
    {
        createImpactEffect(ball.position);
    }
    else if (collisionPaddleVert(paddleLeft, deltaTime) || collisionPaddleVert(paddleRight, deltaTime))
    {
        createImpactEffect(ball.position);
    }

    // 득점 판정
    if (ball.position.x - ballSize / 2 <= -17) {
        rightScore++;
        if (!checkGameEnd()) setCountdown();
    }
    if (ball.position.x + ballSize / 2 >= 17) {
        leftScore++;
        if (!checkGameEnd()) setCountdown();
    }
}

// 패들 좌우 충돌
function collisionPaddleVert(paddle: Mesh, deltaTime: number): boolean
{

    let prevX = ball.position.x - ballSpeedX * deltaTime;
    let curX = ball.position.x;

    let paddleLeftEdge = paddle.position.x - paddleWidth / 2 - ballSize / 2;
    let paddleRightEdge = paddle.position.x + paddleWidth / 2 + ballSize / 2;

    let crossedPaddle =
        (prevX < paddleRightEdge && curX >= paddleLeftEdge) ||
        (prevX > paddleLeftEdge && curX <= paddleRightEdge);

    if (crossedPaddle &&
        ball.position.y >= paddle.position.y - paddleHeight / 2 &&
        ball.position.y <= paddle.position.y + paddleHeight / 2)
    {
        // 패들 중앙 기준 위치 (-1 ~ 1)
        let relativeIntersectY = (ball.position.y - paddle.position.y) / (paddleHeight / 2);
        relativeIntersectY = Math.max(-1, Math.min(1, relativeIntersectY));

        // 반사 각도 계산
        let bounceAngle = relativeIntersectY * maxBounceAngle;

        // 속도 계산 후 증가량 적용
        let speed = Math.sqrt(ballSpeedX * ballSpeedX + ballSpeedY * ballSpeedY) * speedIncrease;
        
        // 속도 설정
        ballSpeedX = (paddle === paddleLeft ? 1 : -1) * speed * Math.cos(bounceAngle);
        if (ballSpeedY >= 0)
            ballSpeedY = Math.abs(speed * Math.sin(bounceAngle));
        else
            ballSpeedY = -Math.abs(speed * Math.sin(bounceAngle));

        // 공 위치 보정
        if (paddle === paddleLeft) {
            ball.position.x = paddle.position.x + paddleWidth / 2 + ballSize / 2 + 0.02;
        } else {
            ball.position.x = paddle.position.x - paddleWidth / 2 - ballSize / 2 - 0.02;
        }
        return true;
    }
    return false;
}

// 패들 상하단 충돌
function collisionPaddleHorz(paddle: Mesh): boolean
{
    if (ball.position.x > paddle.position.x - paddleWidth / 2 && ball.position.x < paddle.position.x + paddleWidth / 2 &&
        ball.position.y + ballSize / 2 >= paddle.position.y - paddleHeight / 2 && ball.position.y - ballSize / 2 <= paddle.position.y + paddleHeight / 2)
    {
        if (ball.position.y > paddle.position.y) {
            ballSpeedY = Math.abs(ballSpeedY);
            ball.position.y = paddle.position.y + paddleHeight / 2 + ballSize / 2 + 0.02;
        } else {
            ballSpeedY = -Math.abs(ballSpeedY);
            ball.position.y = paddle.position.y - paddleHeight / 2 - ballSize / 2 - 0.02;
        }
        return true;
    }
    return false;
}

// 게임 종료 조건 체크
function checkGameEnd(): boolean
{
    if (leftScore >= 10 && rightScore >= 10)
    {
        if (Math.abs(leftScore - rightScore) >= 2)
        {
            finishGame();
            return true;
        }
    }
    else if (leftScore >= WINNING_SCORE || rightScore >= WINNING_SCORE)
    {
        finishGame();
        return true;
    }
    return false;
}

// 게임 종료
async function finishGame()
{
    pauseGame();
    if (leftScore > rightScore)
        winner = name_1p;
    else
        winner = name_2p;

    scoreText.text = `${leftScore}  -  ${rightScore}`;
    await showWinner(winner);
    resumeGame((winner) => {
        console.log(`Winner: ${winner}`);
    });
}
