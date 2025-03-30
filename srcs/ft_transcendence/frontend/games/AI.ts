import { ball, paddleHeight, paddleRight } from "./draw.js";
import { gameMode, gameRunning, aiKeys, ballSpeedX, ballSpeedY, paddleSpeed } from "./game.js";
import * as tf from '@tensorflow/tfjs';


let aiTargetY = 0;
let keyPressed = false;
let lastBallDirectionX = 0; // 이전 프레임의 공 x방향

let updateID: ReturnType<typeof setInterval> | null = null;
let moveID: ReturnType<typeof setInterval> | null = null;

// 전역 변수로 에이전트 선언
let dqnAgent: DQNAgent | null = null;
let lastState: tf.Tensor | null = null;
let lastAction: number | null = null;

// DQN 모델 클래스
class DQNAgent {
  private model: tf.LayersModel;
  private targetModel: tf.LayersModel;
  private replayBuffer: any[] = [];
  public epsilon: number = 1.0;
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

	this.targetModel.compile({
		optimizer: tf.train.adam(0.001),
		loss: 'meanSquaredError'
	  });
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
  
  public async loadPretrainedModel(source: string): Promise<boolean> {
	try {
	  // 외부 모델 로드
	  const loadedModel = await tf.loadLayersModel(source);
	  this.model = loadedModel;

	  loadedModel.compile({
		optimizer: tf.train.adam(0.001),
		loss: 'meanSquaredError'
	  });
	  
	  // 타겟 모델도 업데이트
	  this.updateTargetModel();
	  console.log("사전 학습된 모델 로드 성공");
	  return true;
	} catch (e) {
	  console.error("모델 로드 실패:", e);
	  return false;
	}
  }

  public async saveModel(path: string): Promise<void> {
	await this.model.save(path);
  }

