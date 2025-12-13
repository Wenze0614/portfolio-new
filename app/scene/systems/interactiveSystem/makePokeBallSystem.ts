import { SceneContext, System, TEXTURE_NAME } from "../../core/types";
import * as THREE from "three";
import vertexShader from '../../shaders/houseShaders/vertex.vert';
import fragmentShader from '../../shaders/houseShaders/fragment.frag';
import vertexDepth from '../../shaders/houseShaders/vertexDepth.vert';
import { GLTF } from "three/examples/jsm/Addons.js";

export default function makePokeBallSystem(ctx: SceneContext): System & { getinteractables: () => THREE.Mesh[] } {
    const pokeballTexture = ctx.state.getTexture(TEXTURE_NAME.POKEBALL_TEXTURE);
    const minecraftTexture = ctx.state.getTexture(TEXTURE_NAME.MINECRAFT_TEXTURE);
    const woodTexture = ctx.state.getTexture(TEXTURE_NAME.WOOD_TEXTURE);
    const minecraftRoofTexture = ctx.state.getTexture(TEXTURE_NAME.MINECRAFT_ROOF_TEXTURE);
    const houseTexture = ctx.state.getTexture(TEXTURE_NAME.HOUSE_TEXTURE);
    const textureSetTwo = ctx.state.getTexture(TEXTURE_NAME.TEXTURE_SET_TWO);
    const textureSetThree = ctx.state.getTexture(TEXTURE_NAME.TEXTURE_SET_THREE);
    const rotomTexture = ctx.state.getTexture(TEXTURE_NAME.ROTOM_TEXTURE);
    const textureSetFour = ctx.state.getTexture(TEXTURE_NAME.TEXTURE_SET_FOUR);
    const archiePhotoTexture = ctx.state.getTexture(TEXTURE_NAME.Archie_Photo);
    const certificateTexture = ctx.state.getTexture(TEXTURE_NAME.Certificate);
    const leafTexture = ctx.state.getTexture(TEXTURE_NAME.Leaf_Texture);
    const pikachuStatueTexture = ctx.state.getTexture(TEXTURE_NAME.Pikachu_Statue_Texture);
    const archieTexture = ctx.state.getTexture(TEXTURE_NAME.ARCHIE_TEXTURE);
    const bootTexture = ctx.state.getTexture(TEXTURE_NAME.Boot_Texture);
    const wallTexture = ctx.state.getTexture(TEXTURE_NAME.WALL_TEEXTURE);
    const bookCover = ctx.state.getTexture(TEXTURE_NAME.BOOK_COVER);
    const jolteonIcon = ctx.state.getTexture(TEXTURE_NAME.JOLTEON_ICON);
    const zTexture = ctx.state.getTexture(TEXTURE_NAME.Z_TEXTURE);

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
        color: "#7ac0cf"
    })

    const redMaterial = new THREE.MeshToonMaterial({
        color: "#d68386"
    })

    const brownMaterial = new THREE.MeshToonMaterial({
        color: "#856352"
    })

    const lightBrownMaterial = new THREE.MeshToonMaterial({
        color: "#c9a37d"
    })

    const yellowMaterial = new THREE.MeshToonMaterial({
        color: "#f2e394"
    })

    const pinkMaterial = new THREE.MeshToonMaterial({
        color: "#f2c1d1"
    })
    
    const orangeMaterial = new THREE.MeshToonMaterial({
        color: "#f2a65e"
    })

    const purpleMaterial = new THREE.MeshToonMaterial({
        color: "#c27ba0"
    })
    const whiteMaterial = new THREE.MeshToonMaterial({
        color: "#eaeaea"
    })

    let youtubeLogoMesh: THREE.Mesh | null = null;
    let linkedInLogoMesh: THREE.Mesh | null = null;

    return {
        async init(ctx: SceneContext, meshs: THREE.Mesh[], guiSystem: any, opts: { position: THREE.Vector3 }) {
            const gltf: GLTF = await ctx.loaders.gltf.loadAsync('/models/fence-v41.glb');
            const model = gltf.scene;
            // model.position.copy(opts.position);
            // model.position.y += 0.5;
            model.position.set(-21, 0, -25);
            // model.scale.set(1.5, 1.5, 1.3);
            model.rotateY(-Math.PI / 6);
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
            }
            if (houseWood && houseWood instanceof THREE.Mesh) {
                houseWood.material = new THREE.MeshToonMaterial({
                    map: woodTexture,
                    // roughness: 1.0,
                    // metalness: 0.0,
                })
                houseWood.castShadow = true;
                houseWood.receiveShadow = true;
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
            }

            const bedSilk = model.getObjectByName('bedSilk');
            const bedWood = model.getObjectByName('bedWood');
            const capybara = model.getObjectByName('capybara');
            const archie = model.getObjectByName('archie');
            const photoFrame = model.getObjectByName('photoFrame');
            const archiePhoto = model.getObjectByName('archiePhoto');
            const bedDesk = model.getObjectByName('bedDesk');
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
            }
            if (bedWood && bedWood instanceof THREE.Mesh) {
                bedWood.material = new THREE.MeshToonMaterial({
                    map: woodTexture,
                    // roughness: 1.0,
                    // metalness: 0.0,
                })
                bedWood.castShadow = true;
                bedWood.receiveShadow = true;
                bedWood.layers.set(0);
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
                const zMat = new THREE.SpriteMaterial({ map: zTex, transparent: true, depthWrite: false, fog:false });

                const z1 = new THREE.Sprite(zMat);
                z1.position.set(-31, 2, -24);
                z1.scale.set(0.5, 0.5, 0.5);
                z1.material.rotation = Math.PI;
                

                const z2 = new THREE.Sprite(zMat);
                z2.position.set(-31.2, 2.2, -24.2);
                z2.scale.set(0.4, 0.4, 0.4);
                z2.material.rotation = Math.PI;
                

                const z3 = new THREE.Sprite(zMat);
                z3.position.set(-31.4, 2.4, -24.4);
                z3.scale.set(0.3, 0.3, 0.3);
                z3.material.rotation = Math.PI;


                ctx.scene.add(z1, z2, z3);
                guiSystem.updateSprites([z1, z2, z3]);

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

            if(bedDesk && bedDesk instanceof THREE.Mesh) {
                bedDesk.material = blackMaterial;
                bedDesk.castShadow = true;
                bedDesk.receiveShadow = true;
            }
            if( rotomBody && rotomBody instanceof THREE.Mesh) {
                rotomBody.material = new THREE.MeshBasicMaterial({
                    map: rotomTexture,
                })
            }
            if( rotomShine && rotomShine instanceof THREE.Mesh) {
                rotomShine.material = new THREE.MeshBasicMaterial({
                    color:"#7ac0cf"
                });
                rotomShine.layers.enable(ctx.state.postEffectState.bloom.layer);
            }
            if( phoneOrange && phoneOrange instanceof THREE.Mesh) {
                phoneOrange.material = orangeMaterial;
                phoneOrange.castShadow = true;
                phoneOrange.receiveShadow = true;
            }
            if( phoneBlack && phoneBlack instanceof THREE.Mesh) {
                phoneBlack.material = blackMaterial;
            }
            if( candlePurple && candlePurple instanceof THREE.Mesh) {
                candlePurple.material = purpleMaterial;
                candlePurple.castShadow = true;
                candlePurple.receiveShadow = true;
            }
            if(candleWhite && candleWhite instanceof THREE.Mesh) {
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


            if (desk && desk instanceof THREE.Mesh) {
                desk.material = new THREE.MeshToonMaterial({
                    //map: woodTexture,
                    color: "#785442",
                })
                desk.castShadow = true;
                desk.receiveShadow = true;
            }
            if (smallDesk && smallDesk instanceof THREE.Mesh) {
                smallDesk.material = new THREE.MeshToonMaterial({
                    //map: woodTexture,
                    color: "#785442",
                })
                smallDesk.castShadow = true;
                smallDesk.receiveShadow = true;
            }
            if (glass && glass instanceof THREE.Mesh) {
                glass.material = new THREE.MeshPhysicalMaterial({
                    color: "#a6c2ca",
                    transparent: true,
                    opacity: 0.5,
                });
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
                    map: leafTexture
                })
                plants.castShadow = true;
                plants.receiveShadow = true;
            }
            if (certificate && certificate instanceof THREE.Mesh) {
                certificate.material = new THREE.MeshBasicMaterial({
                    map: certificateTexture,
                })
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
                doraemon.material = new THREE.MeshBasicMaterial({
                    map: bookCover
                })
                doraemon.castShadow = true;
                doraemon.receiveShadow = true;
            }
            if (pikachu && pikachu instanceof THREE.Mesh) {
                pikachu.material = new THREE.MeshToonMaterial({
                    map: pikachuStatueTexture
                })
                pikachu.castShadow = true;
                pikachu.receiveShadow = true;
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
                cdInPlay.material = blackMaterial;
                // cdInPlay.castShadow = true;
                // cdInPlay.receiveShadow = true;
            }
            if (cdPlayer && cdPlayer instanceof THREE.Mesh) {
                cdPlayer.material = new THREE.MeshToonMaterial({
                    color: "#E78C62"
                })
                cdPlayer.castShadow = true;
                cdPlayer.receiveShadow = true;
            }

            const youtubeLogo = model.getObjectByName('logoYoutube');
            const linkedInLogo = model.getObjectByName('logoLinkedin');

            if (youtubeLogo && youtubeLogo instanceof THREE.Mesh) {
                youtubeLogo.material = new THREE.MeshBasicMaterial({ color: "#eb757b" });
                youtubeLogo.layers.enable(ctx.state.postEffectState.bloom.layer);
                youtubeLogo.userData.interactUrl = "https://www.youtube.com/@wenzezhang5595";
                youtubeLogo.userData.interactLabel = "Visit my YouTube";
                youtubeLogoMesh = youtubeLogo;
            }
            if (linkedInLogo && linkedInLogo instanceof THREE.Mesh) {
                linkedInLogo.material = new THREE.MeshBasicMaterial({ color: "#6da8e3" });
                linkedInLogo.layers.enable(ctx.state.postEffectState.bloom.layer);
                linkedInLogo.userData.interactUrl = "https://www.linkedin.com/in/wenze-zhang-7b5669237/";
                linkedInLogo.userData.interactLabel = "Visit my LinkedIn";
                linkedInLogoMesh = linkedInLogo;
            }


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
        update(dt: number) { },
        getinteractables() {
            console.log("pokeBallSystem interactables: ", [youtubeLogoMesh, linkedInLogoMesh]);
            return [youtubeLogoMesh, linkedInLogoMesh].filter((mesh): mesh is THREE.Mesh => mesh !== null);
        },

        dispose() { }
    }
}