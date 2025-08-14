import { useEffect } from "react";
import GUI from "lil-gui";
import * as THREE from "three";
// import gsap from "gsap";

export default function MyGui({
  meshes,
  materials,
  lights,
}: {
  meshes?: THREE.Mesh[];
  materials?: THREE.MeshStandardMaterial[];
  lights?: THREE.Light[];
}) {
  useEffect(() => {
    console.log("lights to GUI: ", lights)

    // Option 1: Attach to document.body explicitly.
    const gui = new GUI({ container: document.body });
    gui.close();
    const displayGui = (key: KeyboardEvent) => {
      if (key.key === "g") {
        gui.show(gui._hidden);
      }
    };
    window.addEventListener("keydown", displayGui);
    // Position the GUI using CSS.
    gui.domElement.style.position = "fixed";
    gui.domElement.style.bottom = "10px";
    gui.domElement.style.right = "10px";
    gui.domElement.style.zIndex = "1000"; // Ensure it stays on top.

    //mesh controls
    if (meshes) {
      meshes.map((mesh) => {
        const meshTweak = gui.addFolder(`${mesh.name}`);
        meshTweak.close();
        meshTweak
          .add(mesh.position, "y", -3, 3, 0.01)
          .name(`${mesh.name} position Y`);
        meshTweak.add(mesh, "visible").name(`${mesh.name} visible`);
        // const controlObj = {
        //   subdivision: 1,
        //   spin: () => {
        //     gsap.to(mesh.rotation, {
        //       y: mesh.rotation.y + Math.PI * 2,
        //       duration: 3,
        //     });
        //   },
        // };
        // meshTweak.add(controlObj, "spin");
      });
    }

    //material controls
    if (materials) {
      const materialTweak = gui.addFolder("material");
      materials.map((material) => {
        materialTweak.add(material, "wireframe");
        // materialTweak.addColor(DebugColorObj, "color").onChange(() => {
        //   material.color.set(DebugColorObj.color);
        // });
        materialTweak.add(material, "roughness", 0, 1, 0.02);
        materialTweak.add(material, "metalness", 0, 1, 0.02);
      });
    }

    //light controls
    if (lights) {
        console.log("length of lights: ", lights.length)
      const lightTweaks = gui.addFolder("lights");
      lights.map((light) => {
        console.log(light)
        const lightColor = {
          color: light.color,
        };
        const lightTweak = lightTweaks.addFolder(`${light.name}`);
        lightTweak.close();
        lightTweak.add(light, "intensity", 0, 10, 0.02);
        lightTweak.addColor(lightColor, "color").onChange(() => {
          light.color.set(lightColor.color);
        });
        if (light.name === "hemisphere") {
          const typedLight = light as THREE.HemisphereLight;
          const groundColor = {
            groundColor: typedLight.groundColor,
          };
          lightTweak.addColor(groundColor, "groundColor").onChange(() => {
            typedLight.groundColor.set(groundColor.groundColor);
            light = typedLight;
          });
        }
        lightTweak.add(light.position, "x", -5, 5, 1);
        lightTweak.add(light.position, "y", -5, 5, 1);
        lightTweak.add(light.position, "z", -5, 5, 1);
        if(light.name === 'point'){
          const typedLight = light as THREE.PointLight;
          const pointLightControl = {
            distance: typedLight.distance,
            decay: typedLight.decay
          }
          lightTweak.add(pointLightControl, 'distance', 0, 10, 0.5).onChange(()=>{
            typedLight.distance = pointLightControl.distance;
            light = typedLight;
          })
          lightTweak.add(pointLightControl, 'decay', 0, 2, 0.1).onChange(()=>{
            typedLight.decay = pointLightControl.decay;
            light = typedLight;
          })
        }
        if(light.name === 'rect'){
          const typedLight = light as THREE.RectAreaLight;
          const rectLightControl = {
            width: typedLight.width,
            height: typedLight.height
          }
          lightTweak.add(rectLightControl, 'width', 0, 10, 0.1).onChange(()=>{
            typedLight.width = rectLightControl.width;
            light = typedLight;
          })
          lightTweak.add(rectLightControl, 'height', 0, 10, 0.1).onChange(()=>{
            typedLight.height = rectLightControl.height;
            light = typedLight;
          })
        }
      });
    }
    // Cleanup on unmount.
    return () => {
      gui.destroy();
      window.removeEventListener("keydown", displayGui);
    };
  }, [meshes, materials, lights]);

  return null; // Or return your scene/container component
}
