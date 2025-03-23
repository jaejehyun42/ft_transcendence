import { createStartButton } from "./ui.js";
import { startGame, update, result } from "./game.js";
import { moveAIPostion, startIntervalAI, clearIntervalAI } from "./AI.js";
import { initializeDraw, initializeGame, disposeEngine, scene } from "./draw.js";

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
            startIntervalAI();
            gameLoop(resolve);
        });
    });
}

export function stopGameLoop() 
{
    gameLoopRunning = false;
    if (animationFrameId) 
    {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
    disposeEngine();
    clearIntervalAI();
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
        moveAIPostion();
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
