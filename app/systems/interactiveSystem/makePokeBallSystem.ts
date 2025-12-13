import { ControlSystem, SceneContext, System, TEXTURE_NAME } from "../../core/types";
import * as THREE from "three";
import vertexShader from '../../shaders/houseShaders/vertex.vert';
import fragmentShader from '../../shaders/houseShaders/fragment.frag';
import vertexDepth from '../../shaders/houseShaders/vertexDepth.vert';
import { GLTF } from "three/examples/jsm/Addons.js";
import gsap from "gsap";
import { AudioSystem } from "../makeAudioSystem";

function animateZ(sprite: THREE.Sprite, headPos: THREE.Vector3, delay = 0) {
    const finalPos: THREE.Vector3 = sprite.userData.finalPos;
    const finalScale: THREE.Vector3 = sprite.userData.finalScale;

    // reset to start
    sprite.position.copy(headPos);
    sprite.scale.set(0, 0, 0);
    sprite.material.opacity = 0;      // optional fade-in
    sprite.visible = true;

    const tl = gsap.timeline({ delay });

    tl.to(sprite.material, { opacity: 1, duration: 0.2, ease: "power1.out" }, 0);

    tl.to(sprite.position, {
        x: finalPos.x,
        y: finalPos.y,
        z: finalPos.z,
        duration: 0.9,
        ease: "power2.out",
    }, 0);

    tl.to(sprite.scale, {
        x: finalScale.x,
        y: finalScale.y,
        z: finalScale.z,
        duration: 0.9,
        ease: "back.out(2.2)", // nice pop
    }, 0);

    // optional: float a bit + fade out at the end
    tl.to(sprite.position, { y: finalPos.y + 0.2, duration: 0.6, ease: "sine.out" }, 0.9);
    tl.to(sprite.material, { opacity: 0, duration: 0.4, ease: "power1.in" }, 1.1);

    return tl;
}

