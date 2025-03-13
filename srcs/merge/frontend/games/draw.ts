import * as BABYLON from "babylonjs";
import * as GUI from "babylonjs-gui";

let engine: BABYLON.Engine;
let scene: BABYLON.Scene;
let camera: BABYLON.FreeCamera;

let ground: BABYLON.Mesh;
let light: BABYLON.HemisphericLight;

let topWall: BABYLON.Mesh;
let bottomWall: BABYLON.Mesh;
let leftWall: BABYLON.Mesh;
let rightWall: BABYLON.Mesh;

export let ball: BABYLON.Mesh;
export let paddleLeft: BABYLON.Mesh;
export let paddleRight: BABYLON.Mesh;
export let countdownText: GUI.TextBlock;

export const ballSize = 1;
export const paddleHeight = 4;
export const paddleWidth = 1;

export const wallWidth = 30;
export const wallHeight = 1;
export const wallDepth = 1;

export function initializeDraw(canvas: HTMLCanvasElement)
{
    engine = new BABYLON.Engine(canvas, true);
    scene = new BABYLON.Scene(engine);
    scene.clearColor = new BABYLON.Color4(0.3, 0.3, 0.3, 1);

    setCamera(scene);
    createObjects(scene);
    createGround(scene);
    createWall(scene);

    // 카운트다운 텍스트
    let guiTexture = GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");
    countdownText = new GUI.TextBlock();
    countdownText.text = "";
    countdownText.color = "black";
    countdownText.fontSize = 75;
    countdownText.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
    countdownText.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_CENTER;
    guiTexture.addControl(countdownText);

    // 렌더링 루프
    engine.runRenderLoop(() => {
        scene.render();
    });

    // 창 크기 조정
    window.addEventListener("resize", () => {
        engine.resize();
    });
}

function setCamera(scene: BABYLON.Scene)
{
    // 카메라 설정
    camera = new BABYLON.FreeCamera("camera", new BABYLON.Vector3(0, -20, -17), scene);
    camera.setTarget(BABYLON.Vector3.Zero());

    // 조명 추가
    light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 0, -10), scene);
    light.intensity = 1.5
}

function createObjects(scene: BABYLON.Scene)
{
    // 공 생성
    ball = BABYLON.MeshBuilder.CreateSphere("ball", { diameter: ballSize }, scene);
    ball.position.set(0, 0, 0);

    // 패들 생성
    paddleLeft = BABYLON.MeshBuilder.CreateBox("paddleLeft", { width: paddleWidth, height: paddleHeight, depth: 0.5 }, scene);
    paddleLeft.position.set(-15, 0, 0);
    
    paddleRight = BABYLON.MeshBuilder.CreateBox("paddleRight", { width: paddleWidth, height: paddleHeight, depth: 0.5 }, scene);
    paddleRight.position.set(15, 0, 0);

    // 패들 색상 설정
    const paddleLeftMaterial = new BABYLON.StandardMaterial("paddleLeftMaterial", scene);
    paddleLeftMaterial.diffuseColor = new BABYLON.Color3(0, 0, 1);
    paddleLeft.material = paddleLeftMaterial;

    const paddleRightMaterial = new BABYLON.StandardMaterial("paddleRightMaterial", scene);
    paddleRightMaterial.diffuseColor = new BABYLON.Color3(1, 0, 0);
    paddleRight.material = paddleRightMaterial;
}

function createGround(scene: BABYLON.Scene)
{
    // **바닥 추가**
    ground = BABYLON.MeshBuilder.CreateGround("ground", { width: 34, height: 18 }, scene);
    ground.rotation.x = - Math.PI / 2;
    ground.position.z = 0.5;

    // **바닥 색상 설정**
    const groundMaterial = new BABYLON.StandardMaterial("groundMaterial", scene);
    groundMaterial.diffuseColor = new BABYLON.Color3(0.3, 0.3, 0.3);
    ground.material = groundMaterial;
}

function createWall(scene: BABYLON.Scene)
{
    // 벽 생성
    topWall = BABYLON.MeshBuilder.CreateBox("topWall", { width: wallWidth, height: wallHeight, depth: wallDepth }, scene);
    topWall.position.set(0, 9, 0);

    bottomWall = BABYLON.MeshBuilder.CreateBox("bottomWall", { width: wallWidth, height: wallHeight, depth: wallDepth }, scene);
    bottomWall.position.set(0, -9, 0);

    leftWall = BABYLON.MeshBuilder.CreateBox("leftWall", { width: 0.5, height: 16, depth: wallDepth }, scene);
    leftWall.position.set(-17, 0, 0);

    rightWall = BABYLON.MeshBuilder.CreateBox("rightWall", { width: 0.5, height: 16, depth: wallDepth }, scene);
    rightWall.position.set(17, 0, 0);

    // 상하단 벽
    const wallMaterialTopBottom = new BABYLON.StandardMaterial("wallMaterialTopBottom", scene);
    wallMaterialTopBottom.diffuseColor = new BABYLON.Color3(0, 1, 0); // 초록색
    topWall.material = wallMaterialTopBottom;
    bottomWall.material = wallMaterialTopBottom;

    // 좌우 벽
    const wallMaterialLeftRight = new BABYLON.StandardMaterial("wallMaterialLeftRight", scene);
    wallMaterialLeftRight.diffuseColor = new BABYLON.Color3(0.7, 0.7, 0.7); // 검은색
    leftWall.material = wallMaterialLeftRight;
    rightWall.material = wallMaterialLeftRight;
}// draw.ts