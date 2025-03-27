import { createScoreboard } from "./ui.js";
import { applyPixelEffect, applyPixelPostProcessing, applyCRTFilter } from "./pixel.js";
import { Engine, Scene, Color3, Color4, FreeCamera, HemisphericLight, Vector3, Mesh, MeshBuilder, StandardMaterial, GlowLayer, Texture } from "@babylonjs/core";

let engine: Engine;
let camera: FreeCamera;
export let scene: Scene;

let ground: Mesh;
let centerLine: Mesh;
let light: HemisphericLight;

export let ball: Mesh;
export let paddleLeft: Mesh;
export let paddleRight: Mesh;

export let topWall: Mesh;
export let bottomWall: Mesh;
export let leftWall: Mesh;
export let rightWall: Mesh;

export const ballSize = 0.8, paddleHeight = 4, paddleWidth = 1, paddleDepth = 1;

// 게임 엔진 및 화면 시작
export function initializeGame(canvas: HTMLCanvasElement)
{
    engine = new Engine(canvas, true);
    scene = new Scene(engine);
    scene.clearColor = new Color4(0.3, 0.3, 0.3, 1);
    setupLightingAndCamera();

    engine.runRenderLoop(() => scene.render());
    window.addEventListener("resize", () => engine.resize());
}

export function disposeEngine()
{
    if (engine)
        engine.dispose();
}

// 오브젝트 및 효과 시작
export function initializeDraw(style: string)
{
    setupScene();
    if (style === "Pixel")
    {
        applyPixelEffect(scene, 2);
        applyPixelPostProcessing(scene, 2);
        applyCRTFilter(scene);
    }

    engine.runRenderLoop(() => scene.render());
    window.addEventListener("resize", () => engine.resize());
}

function setupScene()
{
    scene.clearColor = new Color4(0, 0, 0, 0);
    createGameObjects();
    createWalls();
    createScoreboard();

    applyOutlines(ball);
    applyOutlines(paddleLeft);
    applyOutlines(paddleRight);
    applyOutlines(topWall);
    applyOutlines(bottomWall);
    applyOutlines(leftWall);
    applyOutlines(rightWall);
    applyOutlines(ground);
    applyOutlines(centerLine);

    createShadow(ball);
    createShadow(paddleLeft);
    createShadow(paddleRight);
}

function setupLightingAndCamera()
{
    camera = new FreeCamera("camera", new Vector3(0, -21, -17), scene);
    camera.setTarget(new Vector3(0, -2, 0));

    light = new HemisphericLight("light", new Vector3(0, 0, -10), scene);
    light.intensity = 0.8;
}

function createGameObjects()
{
    setBackgroundImage();
    createGround();
    createBall();
    createPaddles();
}

// 배경 생성
function setBackgroundImage()
{
    // 배경 추가
    const backgroundPlane = MeshBuilder.CreatePlane("background", { size: 350 }, scene);
    backgroundPlane.position.set(0, 200, 195);  // 카메라 뒤쪽에 배경을 배치
    backgroundPlane.billboardMode = Mesh.BILLBOARDMODE_ALL; // 항상 카메라를 향하도록 설정

    const backgroundMaterial = new StandardMaterial("backgroundMaterial", scene);
    backgroundMaterial.diffuseTexture = new Texture("/bleachers.png", scene);
    backgroundPlane.material = backgroundMaterial;

    backgroundPlane.scaling.set(1.6, 0.8, 1);
}

// 바닥 생성
function createGround()
{
    // 바닥 생성
    ground = MeshBuilder.CreateGround("ground", { width: 34, height: 18 }, scene);
    ground.rotation.x = -Math.PI / 2;
    ground.position.z = 0.5;

    // 바닥 재질
    let groundMaterial = new StandardMaterial("groundMat", scene);
    groundMaterial.diffuseColor = new Color3(0.2, 0.6, 0.2);
    groundMaterial.specularColor = new Color3(0, 0, 0);
    ground.material = groundMaterial;

    // 중앙선 생성
    centerLine = MeshBuilder.CreateBox("centerLine", { width: 0.3, height: 18, depth: 0.1 }, scene);
    centerLine.position.set(0, 0, 0.5);

    // 중앙선 재질
    let lineMaterial = new StandardMaterial("lineMat", scene);
    lineMaterial.diffuseColor = new Color3(1, 1, 1);
    centerLine.material = lineMaterial;
}

