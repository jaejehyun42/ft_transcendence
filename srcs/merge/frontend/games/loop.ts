import * as GUI from "babylonjs-gui";
import { initializeDraw } from "./draw.js";
import { startGame, resetGame, update } from "./game.js";

let gameLoopRunning = false;
let animationFrameId: number | null = null;
export let startButton: GUI.Button;

export function startGameLoop(canvas: HTMLCanvasElement)
{
    if (gameLoopRunning)
        return ;
    gameLoopRunning = true;

    console.log("🔥 startGameLoop 실행됨!");
    
    initializeDraw(canvas);

    let guiTexture = GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");
    
    startButton = GUI.Button.CreateSimpleButton("startButton", "Start");
    startButton.width = "200px";
    startButton.height = "50px";
    startButton.color = "white";
    startButton.background = "green";
    startButton.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
    startButton.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_CENTER;
    startButton.onPointerClickObservable.add(() => {
        startButton.isVisible = false;
        startGame();
    });
    guiTexture.addControl(startButton);
    gameLoop();
}

export function stopGameLoop()
{
    resetGame();
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
    gameLoopRunning = false;
}

function gameLoop()
{
    update();
    animationFrameId = requestAnimationFrame(gameLoop);
}