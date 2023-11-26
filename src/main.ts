import "./style.css";
import van from "vanjs-core";
import { three3gine } from "./thr3engine";
import { MeshProps } from "./typings/three-types";
import { Test } from "./raw";
import { MathUtils } from "three";

const {
  Canvas,
  boxGeometry,
  meshBasicMaterial,
  mesh,
  meshToonMaterial,
  meshStandardMaterial,
  axesHelper,
  group,
  gridHelper,
  ambientLight,
  spotLight,
  pointLight,
  pointLightHelper,
  sphereGeometry,
  hemisphereLight,
  directionalLight,
} = three3gine;

const Cube = (props: MeshProps & { color?: string } = {}) => {
  const obj = mesh(
    { ...props },
    boxGeometry({ args: [1, 1, 1] }),
    meshStandardMaterial({
      color: props.color,
    })
  );

  // obj.render = (delta: any) => {
  //   obj.rotation.x = delta * 0.001;
  //   obj.rotation.y = delta * 0.001;
  // };

  return obj;
};

const Cube2 = (props: MeshProps = {}, ...children: any[]) => {
  const obj = mesh(
    props,
    boxGeometry(),
    meshBasicMaterial({
      color: "yellow",
    }),
    ...children
  );

  obj.render = (delta: any) => {
    // obj.rotation.x = delta * 0.001;
    // obj.rotation.y = delta * 0.001;
  };

  return obj;
};

const Sphere = () => {
  const obj = mesh(
    // { position: [0, 2, 0] },
    sphereGeometry({ args: [0.25, 16, 16] }),
    meshStandardMaterial({
      color: "indigo",
    })
  );

  const grouping = group(obj);

  for (let i = 0; i < 1; i += 0.08) {
    const sphere = obj.clone();

    // position the spheres on around a circle
    sphere.position.x = Math.cos(2 * Math.PI * i);
    sphere.position.y = Math.sin(2 * Math.PI * i);

    sphere.scale.multiplyScalar(0.01 + i);

    grouping.add(sphere);
  }

  grouping.scale.multiplyScalar(2);

  const radiansPerSecond = MathUtils.degToRad(30);

  grouping.render = (delta) => {
    grouping.rotation.z = -delta * 0.001 * radiansPerSecond;
  };

  return grouping;
};

van.add(
  document.getElementById("app")!,
  Canvas(
    //ambientLight({ args: [0x404040, 100.0] }),
    hemisphereLight({
      args: ["white", "darkslategray", 100],
    }),
    directionalLight({ args: ["white", 5], position: [3, 3, 3] }),

    Sphere(),
    // Cube2(
    //   { position: [0, -1, 0] },
    //   axesHelper({ args: [5] }),
    //   Cube({ position: [0, 1, 0], color: "blue" })
    // ),
    gridHelper({ args: [10, 50], rotation: [Math.PI / 2, 0, 0] }),
    axesHelper()
  )
);

//van.add(document.getElementById("app")!, Test().domElement);
