import { ball, paddleHeight, paddleRight } from "./draw.js";
import { gameMode, gameRunning, aiKeys, ballSpeedX, ballSpeedY, paddleSpeed } from "./game.js";

let aiTargetY = 0;
let keyPressed = false;

let updateID: number | null;
let moveID: number | null;

// 공의 예상 도착 위치 계산
function predictBallY(): number
{
	let tempX = ball.position.x;
	let tempSpeedX = ballSpeedX / 60;
	let predictedY = ball.position.y;
	let predictedSpeedY = ballSpeedY / 60;

	while (tempX < 15 && tempX > -18)
	{
		tempX += tempSpeedX;
		predictedY += predictedSpeedY;

		// 벽 충돌 처리
		if (predictedY >= 9) {
			predictedY = 9;
			predictedSpeedY *= -1;
		} 
		else if (predictedY <= -9) {
			predictedY = -9;
			predictedSpeedY *= -1;
		}

		// 패들 충돌 처리
		if (tempX <= -15 && tempSpeedX < 0) {
			tempSpeedX *= -1;
		}
	}

	return predictedY;
}

// 키 입력을 일정 시간 동안 유지하는 함수
function simulateKeyPress(key: string, duration: number)
{
	keyPressed = true;
	aiKeys[key] = true;

	setTimeout(() => {
		keyPressed = false;
		aiKeys[key] = false;
	}, duration);
}

export function updateAIPosition()
{
	if (gameMode === "PvE" && gameRunning)
		aiTargetY = predictBallY() * (0.9 + Math.random() * 0.2);
}

export function moveAIPostion()
{
	if (gameMode !== "PvE" || !gameRunning)
		return;

	let leftDistance = Math.abs(paddleRight.position.y - aiTargetY);
	let keyPressTime = 800 * leftDistance / paddleSpeed;

	if (keyPressed)
		return ;
	if (leftDistance <= paddleHeight / 2)
		return ;
	if (paddleRight.position.y < aiTargetY)
		simulateKeyPress("ArrowUp", keyPressTime);
	else if (paddleRight.position.y > aiTargetY)
		simulateKeyPress("ArrowDown", keyPressTime);
}

export function startIntervalAI()
{
	if (gameMode !== "PvE")
		return;

	console.log("Start AI System");
	clearIntervalAI();
	updateID = setInterval(() => { 
		updateAIPosition();
	}, 1000);

	moveID = setInterval(() => {
		if (Math.random() > 0.97)
		{
			aiKeys["ArrowUP"] = false;
			aiKeys["ArrowDown"] = false;
			if (Math.random() > 0.5)
				simulateKeyPress("ArrowUp", 200);
			else
				simulateKeyPress("ArrowDown", 200);
		}
	}, 300);
}

export function clearIntervalAI()
{
	if (updateID)
	{
		clearInterval(updateID);
		updateID = null;
	}
	if (moveID)
	{
		clearInterval(moveID);
		moveID = null;
	}
}