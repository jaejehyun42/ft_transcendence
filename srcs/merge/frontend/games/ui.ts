import { AdvancedDynamicTexture, Button, Control, Grid, Rectangle, TextBlock } from "@babylonjs/gui";

export let scoreText: TextBlock;
export let startButton: Button;
export let winnerButton: Button;


// 게임 시작 UI 생성 (옵션 선택 포함)
export function createStartButton(startCallback: (mode: string) => void)
{
    let guiTexture = AdvancedDynamicTexture.CreateFullscreenUI("StartButtonUI");

    let buttonGrid = new Grid();
    buttonGrid.addColumnDefinition(0.5);
    buttonGrid.addColumnDefinition(0.1);
    buttonGrid.addColumnDefinition(0.5);

    buttonGrid.width = "600px";
    buttonGrid.height = "100px";
    buttonGrid.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
    buttonGrid.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
    guiTexture.addControl(buttonGrid);

    let noramlButton = createPixelButton("Normal", "Normal", "white", "rgba(27, 98, 232, 0.74)");
    let pixelButton = createPixelButton("Pixel", "Pixel", "white", "rgba(27, 98, 232, 0.74)");

    noramlButton.onPointerClickObservable.add(() => {
        guiTexture.removeControl(buttonGrid);
        startCallback("Normal");
    });

    pixelButton.onPointerClickObservable.add(() => {
        guiTexture.removeControl(buttonGrid);
        startCallback("Pixel");
    });

    // 버튼 위치 조정
    buttonGrid.addControl(noramlButton, 0, 0);
    buttonGrid.addControl(pixelButton, 0, 2);
}

// 픽셀 스타일 버튼 생성 함수
function createPixelButton(name: string, text: string, textColor: string, bgColor: string): Button {
    let button = Button.CreateSimpleButton(name, text);
    button.width = "200px";
    button.height = "80px";
    button.color = textColor;
    button.background = bgColor;
    button.thickness = 4;
    button.cornerRadius = 5;
    button.fontSize = 30;
    button.fontFamily = "CookieRun-Regular";

    button.shadowBlur = 10;
    button.shadowColor = "rgba(0, 166, 255, 0.6)";

    button.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
    button.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;

    // 마우스 올릴 때 색상 변경
    button.onPointerEnterObservable.add(() => {
        button.color = "white";
        button.background = "rgba(6, 30, 138, 0.74)";
        button.shadowColor = "rgba(255, 255, 255, 0.8)";
    });

    // 마우스 벗어나면 원래 색으로 복구
    button.onPointerOutObservable.add(() => {
        button.color = textColor;
        button.background = bgColor;
        button.shadowColor = "rgba(0, 166, 255, 0.6)";
    });

    return button;
}

// 카운트다운 및 스코어 보드 생성
export function createScoreboard() {
    let guiTexture = AdvancedDynamicTexture.CreateFullscreenUI("ScoreBoardUI");

    // 픽셀 스타일 UI 박스 생성
    let uiBox = new Rectangle();
    uiBox.width = "200px";
    uiBox.height = "50px";
    uiBox.top = "40px";
    uiBox.cornerRadius = 8;
    uiBox.color = "rgba(27, 98, 232, 0.74)";
    uiBox.thickness = 4;
    uiBox.background = "rgba(0, 0, 0, 0.7)";
    uiBox.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
    uiBox.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    guiTexture.addControl(uiBox);
    
    // UI 박스 안에 텍스트 추가
    scoreText = new TextBlock();
    scoreText.text = "READY";
    scoreText.color = "white";
    scoreText.fontSize = 30;
    scoreText.fontFamily = "CookieRun-Regular";
    scoreText.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
    scoreText.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
    uiBox.addControl(scoreText);

    return scoreText
}

export function createWinner(winner: string)
{
    let guiTexture = AdvancedDynamicTexture.CreateFullscreenUI("WinnerUI");

    winnerButton = Button.CreateSimpleButton("WinnerButton", `${winner} Wins!!`);
    winnerButton.width = "90%";
    winnerButton.height = "90%";
    winnerButton.adaptWidthToChildren = true;
    winnerButton.color = "rgb(255, 205, 97)";
    winnerButton.background = "rgba(0, 0, 0, 0)";
    winnerButton.thickness = 0;
    winnerButton.cornerRadius = 0;
    winnerButton.fontSize = 130;
    winnerButton.fontFamily = "CookieRun-Regular";
    winnerButton.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
    winnerButton.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;

    // 마우스 올릴 때 색상 변경
    winnerButton.onPointerEnterObservable.add(() => {
        winnerButton.color = "rgb(186, 139, 38)";
        winnerButton.background = "rgba(39, 38, 38, 0.2)";
    });

    // 마우스 벗어나면 원래 색으로 복구
    winnerButton.onPointerOutObservable.add(() => {
        winnerButton.color = "rgb(255, 205, 97)";
        winnerButton.background = "rgba(0, 0, 0, 0)";
    });

    guiTexture.addControl(winnerButton);
}

export function showWinner(winner: string): Promise<void> {
    return new Promise((resolve) => {
        createWinner(winner);
        winnerButton.onPointerClickObservable.add(() => {
            winnerButton.isVisible = false;
            resolve();
        });
    });
}

