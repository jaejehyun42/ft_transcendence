import { ParticleSystem, Texture, Color4, Vector3 } from "@babylonjs/core";
import { scene } from './draw.js';

// 충돌 이펙트
export function createImpactEffect(position: Vector3)
{
    let particleSystem = new ParticleSystem("particles", 50, scene);
    particleSystem.particleTexture = new Texture("https://www.babylonjs-playground.com/textures/flare.png", scene);
    particleSystem.emitter = position.clone();
    particleSystem.minSize = 0.1;
    particleSystem.maxSize = 0.3;
    particleSystem.minLifeTime = 0.2;
    particleSystem.maxLifeTime = 0.5;
    particleSystem.color1 = new Color4(1, 1, 0, 1);
    particleSystem.color2 = new Color4(1, 0.5, 0, 1);
    particleSystem.emitRate = 50;
    particleSystem.gravity = new Vector3(0, 0, -1);
    particleSystem.direction1 = new Vector3(-1, 1, 0);
    particleSystem.direction2 = new Vector3(1, -1, 0);
    particleSystem.start();

    setTimeout(() => {
        particleSystem.stop();
        particleSystem.dispose();
    }, 500);
}
