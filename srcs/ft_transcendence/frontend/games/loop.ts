import { createStartButton } from "./ui.js";
import { startGame, update, result } from "./game.js";
import { initializeDraw, initializeGame, disposeEngine, scene } from "./draw.js";
import { startDQNSystem, saveModel } from "./AI.js";

let gamePaused = false;
let gameLoopRunning = false;
let animationFrameId: number | null = null;

export let name_1p = "";
export let name_2p = "";

export function startGameLoop(canvas: HTMLCanvasElement, player1: string, player2: string, mode: string): Promise<{ [key: string]: string | null }>
{
    return new Promise((resolve) => {
        if (gameLoopRunning)
            throw new Error("Error: Game loop is already running");
        if (mode !== "PvP" && mode !== "PvE")
            throw new Error("Error: Only local mode is supported");

        name_1p = player1;
        name_2p = player2;
        initializeGame(canvas);

        createStartButton((style) => {
            initializeDraw(style);
            startGame(mode);
            // startIntervalAI();
            startDQNSystem();
            gameLoop(resolve);
        });
    });
}

export function stopGameLoop() 
{
    gameLoopRunning = false;
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
    
    // 게임 종료 시 모델 저장
    saveModel(); // 비동기지만 간단히 하기 위해 await 생략
    
    disposeEngine();
    console.log("Game Stop");
}

function gameLoop(resolve: (result: { [key: string]: string | null }) => void) 
{
    if (!gamePaused)
    {
        if (result["winner"])
        {
            stopGameLoop();
            resolve(result);
            return;
        }
        if (!document.getElementById("gameCanvas"))
        {
            stopGameLoop();
            resolve({});
            console.log("Canvas not found, stopping game."); // 디버깅용 로그
            return;
        }

        let deltaTime = scene.getEngine().getDeltaTime() / 1000;
        update(deltaTime);
    }
    
    animationFrameId = requestAnimationFrame(() => gameLoop(resolve));
}

export function pauseGame()
{
    gamePaused = true;
}

export function resumeGame()
{
    gamePaused = false;
}
