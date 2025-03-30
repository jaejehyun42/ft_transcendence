import { ball, paddleHeight, paddleRight } from "./draw.js";
import { gameMode, gameRunning, aiKeys, ballSpeedX, ballSpeedY, paddleSpeed } from "./game.js";
import * as tf from '@tensorflow/tfjs';


let aiTargetY = 0;
let keyPressed = false;

let updateID: ReturnType<typeof setInterval> | null = null;
let moveID: ReturnType<typeof setInterval> | null = null;

// DQN 모델 클래스
class DQNAgent {
  private model: tf.LayersModel;
  private targetModel: tf.LayersModel;
  private replayBuffer: any[] = [];
  private epsilon: number = 1.0;
  private epsilonMin: number = 0.1;
  private epsilonDecay: number = 0.995;
  private gamma: number = 0.99;
  private batchSize: number = 32;
  
  constructor() {
	this.model = this.createModel();
	this.targetModel = this.createModel();
	this.updateTargetModel();
  }
  
  // 신경망 모델 생성
  private createModel(): tf.LayersModel {
	const model = tf.sequential();
	model.add(tf.layers.dense({ inputShape: [6], units: 24, activation: 'relu' }));
	model.add(tf.layers.dense({ units: 24, activation: 'relu' }));
	model.add(tf.layers.dense({ units: 3, activation: 'linear' }));
	
	model.compile({
	  optimizer: tf.train.adam(0.001),
	  loss: 'meanSquaredError'
	});
	
	return model;
  }
  
  // 상태 관측 (입력 특성 구성)
  public getState(): tf.Tensor {
	// [공의 x위치, 공의 y위치, 공의 x속도, 공의 y속도, 패들의 y위치, 목표 y위치와의 차이]
	return tf.tensor2d([[
	  ball.position.x / 20, // 정규화
	  ball.position.y / 10,
	  ballSpeedX / 15,
	  ballSpeedY / 15,
	  paddleRight.position.y / 10,
	  (paddleRight.position.y - ball.position.y) / 10
	]]);
  }
  
  // 행동 선택 (위로, 아래로, 정지)
  public chooseAction(state: tf.Tensor): number {
	if (Math.random() < this.epsilon) {
	  return Math.floor(Math.random() * 3);
	}
	
	// 활용: 모델 기반 행동 선택
	const prediction = this.model.predict(state) as tf.Tensor;
	const action = tf.argMax(prediction, 1).dataSync()[0];
	prediction.dispose(); // 여기에 dispose 추가
	return action;
  }
  
  // 행동을 실제 키 입력으로 변환
  public executeAction(action: number, duration: number = 200) {
	aiKeys["ArrowUp"] = false;
	aiKeys["ArrowDown"] = false;
	
	if (action === 0) { // 위로 이동
	  simulateKeyPress("ArrowUp", duration);
	} else if (action === 1) { // 아래로 이동
	  simulateKeyPress("ArrowDown", duration);
	}
	// action 2는 정지 (아무것도 안함)
  }
  
  // 타겟 모델 업데이트
  public updateTargetModel() {
	this.targetModel.setWeights(this.model.getWeights());
  }
  
  // 경험 메모리에 저장
  public remember(state: tf.Tensor, action: number, reward: number, nextState: tf.Tensor, done: boolean) {
	this.replayBuffer.push({
	  state: state.arraySync(),
	  action,
	  reward,
	  nextState: nextState.arraySync(),
	  done
	});
	
	// 버퍼 크기 제한
	if (this.replayBuffer.length > 2000) {
	  this.replayBuffer.shift();
	}
  }
  