// 공 생성
function createBall()
{
    ball = MeshBuilder.CreateSphere("ball", { diameter: ballSize }, scene);
    ball.position.set(0, 0, 0);
    
    let ballMaterial = new StandardMaterial("ballMat", scene);
    ballMaterial.diffuseColor = new Color3(1, 0.5, 0.0);
    ball.material = ballMaterial;

    let glowLayer = new GlowLayer("glow", scene);
    glowLayer.intensity = 0.3;
    glowLayer.addIncludedOnlyMesh(ball);
}

// 패들 생성
function createPaddles()
{
    paddleLeft = createPaddle("paddleLeft", new Vector3(-15, 0, 0), new Color3(1, 0.3, 0.3));
    paddleRight = createPaddle("paddleRight", new Vector3(15, 0, 0), new Color3(0.3, 0.3, 1));
}

// 패들 생성 함수
function createPaddle(name: string, position: Vector3, color: Color3): Mesh {
    let paddle = MeshBuilder.CreateBox(name, { width: paddleWidth, height: paddleHeight, depth: paddleWidth }, scene);
    paddle.position = position;

    let material = new StandardMaterial(name + "Mat", scene);
    material.diffuseColor = color;
    paddle.material = material;

    let glowLayer = new GlowLayer("glow", scene);
    glowLayer.intensity = 0.2;
    glowLayer.addIncludedOnlyMesh(paddle);

    return paddle;
}

// 벽 생성
function createWalls()
{
    const wallMaterial = new StandardMaterial("wallMat", scene);
    wallMaterial.diffuseColor = new Color3(0.8, 0.8, 0.8);
    wallMaterial.specularColor = new Color3(0.2, 0.2, 0.2);

    topWall = createWall("topWall", 32, 0.5, 1, new Vector3(0, 9.5, 0.2), wallMaterial);
    bottomWall = createWall("bottomWall", 32, 0.5, 1, new Vector3(0, -9.5, 0.2), wallMaterial);
    leftWall = createWall("leftWall", 0.2, 18, 0.2, new Vector3(-17, 0, 0.4), wallMaterial);
    rightWall = createWall("rightWall", 0.2, 18, 0.2, new Vector3(17, 0, 0.4), wallMaterial);
}

// 벽 생성 함수
function createWall(name: string, width: number, height: number, depth: number, position: Vector3, material: StandardMaterial): Mesh {
    let wall = MeshBuilder.CreateBox(name, { width, height, depth }, scene);
    wall.position = position;
    wall.material = material;
    return wall;
}

// 외각선 생성
function applyOutlines(mesh: Mesh, color: Color3 = new Color3(0, 0, 0))
{
    mesh.enableEdgesRendering();
    mesh.edgesWidth = 5.0;
    mesh.edgesColor = new Color4(color.r, color.g, color.b, 1);
}

// 그림자 생성
function createShadow(mesh: Mesh)
{
    let shadow = mesh.clone(mesh.name + "Shadow");

    // 그림자 재질 적용
    let shadowMaterial = new StandardMaterial("shadowMat", scene);
    shadowMaterial.diffuseColor = new Color3(0, 0, 0);
    shadowMaterial.alpha = 0.4;
    shadow.material = shadowMaterial;

    // 그림자 크기 조정
    if (mesh.name.includes("ball"))
        shadow.scaling.set(1.2, 1.2, 0.05);
    else if (mesh.name.includes("paddle"))
        shadow.scaling.set(1.3, 1.1, 0.05);
    else
        shadow.scaling.set(1.1, 1.1, 0.05);
    shadow.renderingGroupId = mesh.renderingGroupId ? mesh.renderingGroupId - 1 : 0;

    // 그림자의 위치 설정
    shadow.position.x = mesh.position.x;
    shadow.position.y = mesh.position.y - 0.1;
    shadow.position.z = 0.48;

    // 그림자가 업데이트
    scene.registerBeforeRender(() => {
        shadow.position.x = mesh.position.x;
        shadow.position.y = mesh.position.y - 0.1;
        shadow.position.z = 0.48;
    });
}
