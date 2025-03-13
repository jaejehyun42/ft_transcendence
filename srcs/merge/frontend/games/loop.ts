import { createStartButton } from "./ui.js";
import { initializeDraw, initializeGame, scene } from "./draw.js";
import { resetGame, startGame, update, winner } from "./game.js";

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
        console.log(`${name_1p}, ${name_2p}`);
        
        createStartButton((style) => {
            initializeDraw(style);
            startGame(mode);
            gameLoop(resolve);
        });
    });
}

export function stopGameLoop() 
{
    if (animationFrameId) 
    {
        resetGame();
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
    gameLoopRunning = false;
}

function gameLoop(resolve: (winner: string) => void) 
{
    // 승자가 정해지면 게임 루프 종료
    if (winner) 
    {
        gameLoopRunning = false;
        resolve(winner);
        return;
    }

    let deltaTime = scene.getEngine().getDeltaTime() / 1000;
    update(deltaTime);
    animationFrameId = requestAnimationFrame(() => gameLoop(resolve));
}