  // 학습 함수
  // 학습 함수
public replay() {
	if (this.replayBuffer.length < this.batchSize) return;
	
	// 미니배치 무작위 추출
	const miniBatch = [];
	for (let i = 0; i < this.batchSize; i++) {
	  const randomIndex = Math.floor(Math.random() * this.replayBuffer.length);
	  miniBatch.push(this.replayBuffer[randomIndex]);
	}
	
	// 배치 텐서 준비
	const stateBatch = tf.tensor2d(miniBatch.map(exp => exp.state[0]));
	const actionBatch = tf.tensor1d(miniBatch.map(exp => exp.action), 'int32');
	const rewardBatch = tf.tensor1d(miniBatch.map(exp => exp.reward));
	const nextStateBatch = tf.tensor2d(miniBatch.map(exp => exp.nextState[0]));
	const doneBatch = tf.tensor1d(miniBatch.map(exp => exp.done ? 1 : 0));
	
	// 현재 상태에서의 Q 값 예측
	const currentQValues = this.model.predict(stateBatch) as tf.Tensor;
	
	// 다음 상태에서의 Q 값 예측 (타겟 네트워크 사용)
	const nextQValues = this.targetModel.predict(nextStateBatch) as tf.Tensor;
	
	// 최대 Q 값 계산
	const maxNextQ = tf.max(nextQValues, 1);
	
	// 타겟 Q 값 계산: reward + gamma * max(Q(s',a')) * (1 - done)
	const targetMask = tf.scalar(1).sub(doneBatch);
	const targetQPart = maxNextQ.mul(tf.scalar(this.gamma)).mul(targetMask);
	const targetQ = rewardBatch.add(targetQPart);
	
	// 업데이트할 Q 값 생성 (현재 Q 값 복사)
	const updatedQValues = currentQValues.clone();
	
	// 선택한 액션에 대한 Q 값만 업데이트
	const oneHotActions = tf.oneHot(actionBatch, 3);
	const negOneHotActions = oneHotActions.mul(tf.scalar(-1)).add(tf.scalar(1));
	
	// Q(s,a) = r + gamma * max(Q(s',a'))
	// 선택한 액션의 Q 값만 업데이트하고 나머지는 그대로 유지
	const maskedCurrentQ = currentQValues.mul(negOneHotActions);
	const maskedTargetQ = oneHotActions.mul(targetQ.expandDims(1));
	const newQValues = maskedCurrentQ.add(maskedTargetQ);
	
	// 모델 학습
	this.model.fit(stateBatch, newQValues, {
	  epochs: 1,
	  verbose: 0
	}).then(() => {
	  // 입실론 감소 (탐색 확률 줄이기)
	  if (this.epsilon > this.epsilonMin) {
		this.epsilon *= this.epsilonDecay;
	  }
	  
	  // 메모리 정리
	  stateBatch.dispose();
	  actionBatch.dispose();
	  rewardBatch.dispose();
	  nextStateBatch.dispose();
	  doneBatch.dispose();
	  currentQValues.dispose();
	  nextQValues.dispose();
	  maxNextQ.dispose();
	  targetMask.dispose();
	  targetQPart.dispose();
	  targetQ.dispose();
	  updatedQValues.dispose();
	  oneHotActions.dispose();
	  negOneHotActions.dispose();
	  maskedCurrentQ.dispose();
	  maskedTargetQ.dispose();
	  newQValues.dispose();
	});
	
	// 주기적으로 타겟 네트워크 업데이트 (예: 매 10회 학습마다)
	if (Math.random() < 0.1) {
	  this.updateTargetModel();
	  console.log("Target model updated, epsilon:", this.epsilon.toFixed(3));
	}
  }
}

// 전역 변수로 에이전트 선언
let dqnAgent: DQNAgent | null = null;
let lastState: tf.Tensor | null = null;
let lastAction: number | null = null;

// AI 위치 업데이트 함수 (DQN 기반)
export function updateAIPositionDQN() {
  if (gameMode !== "PvE" || !gameRunning || !dqnAgent) return;
  
  // 현재 상태 관측
  const currentState = dqnAgent.getState();
  
  // 이전 행동에 대한 보상 계산 및 학습 (게임 진행 중일 때)
  if (lastState !== null && lastAction !== null) {
	// 보상 계산 (예: 패들이 공과 같은 y위치에 있을수록 보상)
	const reward = 1 - Math.min(1, Math.abs(paddleRight.position.y - ball.position.y) / 10);
	
	// 경험 저장
	dqnAgent.remember(lastState, lastAction, reward, currentState, false);
	
	// 주기적 학습
	dqnAgent.replay();
  }
  
  // 새로운 행동 선택
  const action = dqnAgent.chooseAction(currentState);
  
  // 상태와 행동 저장
  lastState = currentState;
  lastAction = action;
  
  // 선택된 행동 실행
  dqnAgent.executeAction(action);
}

// DQN 시스템 시작 함수
export function startDQNSystem() {
  if (gameMode !== "PvE") return;
  
  console.log("Starting DQN AI System");
  
  // 기존 인터벌 초기화
  clearIntervalAI();
  
  // DQN 에이전트 초기화
  dqnAgent = new DQNAgent();
  
  // 상태/행동 기록 초기화
  lastState = null;
  lastAction = null;
  
  // DQN 업데이트 인터벌 설정
  updateID = setInterval(() => {
	updateAIPositionDQN();
  }, 100); // 더 빠른 의사결정을 위해 주기 단축
}


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