  // 학습 함수
public async replay() {
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
	await this.model.fit(stateBatch, newQValues, {
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

// 개선된 보상 계산 함수
function calculateReward(): number {
	// 기본 보상: 패들과 공의 거리
	const positionReward = 1 - Math.min(1, Math.abs(paddleRight.position.y - ball.position.y) / 10);
	
	// 공이 플레이어쪽으로 오고 있는지 확인 (더 중요한 시점)
	const ballComingTowards = ballSpeedX > 0;
	
	// 공이 패들 근처에 있는지 확인
	const isNearPaddle = ball.position.x > 10;
	
	// 성공적인 방어 보상 (공이 패들에 맞았을 때)
	const defendSuccess = lastBallDirectionX > 0 && ballSpeedX < 0;
	const defendReward = defendSuccess ? 10 : 0;
	
	// 가중치 부여
	let totalReward = 0;
	
	if (isNearPaddle && ballComingTowards) {
	  // 중요한 순간 - 위치 보상에 높은 가중치
	  totalReward += positionReward * 3;
	} else {
	  // 일반적인 상황 - 낮은 가중치
	  totalReward += positionReward * 0.5;
	}
	
	// 방어 성공 보상 추가
	totalReward += defendReward;
	
	// 디버깅
	if (defendSuccess) {
	  console.log("방어 성공! 보상:", defendReward);
	}
	
	return totalReward;
  }


// AI 위치 업데이트 함수 (DQN 기반)
export function updateAIPositionDQN() {
  if (gameMode !== "PvE" || !gameRunning || !dqnAgent) return;
  
  // 현재 상태 관측
  const currentState = dqnAgent.getState();
  
  // 이전 행동에 대한 보상 계산 및 학습 (게임 진행 중일 때)
  if (lastState !== null && lastAction !== null) {
	// 보상 계산 (예: 패들이 공과 같은 y위치에 있을수록 보상)
	const reward = calculateReward();
	
	// 경험 저장
	dqnAgent.remember(lastState, lastAction, reward, currentState, false);
	
	// 주기적 학습
	dqnAgent.replay();
  }
  
  // 새로운 행동 선택
  const action = dqnAgent.chooseAction(currentState);
  
  // 상태와 행동 저장
  if (lastState !== null) {
	lastState.dispose(); // 이전 상태 해제
  }
  lastState = currentState;
  lastAction = action;

//   currentState.dispose(); // 메모리 해제
  
  // 선택된 행동 실행
  dqnAgent.executeAction(action);
}

// DQN 시스템 시작 함수
export async function startDQNSystem() {
	if (gameMode !== "PvE") return;
  
	console.log("Starting DQN AI System");
	clearIntervalAI();
	
	// DQN 에이전트 초기화
	dqnAgent = new DQNAgent();
	
	// 외부 모델 로드 시도
	try {
	  // 로컬 스토리지에서 로드
	  const success = await dqnAgent.loadPretrainedModel('indexeddb://pong-dqn-model');
	  if (success) {
		console.log("저장된 모델을 성공적으로 로드했습니다.");
	  } else {
		console.log("저장된 모델이 없어 새 모델로 시작합니다.");
	  }
	} catch (e) {
	  console.log("모델 로드 중 오류, 새 모델로 시작합니다.");
	}
  
  // 상태/행동 기록 초기화
  lastState = null;
  lastAction = null;

  // DQN 업데이트 인터벌 설정
  updateID = setInterval(() => {
	updateAIPositionDQN();
  }, 1000); // 더 빠른 의사결정을 위해 주기 단축
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

export function moveAIPosition()
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
			aiKeys["ArrowUp"] = false;
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

export async function saveModel() {
	if (!dqnAgent) return;
	
	try {
	  // 브라우저의 IndexedDB에 모델 저장
	  await dqnAgent.saveModel('indexeddb://pong-dqn-model');
	  console.log("모델 저장 완료");
	} catch (e) {
	  console.error("모델 저장 실패:", e);
	}
  }

export async function runAutoTraining(episodes: number = 1000) {
	if (!dqnAgent) {
	  dqnAgent = new DQNAgent();
	}
	
	console.log("자동 학습 시작: " + episodes + "회");
	
	// 환경 시뮬레이션 변수
	let simulatedBallX = 0;
	let simulatedBallY = 0;
	let simulatedBallSpeedX = 10;
	let simulatedBallSpeedY = Math.random() * 10 - 5;
	let simulatedPaddleY = 0;
	let score = 0;
	let episode = 0;
	
	// 환경 초기화 함수
	const resetEnvironment = () => {
	  simulatedBallX = 0;
	  simulatedBallY = 0;
	  simulatedBallSpeedX = 10;
	  simulatedBallSpeedY = Math.random() * 10 - 5;
	  simulatedPaddleY = 0;
	  episode++;
	  return getSimulatedState();
	};
	
	// 상태 관측 함수
	const getSimulatedState = () => {
	  return tf.tensor2d([[
		simulatedBallX / 20,
		simulatedBallY / 10,
		simulatedBallSpeedX / 15,
		simulatedBallSpeedY / 15,
		simulatedPaddleY / 10,
		(simulatedPaddleY - simulatedBallY) / 10
	  ]]);
	};
	
	// 행동 수행 함수
	const executeSimulatedAction = (action: number) => {
	  // 패들 이동
	  if (action === 0) { // 위로
		simulatedPaddleY = Math.min(9, simulatedPaddleY + 1);
	  } else if (action === 1) { // 아래로
		simulatedPaddleY = Math.max(-9, simulatedPaddleY - 1);
	  }
	  
	  // 공 이동
	  simulatedBallX += simulatedBallSpeedX * 0.1;
	  simulatedBallY += simulatedBallSpeedY * 0.1;
	  
	  // 벽 충돌
	  if (simulatedBallY >= 9 || simulatedBallY <= -9) {
		simulatedBallSpeedY *= -1;
	  }
	  
	  // 패들 충돌 (x=15에서)
	  let hitPaddle = false;
	  if (simulatedBallX >= 14 && simulatedBallX <= 16 && 
		  Math.abs(simulatedBallY - simulatedPaddleY) <= 2) {
		simulatedBallSpeedX *= -1;
		hitPaddle = true;
	  }
	  
	  // 득점/실점 확인
	  let done = false;
	  let reward = 0;
	  
	  // 패들과 공의 거리 기반 기본 보상
	  reward = 1 - Math.min(1, Math.abs(simulatedPaddleY - simulatedBallY) / 10);
	  
	  // 패들에 맞으면 큰 보상
	  if (hitPaddle) {
		reward += 10;
		score++;
	  }
	  
	  // 공이 화면 바깥으로 나가면 종료
	  if (simulatedBallX > 20 || simulatedBallX < -20) {
		done = true;
		if (simulatedBallX > 20) {
		  reward -= 5; // 실점 패널티
		}
	  }
	  
	  return { reward, done };
	};
	
	// 학습 메인 루프
	let currentState = resetEnvironment();
	let totalReward = 0;
	
	for (let i = 0; i < episodes; i++) {
	  let done = false;
	  let stepCount = 0;
	  totalReward = 0;
	  
	  while (!done && stepCount < 1000) { // 최대 1000 스텝
		// 행동 선택
		const action = dqnAgent.chooseAction(currentState);
		
		// 행동 수행 및 결과 관측
		const { reward, done: episodeDone } = executeSimulatedAction(action);
		const nextState = getSimulatedState();
		
		// 경험 저장
		dqnAgent.remember(currentState, action, reward, nextState, episodeDone);
		
		// 학습
		if (stepCount % 4 === 0) { // 매 4스텝마다 학습
		  await dqnAgent.replay();
		}
		
		totalReward += reward;
		currentState.dispose(); // 이전 상태 메모리 해제
		currentState = nextState;
		
		done = episodeDone;
		stepCount++;
	  }
	  
	  if (i % 10 === 0) {
		console.log(`에피소드 ${i}/${episodes}, 보상: ${totalReward.toFixed(2)}, 입실론: ${dqnAgent.epsilon.toFixed(3)}`);
	  }
	  
	  if (done) {
		currentState.dispose();
		currentState = resetEnvironment();
	  }
	}
	
	console.log("자동 학습 완료");
	
	// 학습된 모델 저장
	try {
	  await dqnAgent.saveModel('indexeddb://pong-dqn-model');
	  console.log("자동 학습된 모델 저장 완료");
	} catch (e) {
	  console.error("모델 저장 실패:", e);
	}
  }