export default function makePokeBallSystem(ctx: SceneContext): System & { getinteractables: () => THREE.Mesh[] } {
    const pokeballTexture = ctx.state.getTexture(TEXTURE_NAME.POKEBALL_TEXTURE);
    //const minecraftTexture = ctx.state.getTexture(TEXTURE_NAME.MINECRAFT_TEXTURE);
    const woodTexture = ctx.state.getTexture(TEXTURE_NAME.WOOD_TEXTURE);
    //const minecraftRoofTexture = ctx.state.getTexture(TEXTURE_NAME.MINECRAFT_ROOF_TEXTURE);
    //const houseTexture = ctx.state.getTexture(TEXTURE_NAME.HOUSE_TEXTURE);
    //const textureSetTwo = ctx.state.getTexture(TEXTURE_NAME.TEXTURE_SET_TWO);
    //const textureSetThree = ctx.state.getTexture(TEXTURE_NAME.TEXTURE_SET_THREE);
    const rotomTexture = ctx.state.getTexture(TEXTURE_NAME.ROTOM_TEXTURE);
    //const textureSetFour = ctx.state.getTexture(TEXTURE_NAME.TEXTURE_SET_FOUR);
    const archiePhotoTexture = ctx.state.getTexture(TEXTURE_NAME.Archie_Photo);
    const certificateTexture = ctx.state.getTexture(TEXTURE_NAME.Certificate);
    //const leafTexture = ctx.state.getTexture(TEXTURE_NAME.Leaf_Texture);
    const pikachuStatueTexture = ctx.state.getTexture(TEXTURE_NAME.Pikachu_Statue_Texture);
    const archieTexture = ctx.state.getTexture(TEXTURE_NAME.ARCHIE_TEXTURE);
    //const bootTexture = ctx.state.getTexture(TEXTURE_NAME.Boot_Texture);
    const wallTexture = ctx.state.getTexture(TEXTURE_NAME.WALL_TEEXTURE);
    const bookCover = ctx.state.getTexture(TEXTURE_NAME.BOOK_COVER);
    const jolteonIcon = ctx.state.getTexture(TEXTURE_NAME.JOLTEON_ICON);
    const zTexture = ctx.state.getTexture(TEXTURE_NAME.Z_TEXTURE);
    const cdCoverTexture = ctx.state.getTexture(TEXTURE_NAME.CD_COVER);

    const baseUniforms = THREE.UniformsUtils.clone(THREE.ShaderLib.lambert.uniforms);
    const customHouseUniform = {
        time: { value: 0 },
        resolution: { value: new THREE.Vector2(1, 1) },
        woodTexture: { value: woodTexture },
    }
    const woodUniforms = THREE.UniformsUtils.merge([baseUniforms, customHouseUniform]);

    const woodMat = new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms: woodUniforms,
        // side: THREE.DoubleSide,
        lights: true,
        fog: true,
    });


    const blackMaterial = new THREE.MeshToonMaterial({
        color: "#272727"
    })

    const blueMaterial = new THREE.MeshToonMaterial({
        color: "#62919c"
    })

    const redMaterial = new THREE.MeshToonMaterial({
        color: "#9c6567"
    })

    const brownMaterial = new THREE.MeshToonMaterial({
        color: "#856352"
    })

    const lightBrownMaterial = new THREE.MeshToonMaterial({
        color: "#91775d"
    })

    const yellowMaterial = new THREE.MeshToonMaterial({
        color: "#f2e394"
    })

    const pinkMaterial = new THREE.MeshToonMaterial({
        color: "#b87d90"
    })

    const orangeMaterial = new THREE.MeshToonMaterial({
        color: "#996f46"
    })

    const purpleMaterial = new THREE.MeshToonMaterial({
        color: "#7d395d"
    })
    const whiteMaterial = new THREE.MeshToonMaterial({
        color: "#eaeaea"
    })
    const greenMaterial = new THREE.MeshToonMaterial({
        color: "#557850"
    })

    let youtubeLogoMesh: THREE.Mesh | null = null;
    let linkedInLogoMesh: THREE.Mesh | null = null;
    let cdPlayerMesh: THREE.Mesh | null = null;
    let cdInPlayMesh: THREE.Mesh | null = null;
    const collisionGroup = new THREE.Group();
    ctx.scene.add(collisionGroup);

    return {
        async init(ctx: SceneContext, meshs: THREE.Mesh[], guiSystem: any, opts: { position: THREE.Vector3 }, controlSystem: ControlSystem, audioSystem: AudioSystem,) {
            const gltf: GLTF = await ctx.loaders.gltf.loadAsync('/models/house.glb');
            const model = gltf.scene;
            // model.position.copy(opts.position);
            // model.position.y += 0.5;
            model.position.set(-21, 0, -25);
            // model.scale.set(1.5, 1.5, 1.3);
            model.rotateY(-Math.PI / 6);
            collisionGroup.position.copy(model.position);
            collisionGroup.rotation.copy(model.rotation);
            // model.layers.set(3);
            ctx.scene.add(model);

            // texture set one
            const houseWall = model.getObjectByName('houseWall');
            const houseWood = model.getObjectByName('houseWood');
            const fence = model.getObjectByName('fence');
            // const doorFrame = model.getObjectByName('doorFrame');
            // const windowFrame = model.getObjectByName('windowFrame');
            if (houseWall && houseWall instanceof THREE.Mesh) {
                houseWall.material = new THREE.MeshStandardMaterial({
                    map: wallTexture,
                    roughness: 1.0,
                    metalness: 0.0,
                })
                houseWall.castShadow = true;
                houseWall.receiveShadow = true;
                //houseWall.layers.enable(3);
                collisionGroup.add(houseWall);
            }
            if (houseWood && houseWood instanceof THREE.Mesh) {
                houseWood.material = new THREE.MeshToonMaterial({
                    map: woodTexture,
                    // roughness: 1.0,
                    // metalness: 0.0,
                })
                houseWood.castShadow = true;
                houseWood.receiveShadow = true;
                //houseWood.layers.enable(3);
                collisionGroup.add(houseWood);
            }
            if (fence && fence instanceof THREE.Mesh) {
                // fence.material = woodMat;
                fence.material = new THREE.MeshToonMaterial({
                    map: woodTexture,
                    // roughness: 1.0,
                    // metalness: 0.0,
                })
                fence.castShadow = true;
                fence.receiveShadow = true;
                //fence.layers.enable(3);
                collisionGroup.add(fence);
            }

            const bedSilk = model.getObjectByName('bedSilk');
            const bedWood = model.getObjectByName('bedWood');
            const bedCollider = model.getObjectByName('bedCollider');
            const capybara = model.getObjectByName('capybara');
            const archie = model.getObjectByName('archie');
            const photoFrame = model.getObjectByName('photoFrame');
            const archiePhoto = model.getObjectByName('archiePhoto');
            //const bedDesk = model.getObjectByName('bedDesk');
            const rotomBody = model.getObjectByName('rotomBody');
            const rotomShine = model.getObjectByName('rotomShine');
            const phoneOrange = model.getObjectByName('phoneOrange');
            const phoneBlack = model.getObjectByName('phoneBlack');
            const candlePurple = model.getObjectByName('candlePurple');
            const candleWhite = model.getObjectByName('candleWhite');

            if (bedSilk && bedSilk instanceof THREE.Mesh) {
                bedSilk.material = new THREE.MeshToonMaterial({
                    color: "#585d5e",
                    // roughness: 1.0,
                    // metalness: 0.0,
                })
                //bedSilk.castShadow = true;
                bedSilk.receiveShadow = true;
                bedSilk.layers.set(0);
                collisionGroup.add(bedSilk);
            }
            if (bedWood && bedWood instanceof THREE.Mesh) {
                bedWood.material = new THREE.MeshToonMaterial({
                    map: woodTexture,
                    // roughness: 1.0,
                    // metalness: 0.0,
                })
                bedWood.castShadow = true;
                bedWood.receiveShadow = true;
                //bedWood.layers.set(0);
                collisionGroup.add(bedWood);
            }
            if (bedCollider && bedCollider instanceof THREE.Mesh) {
                bedCollider.visible = false;
                collisionGroup.add(bedCollider);
            }
            if (capybara && capybara instanceof THREE.Mesh) {
                capybara.material = new THREE.MeshToonMaterial({
                    color: "#785442",
                    // roughness: 1.0,
                    // metalness: 0.0,
                })
                capybara.castShadow = true;
                capybara.receiveShadow = true;
                // capybara.layers.set(0);
            }
            if (archie && archie instanceof THREE.Mesh) {
                archie.material = new THREE.MeshToonMaterial({
                    map: archieTexture,

                })
                archie.material.onBeforeCompile = (shader: any) => {

                    shader.fragmentShader = shader.fragmentShader.replace(
                        'vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;',
                        `
                            vec3 outgoingLight = (reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance) * 0.3;

                            `
                    );
                }
                archie.castShadow = true;
                archie.receiveShadow = true;
                archie.material.needsUpdate = true;
                const zTex = zTexture;
                const zMat = new THREE.SpriteMaterial({ map: zTex, transparent: true, depthWrite: false, fog: false });

                const z1 = new THREE.Sprite(zMat);
                z1.position.set(-31, 2, -24);
                z1.scale.set(0.5, 0.5, 0.5);
                z1.userData.finalPos = new THREE.Vector3(-31, 2, -24);
                z1.userData.finalScale = new THREE.Vector3(0.5, 0.5, 0.5);


                const z2 = new THREE.Sprite(zMat);
                z2.position.set(-31.2, 2.2, -24.2);
                z2.scale.set(0.4, 0.4, 0.4);
                z2.userData.finalPos = new THREE.Vector3(-31.2, 2.2, -24.2);
                z2.userData.finalScale = new THREE.Vector3(0.4, 0.4, 0.4);


                const z3 = new THREE.Sprite(zMat);
                z3.position.set(-31.4, 2.4, -24.4);
                z3.scale.set(0.3, 0.3, 0.3);
                z3.userData.finalPos = new THREE.Vector3(-31.4, 2.4, -24.4);
                z3.userData.finalScale = new THREE.Vector3(0.3, 0.3, 0.3);



                ctx.scene.add(z1, z2, z3);
                if (guiSystem) {
                    guiSystem.updateSprites([z1, z2, z3]);
                }


                const archieHeadPosition = new THREE.Vector3(-31, 1.5, -24);
                function loopZZZ() {
                    const master = gsap.timeline({
                        onComplete: () => loopZZZ(),
                    });

                    master.add(animateZ(z1, archieHeadPosition, 0.0), 0);
                    master.add(animateZ(z2, archieHeadPosition, 0.35), 0);
                    master.add(animateZ(z3, archieHeadPosition, 0.7), 0);
                }

                loopZZZ();

                const placeholderCube = new THREE.Mesh();
                placeholderCube.position.set(-31, 1.5, -24);
                ctx.scene.add(placeholderCube);
                placeholderCube.visible = false;

                audioSystem.playCatSound(placeholderCube);

            }
            if (photoFrame && photoFrame instanceof THREE.Mesh) {
                photoFrame.material = new THREE.MeshToonMaterial({
                    color: "#785442",
                })
                photoFrame.castShadow = true;
                photoFrame.receiveShadow = true;
            }
            if (archiePhoto && archiePhoto instanceof THREE.Mesh) {
                archiePhoto.material = new THREE.MeshBasicMaterial({
                    map: archiePhotoTexture,
                })
                archiePhoto.receiveShadow = true;
                archiePhoto.castShadow = true;
            }

            // if(bedDesk && bedDesk instanceof THREE.Mesh) {
            //     bedDesk.material = new THREE.MeshToonMaterial({
            //         map: woodTexture,
            //     });
            //     bedDesk.castShadow = true;
            //     bedDesk.receiveShadow = true;
            // }

            if (rotomBody && rotomBody instanceof THREE.Mesh) {
                rotomBody.material = new THREE.MeshBasicMaterial({
                    map: rotomTexture,
                })
            }
            if (rotomShine && rotomShine instanceof THREE.Mesh) {
                rotomShine.material = new THREE.MeshBasicMaterial({
                    color: "#7ac0cf"
                });
                rotomShine.layers.enable(ctx.state.postEffectState.bloom.layer);
            }
            function startRotomIdle(rotom: THREE.Object3D) {
                // Float up/down
                gsap.to(rotom.position, {
                    y: rotom.position.y + 0.22,
                    duration: 2.2,
                    ease: "sine.inOut",
                    yoyo: true,
                    repeat: -1,
                });

                // Subtle side drift (optional)
                gsap.to(rotom.position, {
                    x: rotom.position.x + 0.08,
                    duration: 3.6,
                    ease: "sine.inOut",
                    yoyo: true,
                    repeat: -1,
                });

                // Gentle yaw sway (optional)
                // gsap.to(rotom.rotation, {
                //     y: rotom.rotation.y + 0.18,
                //     duration: 3.0,
                //     ease: "sine.inOut",
                //     yoyo: true,
                //     repeat: -1,
                // });
            }

            function scheduleRotomSpin(rotomBody: THREE.Object3D, rotomShine: THREE.Object3D) {
                const wait = gsap.utils.random(10, 20); // seconds
                gsap.delayedCall(wait, () => {
                    doRotomSpin(rotomBody, rotomShine);
                    scheduleRotomSpin(rotomBody, rotomShine);
                });
            }

            function doRotomSpin(rotomBody: THREE.Object3D, rotomShine: THREE.Object3D) {
                // quick spin burst
                gsap.to(rotomBody.rotation, {
                    z: rotomBody.rotation.z + Math.PI * 2,
                    x: rotomBody.rotation.x + Math.PI * 2,
                    duration: 0.85,
                    ease: "power2.inOut",
                    yoyo: true,
                });

                gsap.to(rotomShine.rotation, {
                    z: rotomShine.rotation.z + Math.PI * 2,
                    x: rotomBody.rotation.x + Math.PI * 2,
                    duration: 0.85,
                    ease: "power2.inOut",
                    yoyo: true,
                });

                // optional: tiny “pop” scale for energy
                gsap.fromTo(
                    rotomBody.scale,
                    { x: 0.95, y: 1.08, z: 0.95 },
                    { x: 1, y: 1, z: 1, duration: 0.28, ease: "back.out(2)" }
                );
                gsap.fromTo(
                    rotomShine.scale,
                    { x: 0.95, y: 1.08, z: 0.95 },
                    { x: 1, y: 1, z: 1, duration: 0.28, ease: "back.out(2)" }
                );
            }

            if (rotomBody && rotomShine) {
                startRotomIdle(rotomBody);
                startRotomIdle(rotomShine);

                scheduleRotomSpin(rotomBody, rotomShine);
            }

            if (phoneOrange && phoneOrange instanceof THREE.Mesh) {
                phoneOrange.material = orangeMaterial;
                phoneOrange.castShadow = true;
                phoneOrange.receiveShadow = true;
            }
            if (phoneBlack && phoneBlack instanceof THREE.Mesh) {
                phoneBlack.material = blackMaterial;
            }
            if (candlePurple && candlePurple instanceof THREE.Mesh) {
                candlePurple.material = purpleMaterial;
                candlePurple.castShadow = true;
                candlePurple.receiveShadow = true;
            }
            if (candleWhite && candleWhite instanceof THREE.Mesh) {
                candleWhite.material = whiteMaterial;
            }

            const desk = model.getObjectByName('desk');
            const smallDesk = model.getObjectByName('smallDesk');
            const glass = model.getObjectByName('glass');
            const switchRed = model.getObjectByName('switchRed');
            const switchBlue = model.getObjectByName('switchBlue');
            const switchBlack = model.getObjectByName('switchBlack');
            const headset = model.getObjectByName('headset');
            const pot = model.getObjectByName('pot');
            const plants = model.getObjectByName('plants');
            const certificate = model.getObjectByName('certificate');
            const yellowBinder = model.getObjectByName('yellowBinder');
            const blackBinder = model.getObjectByName('blackBinder');
            const pinkNotes = model.getObjectByName('pinkNotes');
            const blueNotes = model.getObjectByName('blueNotes');
            const doraemon = model.getObjectByName('doraemon');
            const pikachu = model.getObjectByName('pikachu');
            const boxes = model.getObjectByName('boxes');
            const mug = model.getObjectByName('mug');
            const coffee = model.getObjectByName('coffee');
            const mugSticker = model.getObjectByName('mugSticker');
            const pokeball = model.getObjectByName('pokeball');
            const pokeballShine = model.getObjectByName('pokeballShine');


            if (desk && desk instanceof THREE.Mesh) {
                desk.material = new THREE.MeshToonMaterial({
                    //map: woodTexture,
                    color: "#785442",
                })
                desk.castShadow = true;
                desk.receiveShadow = true;
                collisionGroup.add(desk);
            }
            if (smallDesk && smallDesk instanceof THREE.Mesh) {
                smallDesk.material = new THREE.MeshToonMaterial({
                    //map: woodTexture,
                    color: "#785442",
                })
                smallDesk.castShadow = true;
                smallDesk.receiveShadow = true;
                collisionGroup.add(smallDesk);
            }
            if (glass && glass instanceof THREE.Mesh) {
                glass.material = new THREE.MeshPhysicalMaterial({
                    color: "#bacacf",
                    transparent: true,
                    opacity: 0.5,
                });
                collisionGroup.add(glass);
            }

            if (switchRed && switchRed instanceof THREE.Mesh) {
                switchRed.material = redMaterial;
                switchRed.castShadow = true;
                //switchRed.receiveShadow = true;
            }
            if (switchBlue && switchBlue instanceof THREE.Mesh) {
                switchBlue.material = blueMaterial;
                switchBlue.castShadow = true;
                //switchBlue.receiveShadow = true;
            }
            if (switchBlack && switchBlack instanceof THREE.Mesh) {
                switchBlack.material = new THREE.MeshToonMaterial({
                    color: "#494748"
                })
                switchBlack.castShadow = true;
                //switchBlack.receiveShadow = true;
            }

            if (headset && headset instanceof THREE.Mesh) {
                headset.material = lightBrownMaterial;
                headset.castShadow = true;

            }
            if (pot && pot instanceof THREE.Mesh) {
                pot.material = brownMaterial;
                pot.castShadow = true;
                pot.receiveShadow = true;
            }
            if (plants && plants instanceof THREE.Mesh) {
                plants.material = new THREE.MeshToonMaterial({
                    color:"#497347"
                })
                plants.castShadow = true;
                plants.receiveShadow = true;
            }
            if (certificate && certificate instanceof THREE.Mesh) {
                certificate.material = new THREE.MeshToonMaterial({
                    map: certificateTexture,
                })
                certificate.material.onBeforeCompile = (shader: any) => {

                    shader.fragmentShader = shader.fragmentShader.replace(
                        'vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;',
                        `
                            vec3 outgoingLight = (reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance) * 0.3;

                            `
                    );
                }
                certificate.receiveShadow = true;
            }
            if (yellowBinder && yellowBinder instanceof THREE.Mesh) {
                yellowBinder.material = yellowMaterial;
                yellowBinder.castShadow = true;
                yellowBinder.receiveShadow = true;
            }
            if (blackBinder && blackBinder instanceof THREE.Mesh) {
                blackBinder.material = blackMaterial;
                blackBinder.castShadow = true;
                blackBinder.receiveShadow = true;
            }
            if (pinkNotes && pinkNotes instanceof THREE.Mesh) {
                pinkNotes.material = pinkMaterial;
                pinkNotes.castShadow = true;
                pinkNotes.receiveShadow = true;
            }
            if (blueNotes && blueNotes instanceof THREE.Mesh) {
                blueNotes.material = blueMaterial;
                blueNotes.castShadow = true;
                blueNotes.receiveShadow = true;
            }
            if (doraemon && doraemon instanceof THREE.Mesh) {
                doraemon.material = new THREE.MeshToonMaterial({
                    map: bookCover
                })
                doraemon.material.onBeforeCompile = (shader: any) => {

                    shader.fragmentShader = shader.fragmentShader.replace(
                        'vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;',
                        `
                            vec3 outgoingLight = (reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance) * 0.3;

                            `
                    );
                }
                doraemon.castShadow = true;
                doraemon.receiveShadow = true;
            }
            if (pikachu && pikachu instanceof THREE.Mesh) {
                pikachu.material = new THREE.MeshToonMaterial({
                    map: pikachuStatueTexture
                })
                pikachu.material.onBeforeCompile = (shader: any) => {

                    shader.fragmentShader = shader.fragmentShader.replace(
                        'vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;',
                        `
                            vec3 outgoingLight = (reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance) * 0.3;

                            `
                    );
                }
                pikachu.castShadow = true;
                pikachu.receiveShadow = true;
            }
            if (pokeball && pokeball instanceof THREE.Mesh) {
                pokeball.material = new THREE.MeshToonMaterial({
                    map: pokeballTexture,
                });
                pokeball.material.onBeforeCompile = (shader: any) => {

                    shader.fragmentShader = shader.fragmentShader.replace(
                        'vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;',
                        `
                            vec3 outgoingLight = (reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance) * 0.3;

                            `
                    );
                }
                pokeball.castShadow = true;
                pokeball.receiveShadow = true;
            }
            if (pokeballShine && pokeballShine instanceof THREE.Mesh) {
                pokeballShine.material = new THREE.MeshBasicMaterial({
                    color: "#ffffff",
                });
                pokeballShine.layers.enable(ctx.state.postEffectState.bloom.layer);
            }

            if (boxes && boxes instanceof THREE.Mesh) {
                boxes.material = lightBrownMaterial;
                boxes.castShadow = true;
                boxes.receiveShadow = true;
            }

            if (mug && mug instanceof THREE.Mesh) {
                mug.material = blackMaterial;
                mug.castShadow = true;
                mug.receiveShadow = true;
            }
            if (coffee && coffee instanceof THREE.Mesh) {
                coffee.material = brownMaterial;
            }
            if (mugSticker && mugSticker instanceof THREE.Mesh) {
                mugSticker.material = new THREE.MeshBasicMaterial({
                    map: jolteonIcon
                })
            }

            const cdCover = model.getObjectByName('cdCover');
            const cdIdle = model.getObjectByName('cdIdle');
            const cdInPlay = model.getObjectByName('cdInPlay');
            const cdPlayer = model.getObjectByName('cdPlayer');
            const cactusPot = model.getObjectByName('cactusPot');
            const cactus = model.getObjectByName('cactus');

            if (cactusPot && cactusPot instanceof THREE.Mesh) {
                cactusPot.material = blueMaterial;
                cactusPot.castShadow = true;
                cactusPot.receiveShadow = true;
            }
            if (cactus && cactus instanceof THREE.Mesh) {
                cactus.material = greenMaterial;
                cactus.castShadow = true;
                cactus.receiveShadow = true;
            }


            if (cdCover && cdCover instanceof THREE.Mesh) {
                cdCover.material = blueMaterial;
                cdCover.castShadow = true;
                cdCover.receiveShadow = true;
            }
            if (cdIdle && cdIdle instanceof THREE.Mesh) {
                cdIdle.material = blackMaterial
                // cdIdle.castShadow = true;
                // cdIdle.receiveShadow = true;
            }
            if (cdInPlay && cdInPlay instanceof THREE.Mesh) {
                cdInPlay.material = new THREE.MeshToonMaterial({
                    map: cdCoverTexture,
                });
                cdInPlayMesh = cdInPlay;
                // cdInPlay.castShadow = true;
                // cdInPlay.receiveShadow = true;
            }
            if (cdPlayer && cdPlayer instanceof THREE.Mesh) {
                cdPlayer.material = new THREE.MeshToonMaterial({
                    color: "#E78C62"
                })
                cdPlayer.castShadow = true;
                cdPlayer.receiveShadow = true;
                cdPlayer.userData.playMusic = 'luna';
                cdPlayer.userData.interactLabel = "play music";
                cdPlayer.userData.rotation = false;
                cdPlayerMesh = cdPlayer;

                const cdPlayerPlaceholder = new THREE.Mesh();
                cdPlayerPlaceholder.position.set(-28, 2, -37);
                ctx.scene.add(cdPlayerPlaceholder);
                cdPlayerPlaceholder.visible = false;
                audioSystem.bindPiano('lune', cdPlayerPlaceholder);
            }

            const youtubeLogo = model.getObjectByName('logoYoutube');
            const linkedInLogo = model.getObjectByName('logoLinkedin');
            const neonLogo = model.getObjectByName('neonLogo');

            if (youtubeLogo && youtubeLogo instanceof THREE.Mesh) {
                youtubeLogo.material = new THREE.MeshBasicMaterial({ color: "#d9614c" });
                youtubeLogo.layers.enable(ctx.state.postEffectState.bloom.layer);
                youtubeLogo.userData.interactUrl = "https://www.youtube.com/@wenzezhang5595";
                youtubeLogo.userData.interactLabel = "Visit my YouTube";
                youtubeLogoMesh = youtubeLogo;
            }
            if (linkedInLogo && linkedInLogo instanceof THREE.Mesh) {
                linkedInLogo.material = new THREE.MeshBasicMaterial({ color: "#3b77a8" });
                linkedInLogo.layers.enable(ctx.state.postEffectState.bloom.layer);
                linkedInLogo.userData.interactUrl = "https://www.linkedin.com/in/wenze-zhang-7b5669237/";
                linkedInLogo.userData.interactLabel = "Visit my LinkedIn";
                linkedInLogoMesh = linkedInLogo;
            }

            if (neonLogo && neonLogo instanceof THREE.Mesh) {
                neonLogo.material = new THREE.MeshBasicMaterial({ color: "#868be3" });
                neonLogo.layers.enable(ctx.state.postEffectState.bloom.layer);
            }

            controlSystem.buildCollisionOctree(collisionGroup);


            // if (house && house instanceof THREE.Mesh) {
            //     house.material = new THREE.MeshBasicMaterial({
            //         map: houseTexture,
            //     })
            //     house.castShadow = true;
            // }

            // // texture set two
            // const microphoneRing = model.getObjectByName('microphoneRing_Bloom');
            // const volumeIndicator1 = model.getObjectByName('volumeIndicator1_Bloom');
            // const volumeIndicator2 = model.getObjectByName('volumeIndicator2_Bloom');
            // const volumeIndicator3 = model.getObjectByName('volumeIndicator3_Bloom');
            // const youtubeLogo = model.getObjectByName('logo_youtube_Bloom');
            // const neonSign = model.getObjectByName('neon-logo_Bloom');

            // const microphone = model.getObjectByName('microphone');
            // const musicSheet1 = model.getObjectByName('musicSheet-1');
            // const musicSheet2 = model.getObjectByName('musicSheet-2');
            // const musicSheet3 = model.getObjectByName('musicSheet-3');

            // if (microphone && microphone instanceof THREE.Mesh) {
            //     microphone.material = new THREE.MeshBasicMaterial({
            //         map: textureSetTwo,
            //     })
            // }
            // if (musicSheet1 && musicSheet1 instanceof THREE.Mesh) {
            //     musicSheet1.material = new THREE.MeshBasicMaterial({
            //         map: textureSetTwo,
            //     })
            // }
            // if (musicSheet2 && musicSheet2 instanceof THREE.Mesh) {
            //     musicSheet2.material = new THREE.MeshBasicMaterial({
            //         map: textureSetTwo,
            //     })
            // }
            // if (musicSheet3 && musicSheet3 instanceof THREE.Mesh) {
            //     musicSheet3.material = new THREE.MeshBasicMaterial({
            //         map: textureSetTwo,
            //     })
            // }

            // if (youtubeLogo && youtubeLogo instanceof THREE.Mesh) {
            //     youtubeLogo.material = new THREE.MeshBasicMaterial({ color: "#FF3E48" });
            //     youtubeLogo.layers.enable(ctx.state.postEffectState.bloom.layer);
            // }

            // if (neonSign && neonSign instanceof THREE.Mesh) {
            //     neonSign.material = new THREE.MeshBasicMaterial({ color: "#5c64fa" });
            //     neonSign.layers.enable(ctx.state.postEffectState.bloom.layer);
            // }

            // const volumeIndicatorMat = new THREE.MeshBasicMaterial({ color: "#78C372" });

            // if (volumeIndicator1 && volumeIndicator1 instanceof THREE.Mesh) {
            //     volumeIndicator1.material = volumeIndicatorMat;
            //     volumeIndicator1.layers.enable(ctx.state.postEffectState.bloom.layer);
            // }
            // if (volumeIndicator2 && volumeIndicator2 instanceof THREE.Mesh) {
            //     volumeIndicator2.material = volumeIndicatorMat;
            //     volumeIndicator2.layers.enable(ctx.state.postEffectState.bloom.layer);
            // }
            // if (volumeIndicator3 && volumeIndicator3 instanceof THREE.Mesh) {
            //     volumeIndicator3.material = volumeIndicatorMat;
            //     volumeIndicator3.layers.enable(ctx.state.postEffectState.bloom.layer);
            // }


            // //texture set three
            // const bed = model.getObjectByName('bed');
            // const bedDesk = model.getObjectByName('bedDesk');
            // const doll = model.getObjectByName('doll');
            // const phone = model.getObjectByName('phone');
            // const photos = model.getObjectByName('photos');
            // const rotomBody = model.getObjectByName('rotom-body');
            // const rotomShine = model.getObjectByName('rotom-shine');

            // if (bed && bed instanceof THREE.Mesh) {
            //     bed.material = new THREE.MeshBasicMaterial({
            //         map: textureSetThree,
            //     })
            // }
            // if (bedDesk && bedDesk instanceof THREE.Mesh) {
            //     bedDesk.material = new THREE.MeshBasicMaterial({
            //         map: textureSetThree,
            //     })
            // }
            // if (doll && doll instanceof THREE.Mesh) {
            //     doll.material = new THREE.MeshBasicMaterial({
            //         map: textureSetThree,
            //     })
            // }
            // if (phone && phone instanceof THREE.Mesh) {
            //     phone.material = new THREE.MeshBasicMaterial({
            //         map: textureSetThree,
            //     })
            // }
            // if (photos && photos instanceof THREE.Mesh) {
            //     photos.material = new THREE.MeshBasicMaterial({
            //         map: textureSetThree,
            //     })
            // }
            // if (rotomBody && rotomBody instanceof THREE.Mesh) {
            //     rotomBody.material = new THREE.MeshBasicMaterial({
            //         map: rotomTexture,
            //     })
            // }
            // if (rotomShine && rotomShine instanceof THREE.Mesh) {
            //     rotomShine.material = new THREE.MeshBasicMaterial({
            //         color: "#84DFD1"
            //     })
            //     rotomShine.layers.enable(ctx.state.postEffectState.bloom.layer);
            // }

            // // texture set four
            // const desk = model.getObjectByName('desk');
            // if (desk && desk instanceof THREE.Mesh) {
            //     desk.material = new THREE.MeshBasicMaterial({
            //         map: textureSetFour,
            //     })
            // }

            // //photoes
            // const archiePhoto = model.getObjectByName('archiePhoto');
            // const certificate = model.getObjectByName('certificate');
            // if (archiePhoto && archiePhoto instanceof THREE.Mesh) {
            //     archiePhoto.material = new THREE.MeshBasicMaterial({
            //         map: archiePhotoTexture,
            //     })
            // }
            // if (certificate && certificate instanceof THREE.Mesh) {
            //     certificate.material = new THREE.MeshBasicMaterial({
            //         map: certificateTexture,
            //     })
            // }

            // const branches = model.getObjectByName('branches');
            // if (branches && branches instanceof THREE.Mesh) {
            //     branches.material = new THREE.MeshBasicMaterial({
            //         map: leafTexture,
            //     })
            // }

            // const pikachuStatue = model.getObjectByName('pikachu');
            // if (pikachuStatue && pikachuStatue instanceof THREE.Mesh) {
            //     pikachuStatue.material = new THREE.MeshBasicMaterial({
            //         map: pikachuStatueTexture,
            //     })
            // }
            // const pokeball = model.getObjectByName('pokeball');
            // if (pokeball && pokeball instanceof THREE.Mesh) {
            //     pokeball.material = new THREE.MeshBasicMaterial({
            //         map: pokeballTexture,
            //     })
            // }

            // const archie = model.getObjectByName('archie');
            // if (archie && archie instanceof THREE.Mesh) {
            //     archie.material = new THREE.MeshBasicMaterial({
            //         map: archieTexture,
            //     })
            // }

            // const boot = model.getObjectByName('boot');
            // if (boot && boot instanceof THREE.Mesh) {
            //     boot.material = new THREE.MeshBasicMaterial({
            //         map: bootTexture,
            //     })
            // }

            // const linkedinLogo = model.getObjectByName('linkedin');
            // if (linkedinLogo && linkedinLogo instanceof THREE.Mesh) {
            //     linkedinLogo.material = new THREE.MeshBasicMaterial({ color: "#5395FF" });
            //     linkedinLogo.layers.enable(ctx.state.postEffectState.bloom.layer);
            // }





            // ctx.loaders.gltf.load('/models/pokeball.glb', (gltf) => {
            //     const model = gltf.scene;
            //     model.position.copy(opts.position);
            //     ctx.scene.add(model);
            //     const pokeball = model.getObjectByName('pokeball-low');
            //     const minecraft = model.getObjectByName('minecraft');
            //     const cabin = model.getObjectByName('cabin');
            //     // const cabinBody = model.getObjectByName("cabin-body");
            //     // const cabinRoof = model.getObjectByName("cabin-roof");
            //     if (pokeball && pokeball instanceof THREE.Mesh) {
            //         // pokeball.scale.set(2, 2, 2);
            //         // pokeball.position.copy(opts.position);
            //         // pokeball.rotateY(1);
            //         pokeball.castShadow = true;
            //         const pokeballMat = new THREE.MeshBasicMaterial({
            //             map: pokeballTexture,
            //         });
            //         // pokeballMat.onBeforeCompile = (shader) => {
            //         //     modifyShader(shader);
            //         // }
            //         pokeball.material = pokeballMat;
            //         pokeball.name = "pokeball";
            //         // pokeball.layers.enable(ctx.state.postEffectState.bloom.layer);
            //         // ctx.scene.add(pokeball);
            //         meshs.push(pokeball);
            //         guiSystem.updateMeshes(meshs);
            //     }
            //     if (minecraft && minecraft instanceof THREE.Mesh) {
            //         const minecraftMat = new THREE.MeshBasicMaterial({
            //             map: minecraftTexture,
            //         });
            //         minecraft.material = minecraftMat;
            //         minecraft.name = "minecraft";
            //     }
            //     if (cabin && cabin instanceof THREE.Mesh) {
            //         const cabinBodyMat = new THREE.ShaderMaterial({
            //             vertexShader,
            //             fragmentShader,
            //             uniforms: houseUniforms,
            //             lights: true,
            //         });
            //         // const cabinBodyMat = new THREE.MeshStandardMaterial({
            //         //     map: minecraftWoodTexture,
            //         // });

            //         // cabinBody.castShadow = true;
            //         // cabinBody.receiveShadow = true;
            //         cabin.material = cabinBodyMat;
            //         // cabin.geometry.computeVertexNormals();
            //         cabin.castShadow = true;
            //         cabin.receiveShadow = true;
            //         cabin.name = "cabin";
            //         cabin.customDepthMaterial = new THREE.ShaderMaterial({
            //             uniforms: houseUniforms,
            //             vertexShader: vertexDepth,
            //             fragmentShader: `
            //             varying vec2 vUv;
            //             varying vec3 vNormalWS;
            //               void main() {
            //                 gl_FragColor = vec4( vec3( gl_FragCoord.z ), 1.0 );
            //               }
            //             `,
            //         });
            //         cabin.rotateY(Math.PI / 6);
            //         // const direcitonalLight = new THREE.DirectionalLight(0xffffff, 1);
            //         // direcitonalLight.position.copy(cabin.getWorldPosition(new THREE.Vector3()).add(new THREE.Vector3(5,3,5)));
            //         // direcitonalLight.castShadow = true;
            //         // direcitonalLight.shadow.mapSize.width = 512;
            //         // direcitonalLight.shadow.mapSize.height = 512;
            //         // direcitonalLight.shadow.camera.near = 0.5;
            //         // direcitonalLight.shadow.camera.far = 10;
            //         // direcitonalLight.shadow.camera.left = -10;
            //         // direcitonalLight.shadow.camera.right = 10;
            //         // direcitonalLight.shadow.camera.top = 10;
            //         // direcitonalLight.shadow.camera.bottom = -10;
            //         // ctx.scene.add(direcitonalLight);
            //     }
            //     // if( cabinBody && cabinBody instanceof THREE.Mesh){
            //     //     const cabinBodyMat = new THREE.ShaderMaterial({
            //     //         vertexShader,
            //     //         fragmentShader,
            //     //         uniforms: {
            //     //             minecraftWoodTexture: { value: minecraftWoodTexture },
            //     //         }
            //     //     });
            //     //     // cabinBody.castShadow = true;
            //     //     // cabinBody.receiveShadow = true;
            //     //     cabinBody.material = cabinBodyMat;
            //     //     cabinBody.name = "cabinBody";
            //     // }
            //     // if( cabinRoof && cabinRoof instanceof THREE.Mesh){
            //     //     const cabinRoofMat = new THREE.MeshStandardMaterial({
            //     //         map: minecraftRoofTexture,
            //     //     });
            //     //     cabinRoof.castShadow = true;
            //     //     cabinRoof.receiveShadow = true;
            //     //     cabinRoof.material = cabinRoofMat;
            //     //     cabinRoof.name = "cabinRoof";
            //     // }
            //     console.log("pokeball model loaded:", model);
            // });
        },
        update(dt: number) {
            if (cdPlayerMesh && cdInPlayMesh && cdPlayerMesh.userData.rotation) {
                cdInPlayMesh.rotation.y = dt * 2;
            }
        },
        getinteractables() {
            //console.log("pokeBallSystem interactables: ", [youtubeLogoMesh, linkedInLogoMesh, cdPlayerMesh]);
            return [youtubeLogoMesh, linkedInLogoMesh, cdPlayerMesh].filter((mesh): mesh is THREE.Mesh => mesh !== null);
        },

        dispose() { }
    }
}