import { createStartButton } from "./ui.js";
import { startGame, update, winner } from "./game.js";
import { moveAIPostion, startIntervalAI, clearIntervalAI } from "./AI.js";
import { initializeDraw, initializeGame, disposeEngine, scene } from "./draw.js";

let gamePaused = false;
let gameLoopRunning = false;
let animationFrameId: number | null = null;

export let name_1p = "";
export let name_2p = "";

export function startGameLoop(canvas: HTMLCanvasElement, player1: string, player2: string, mode: string): Promise<string>
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
    console.log("Game Stop")
    gameLoopRunning = false;
    if (animationFrameId) 
    {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
    disposeEngine();
    clearIntervalAI();
}

function gameLoop(resolve: (winner: string) => void) 
{
    if (gamePaused)
        return;

    if (winner)
    {
        stopGameLoop();
        resolve(winner);
        return;
    }
    if (!document.getElementById("gameCanvas"))
    {
        stopGameLoop();
        resolve("");
        return;
    }

    let deltaTime = scene.getEngine().getDeltaTime() / 1000;
    update(deltaTime);
    moveAIPostion();
    animationFrameId = requestAnimationFrame(() => gameLoop(resolve));
}

export function pauseGame()
{
    gamePaused = true;
}

export function resumeGame(resolve: (winner: string) => void)
{
    if (!gamePaused) return;
    gamePaused = false;
    gameLoop(resolve); // 다시 실행
}
