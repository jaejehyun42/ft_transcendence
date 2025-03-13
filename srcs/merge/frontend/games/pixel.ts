import { Scene, ShaderMaterial, Vector2, Mesh, StandardMaterial, Color3, Effect, PostProcess } from "@babylonjs/core";

// 기본 색상 픽셀화 쉐이더 머티리얼 생성
function createPixelShader(scene: Scene, pixelDensity: number, targetMesh: Mesh): ShaderMaterial
{
    const pixelShader = new ShaderMaterial("pixelShader", scene, {
        vertexSource: `
            precision highp float;
            attribute vec3 position;
            attribute vec2 uv;
            varying vec2 vUV;
            uniform mat4 worldViewProjection;
            void main() {
                vUV = uv;
                gl_Position = worldViewProjection * vec4(position, 1.0);
            }
        `,
        fragmentSource: `
            precision highp float;
            varying vec2 vUV;
            uniform vec3 baseColor;
            uniform vec2 resolution;

            void main() {
                vec2 uv = vUV;
                
                // 픽셀화 처리
                vec2 pixelSize = 1.0 / resolution;
                uv = floor(uv / pixelSize) * pixelSize;

                // 기본 색상 적용
                gl_FragColor = vec4(baseColor, 1.0);
            }
        `
    }, {
        attributes: ["position", "uv"],
        uniforms: ["worldViewProjection", "resolution", "baseColor"]
    });

    // 화면 크기에 따른 픽셀화 적용
    const screenWidth = scene.getEngine().getRenderWidth();
    const screenHeight = scene.getEngine().getRenderHeight();
    pixelShader.setVector2("resolution", new Vector2(screenWidth / pixelDensity, screenHeight / pixelDensity));

    // 🌟 Babylon.js의 `diffuseColor` 가져와서 쉐이더에 적용
    const material = targetMesh.material as StandardMaterial;
    const baseColor = material && material.diffuseColor ? material.diffuseColor : new Color3(1, 1, 1); // 기본값: 흰색
    pixelShader.setColor3("baseColor", baseColor);

    return pixelShader;
}

// 게임 오브젝트(공, 패들, 벽)에 기본 색상 픽셀 쉐이더 적용 (Babylon 머티리얼 색상 유지)
export function applyPixelEffect(scene: Scene, pixelDensity: number = 2) {
    // 적용할 오브젝트 리스트
    const objects: string[] = [
        "ball",
        "paddleLeft",
        "paddleRight",
        "topWall",
        "bottomWall",
        "leftWall",
        "rightWall"
    ];

    objects.forEach((objName) => {
        const obj = scene.getMeshByName(objName) as Mesh;
        if (obj) {
            const pixelShader = createPixelShader(scene, pixelDensity, obj);
            obj.material = pixelShader;
        }
    });
}

// CRT 필터 (고전 모니터 효과)
export function applyCRTFilter(scene: Scene) {
    Effect.ShadersStore["CRTFragmentShader"] = `
        precision highp float;
        varying vec2 vUV;
        uniform sampler2D textureSampler;

        void main() {
            vec3 color = texture2D(textureSampler, vUV).rgb;
            
            // CRT 그리드 효과
            float scanline = sin(vUV.y * 800.0) * 0.1;
            color -= scanline;

            // 색상 왜곡 효과
            color.r *= 1.1;
            color.b *= 0.9;

            gl_FragColor = vec4(color, 1.0);
        }
    `;

    new PostProcess("CRTPostProcess", "CRT", [], null, 1.0, scene.activeCamera);
}

// 전체 화면 픽셀화 포스트 프로세싱
export function applyPixelPostProcessing(scene: Scene, pixelDensity: number = 4) {
    Effect.ShadersStore["pixelFragmentShader"] = `
        precision highp float;
        varying vec2 vUV;
        uniform sampler2D textureSampler;
        uniform vec2 resolution;

        void main() {
            vec2 uv = vUV;
            vec2 pixelSize = 1.0 / resolution;
            uv = floor(uv / pixelSize) * pixelSize;

            vec4 color = texture2D(textureSampler, uv);
            gl_FragColor = color;
        }
    `;

    const pixelPostProcess = new PostProcess(
        "PixelPostProcess",
        "pixel",
        ["resolution"],
        null,
        1.0,
        scene.activeCamera
    );

    pixelPostProcess.onApply = (effect) => {
        const screenWidth = scene.getEngine().getRenderWidth();
        const screenHeight = scene.getEngine().getRenderHeight();
        effect.setVector2("resolution", new Vector2(screenWidth / pixelDensity, screenHeight / pixelDensity));
    };
}
