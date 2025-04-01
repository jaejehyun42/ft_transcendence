import { Mesh } from "@babylonjs/core";
import { updateAIPosition } from "./AI.js"
import { createImpactEffect } from "./effect.js";
import { scoreText, showWinner } from "./ui.js";
import { name_1p, name_2p, pauseGame, resumeGame } from "./loop.js";
import { ball, paddleLeft, paddleRight, paddleHeight, paddleWidth, ballSize } from "./draw.js";

export let gameRunning = false;
export let gameMode = "PvP";

const WINNING_SCORE = 5;
let leftScore = 0, rightScore = 0;
let countdownEndTime: number | null = null;
export let result: { [key: string]: string | null} = {
    "winner": null,
    "name_1p": null,
    "score_1p": null,
    "name_2p": null,
    "score_2p": null
};

let increaseCount = 0;
const speedIncrease = 1.01;
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
    leftScore = 0;
    rightScore = 0;
    gameMode = mode;
    gameRunning = true;
    resumeGame();

    result["winner"] = null;
    result["name_1p"] = name_1p;
    result["score_1p"] = null;
    result["name_2p"] = name_2p;
    result["score_2p"] = null;


    if (paddleLeft) paddleLeft.position.y = 0;
    if (paddleRight) paddleRight.position.y = 0;

    setCountdown();
    updateAIPosition();

    console.log("Game Start")
}

// 공 리셋
export function resetBall()
{
    if (!ball) return;

    increaseCount = 0;
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
    if ((keys["w"] || keys["W"] || keys["ㅈ"]) && paddleLeft.position.y < 7) paddleLeft.position.y += paddleSpeed * deltaTime;
    if ((keys["s"] || keys["S"] || keys["ㄴ"]) && paddleLeft.position.y > -7) paddleLeft.position.y -= paddleSpeed * deltaTime;
    if (gameMode == "PvP")
    {
        if (keys["ArrowUp"] && paddleRight.position.y < 7) paddleRight.position.y += paddleSpeed * deltaTime;
        if (keys["ArrowDown"] && paddleRight.position.y > -7) paddleRight.position.y -= paddleSpeed * deltaTime;
    }
    else
    {
        if (aiKeys["ArrowUp"] && paddleRight.position.y < 7) paddleRight.position.y += paddleSpeed * deltaTime;
        if (aiKeys["ArrowDown"] && paddleRight.position.y > -7) paddleRight.position.y -= paddleSpeed * deltaTime;
    }

    // 패들 바운더리 처리
    if (paddleLeft.position.y > 7)
        paddleLeft.position.y = 7
    if (paddleLeft.position.y < -7)
        paddleLeft.position.y = -7
    if (paddleRight.position.y > 7)
        paddleRight.position.y = 7
    if (paddleRight.position.y < -7)
        paddleRight.position.y = -7


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

    // 패들 충돌
    if (checkPaddleCollision(paddleLeft, deltaTime))
        createImpactEffect(ball.position);
    if (checkPaddleCollision(paddleRight, deltaTime))
        createImpactEffect(ball.position);

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
    let paddleRightEdge = paddle.position.x + paddleWidth / 2 + ballSize / 2

    let crossedPaddle = paddle === paddleLeft 
        ? (prevX >= paddleRightEdge && curX < paddleRightEdge) || (curX > paddleLeftEdge && curX < paddleRightEdge)
        : (prevX <= paddleLeftEdge && curX > paddleLeftEdge) || (curX > paddleRightEdge && curX < paddleLeftEdge);

    if (crossedPaddle &&
        ball.position.y >= paddle.position.y - paddleHeight / 2 - ballSize / 4 &&
        ball.position.y <= paddle.position.y + paddleHeight / 2 + ballSize / 4)
    {
        // 패들 중앙 기준 위치 (-1 ~ 1)
        let relativeIntersectY = (ball.position.y - paddle.position.y) / (paddleHeight / 2);
        relativeIntersectY = Math.max(-1, Math.min(1, relativeIntersectY));

        // 반사 각도 계산
        let bounceAngle = relativeIntersectY * maxBounceAngle;

        // 속도 계산
        let speed = Math.sqrt(ballSpeedX * ballSpeedX + ballSpeedY * ballSpeedY);
        if (increaseCount < 30)
        {
            speed *= speedIncrease;
            increaseCount++;
        }

        // 속도 설정
        ballSpeedX = (paddle === paddleLeft ? 1 : -1) * Math.abs(speed * Math.cos(bounceAngle));
        ballSpeedY = Math.sign(ballSpeedY) * Math.abs(speed * Math.sin(bounceAngle));

        // 공 위치 보정
        ball.position.x = paddle === paddleLeft
            ? paddleRightEdge + 0.02
            : paddleLeftEdge - 0.02;
        return true;
    }
    return false;
}

// 패들 상하 충돌
function collisionPaddleHorz(paddle: Mesh, deltaTime: number): boolean
{
    let prevY = ball.position.y - ballSpeedX * deltaTime;
    let curY = ball.position.y;

    let paddleTopEdge = paddle.position.y + paddleHeight / 2 + ballSize / 2;
    let paddleBottomEdge = paddle.position.y - paddleHeight / 2 - ballSize / 2;

    let crossedPaddle =
        (prevY < paddleBottomEdge && curY >= paddleBottomEdge) ||
        (prevY > paddleTopEdge && curY <= paddleTopEdge);

    if (crossedPaddle &&
        ball.position.x >= paddle.position.x - paddleWidth / 2 - ballSize / 4 &&
        ball.position.x <= paddle.position.x + paddleWidth / 2 + ballSize / 4)
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

// 충돌 검사
function checkPaddleCollision(paddle: Mesh, deltaTime: number): boolean {
    if (collisionPaddleHorz(paddle, deltaTime))
        return true;
    return collisionPaddleVert(paddle, deltaTime);
}

// 게임 종료 조건 체크  
function checkGameEnd(): boolean
{
    if (leftScore >= WINNING_SCORE - 1 && rightScore >= WINNING_SCORE - 1)
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
    
    let winner;
    if (leftScore > rightScore)
        winner = name_1p;
    else
        winner = name_2p;

    result["winner"] = winner
    result["score_1p"] = leftScore.toString();
    result["score_2p"] = rightScore.toString();

    scoreText.text = `${leftScore}  -  ${rightScore}`;
    await showWinner(result["winner"]);
    resumeGame();
}
