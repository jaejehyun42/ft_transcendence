import { ball, paddleRight } from "./draw.js";
import { gameMode, gameRunning, aiKeys, ballSpeedX, ballSpeedY } from "./game.js";
import * as tf from '@tensorflow/tfjs';

let lastBallDirectionX = 0;
let updateID: ReturnType<typeof setInterval> | null = null;

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
	private targetUpdateFreq: number = 100; // 100회마다 업데이트
	private trainStep: number = 0; // 학습 스텝 카운터 추가
	private epsilonMin: number = 0.05;
	private epsilonDecay: number = 0.998;  // 더 느린 감소
	private gamma: number = 0.95;         // 단기 보상 강조	
	private batchSize: number = 64;       // 더 큰 배치 크기
	private replayBufferSize: number = 10000; // 버퍼 크기 확장

	constructor() {
		this.model = this.createModel();
		this.targetModel = this.createModel();
		this.updateTargetModel();
		this.trainStep = 0; // 생성자에서 초기화

	}
  
	private createModel(): tf.LayersModel {
		const model = tf.sequential({
		  layers: [
			tf.layers.dense({ inputShape: [6], units: 128, activation: 'relu' }),
			tf.layers.dropout({ rate: 0.3 }), // 과적합 방지
			tf.layers.dense({ units: 64, activation: 'relu' }),
			tf.layers.dense({ units: 3, activation: 'linear' })
		  ]
		});
	  
		model.compile({
		  optimizer: tf.train.adam(0.0005), // 학습률 조정
		  loss: tf.losses.huberLoss // MSE보다 안정적인 Huber Loss
		});
		
		return model;
	  }

	// 상태 관측 (입력 특성 구성)
	public getState(): tf.Tensor {
		const predictedY = predictBallPosition();
		return tf.tensor2d([[
		  ball.position.x / 20,
		  ball.position.y / 10,
		  ballSpeedX / 20,       // 속도 범위 확장
		  ballSpeedY / 20,
		  paddleRight.position.y / 10,
		  Math.atan2(ballSpeedY, ballSpeedX) / Math.PI,  // 공의 이동 각도
		  predictedY / 10 // 추가 상태 정보
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
	public executeAction(action: number) {
		const duration = 200; // 지속 시간 설정
		if (action === 0) {
		  simulateKeyPress("ArrowUp", duration); // 실제 키 시뮬레이션 사용
		} else if (action === 1) {
		  simulateKeyPress("ArrowDown", duration);
		}
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
		if (this.replayBuffer.length > this.replayBufferSize) {
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
	async replay() {
		if (this.replayBuffer.length < this.batchSize) return;
	  
		// 1. 무작위 인덱스 생성 (타입 명시)
		const indices: number[] = Array.from(
		  tf.util.createShuffledIndices(this.replayBuffer.length)
		);
	  
		// 2. 미니배치 추출 (i 타입 명시)
		const miniBatch = indices
		  .slice(0, this.batchSize)
		  .map((i: number) => this.replayBuffer[i]);
	  
		const stateBatch = tf.tensor2d(
		  miniBatch.map((exp) => exp.state[0])
		);
		const actionBatch = tf.tensor1d(
		  miniBatch.map((exp) => exp.action), 'int32'
		);
		// 배치 텐서 준비
		const rewardBatch = tf.tensor1d(miniBatch.map(exp => exp.reward));
		const nextStateBatch = tf.tensor2d(miniBatch.map(exp => exp.nextState[0]));
		const doneBatch = tf.tensor1d(miniBatch.map(exp => exp.done ? 1 : 0));
		
		const [currentQValues, nextQValues] = tf.tidy(() => {
			return [
			  this.model.predict(stateBatch) as tf.Tensor,
			  this.targetModel.predict(nextStateBatch) as tf.Tensor
			];
		  });
		
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
		if (this.trainStep % this.targetUpdateFreq === 0) {
			this.updateTargetModel();
		  }
		  this.trainStep++;
	}
}

// 개선된 보상 계산 함수
function calculateReward(): number {
	// 공과 패들 중심까지의 정규화 거리 (0~1)
	const distance = Math.abs(paddleRight.position.y - ball.position.y) / 10;
	
	// 방향 가중치 (공이 오는 방향일 때 더 높은 보상)
	const directionWeight = ballSpeedX > 0 ? 1.5 : 0.7;
  
	// 속도 가중치 (빠른 공일 때 더 높은 보상)
	const speedWeight = Math.min(1, Math.sqrt(ballSpeedX**2 + ballSpeedY**2)/15);
  
	// 기본 위치 보상 (거리에 반비례)
	let reward = (1 - distance) * directionWeight * speedWeight;
  
	// 성공적 타격 보상
	if (lastBallDirectionX > 0 && ballSpeedX < 0) {
	  reward += 10;
	  console.log("Successful hit!");
	}
  
	// 실패 패널티 (공이 화면 밖으로 나갈 때)
	if (ball.position.x > 20) {
	  reward -= 15;
	}
  
	return Math.min(Math.max(reward, -5), 10); // 보상 범위 제한
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
  }, 1000); 
}

// 키 입력을 일정 시간 동안 유지하는 함수
function simulateKeyPress(key: string, duration: number)
{
	aiKeys[key] = true;

	setTimeout(() => {
		aiKeys[key] = false;
	}, duration);
}

export function clearIntervalAI()
{
	if (updateID)
	{
		clearInterval(updateID);
		updateID = null;
	}
}

export async function saveModel() {
	if (!dqnAgent) return;
	
	try {
	  await dqnAgent.saveModel('indexeddb://pong-dqn-model');
	  console.log("모델 저장 완료");
	} catch (e) {
	  console.error("모델 저장 실패:", e);
	}
}

export async function runAutoTraining(episodes: number = 1000, progressCallback: (progress: number) => void) {
	if (!dqnAgent) {
		dqnAgent = new DQNAgent();
	}
	
	console.log("자동 학습 시작: " + episodes + "회");
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
	
	// 환경 시뮬레이션 변수
	let simulatedBallX = 0;
	let simulatedBallY = 0;
	let simulatedBallSpeedX = 10;
	let simulatedBallSpeedY = Math.random() * 10 - 5;
	let simulatedRightPaddleY = 0;  // 오른쪽 패들 (플레이어)
	let simulatedLeftPaddleY = 0;   // 왼쪽 패들 (상대방)
	let score = 0;
	let episode = 0;
	
	// 환경 초기화 함수
	const resetEnvironment = () => {
		simulatedBallX = 0;
		simulatedBallY = 0;
		simulatedBallSpeedX = 10;
		simulatedBallSpeedY = Math.random() * 10 - 5;
		simulatedRightPaddleY = 0;
		simulatedLeftPaddleY = 0;
		episode++;
		return getSimulatedState();
	};

	// 상태 관측 함수에 왼쪽 패들 정보 추가
	const getSimulatedState = () => {
		return tf.tensor2d([[
			simulatedBallX / 20,
			simulatedBallY / 10,
			simulatedBallSpeedX / 15,
			simulatedBallSpeedY / 15,
			simulatedRightPaddleY / 10,
			Math.abs(simulatedRightPaddleY - simulatedBallY) / 10
		]]);
	};

	// 행동 수행 함수 수정 - 왼쪽 패들 AI 추가
	const executeSimulatedAction = (action: number) => {
		// 오른쪽 패들 이동 (학습 에이전트)
		if (action === 0) { // 위로
			simulatedRightPaddleY = Math.min(9, simulatedRightPaddleY + 1);
		} else if (action === 1) { // 아래로
			simulatedRightPaddleY = Math.max(-9, simulatedRightPaddleY - 1);
		}
		
		// 왼쪽 패들 이동 (간단한 규칙 기반 AI)
		// 공이 왼쪽으로 이동할 때만 움직임
		if (simulatedBallSpeedX < 0) {
			// 75% 확률로 공을 따라감 (오류 확률 25%)
			if (Math.random() < 0.75) {
				// 공을 향해 이동
				if (simulatedLeftPaddleY < simulatedBallY - 0.5) {
					simulatedLeftPaddleY = Math.min(9, simulatedLeftPaddleY + 0.8);
				} else if (simulatedLeftPaddleY > simulatedBallY + 0.5) {
					simulatedLeftPaddleY = Math.max(-9, simulatedLeftPaddleY - 0.8);
				}
			}
		}
		
		// 공 이동
		simulatedBallX += simulatedBallSpeedX * 0.1;
		simulatedBallY += simulatedBallSpeedY * 0.1;
		
		// 벽 충돌
		if (simulatedBallY >= 9 || simulatedBallY <= -9) {
			simulatedBallSpeedY *= -1;
		}
		
		// 오른쪽 패들 충돌 (x=15에서)
		let hitRightPaddle = false;
		if (simulatedBallX >= 14 && simulatedBallX <= 16 && 
			Math.abs(simulatedBallY - simulatedRightPaddleY) <= 2) {
			simulatedBallSpeedX *= -1;
			hitRightPaddle = true;
		}

		// 왼쪽 패들 충돌 (x=-15에서)
		if (simulatedBallX <= -14 && simulatedBallX >= -16 && 
			Math.abs(simulatedBallY - simulatedLeftPaddleY) <= 2) {
			simulatedBallSpeedX *= -1;
		}
		
		// 득점/실점 확인
		let done = false;
		let reward = 0;
		
		// 패들과 공의 거리 기반 기본 보상
		reward = 1 - Math.min(1, Math.abs(simulatedRightPaddleY - simulatedBallY) / 10);
		
		// 오른쪽 패들에 맞으면 큰 보상 (우리 패들)
		if (hitRightPaddle) {
			reward += 8;
			score++;
		}
		
		// 공이 화면 바깥으로 나가면 종료
		if (simulatedBallX > 20) {
			done = true;
			reward -= 5; // 실점 패널티
		} else if (simulatedBallX < -20) {
			done = true;
			reward += 5; // 득점 보상
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

		// 진행률 업데이트
		const progress = (i / episodes) * 100;
		progressCallback(progress);

		if (i % 10 === 0) {
			console.log(`에피소드 ${i}/${episodes}, 보상: ${totalReward.toFixed(2)}, 입실론: ${dqnAgent.epsilon.toFixed(3)}`);
		}

		if (done) {
			if (currentState) {
				currentState.dispose();
			}
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

const predictBallPosition = () => {
	let predictedX = ball.position.x;
	let predictedY = ball.position.y;
	let currentSpeedX = ballSpeedX;
	let currentSpeedY = ballSpeedY;
	let steps = 0; // 안전 장치 추가
  
	// 최대 1000스텝으로 제한 (실제 환경에 맞게 조정)
	while (steps < 1000) {
	  predictedX += currentSpeedX * 0.1;
	  predictedY += currentSpeedY * 0.1;
	  steps++;
  
	  // 벽 충돌 검사 (상하)
	  if (predictedY >= 9 || predictedY <= -9) {
		currentSpeedY *= -1;
	  }
  
	  // 패들 충돌 또는 경기장 이탈 검사
	  if (
		predictedX >= 15 ||  // 오른쪽 패들 근접
		predictedX <= -20 || // 왼쪽 벽
		Math.abs(predictedX - ball.position.x) > 50 // 갑작스러운 이동 방지
	  ) {
		break;
	  }
	}
  
	return predictedY;
  };