import "./style.css";
import van from "vanjs-core";
import { three3gine } from "./thr3engine";
import { MeshProps } from "./typings/three-types";

const {
  Canvas,
  boxGeometry,
  meshBasicMaterial,
  mesh,
  meshToonMaterial,
  axesHelper,
  group,
} = three3gine;

const Cube = (props: MeshProps & { color?: string } = {}) => {
  const obj = mesh(
    { ...props },
    boxGeometry(),
    meshBasicMaterial({
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
    obj.rotation.x = delta * 0.001;
    obj.rotation.y = delta * 0.001;
  };

  return obj;
};

van.add(
  document.getElementById("app")!,
  Canvas(
    //Cube({ position: [0, 1, 0] }),
    Cube2(
      { position: [0, 2, 0] },
      axesHelper({ args: [5] }),
      Cube({ position: [0, 1, 0], color: "blue" })
    )
    // group(
    //   { position: [2, 2, 0] },
    //   Cube({ position: [-1, 1, 0] }),
    //   Cube({ position: [1, 1, 0], children: Cube({ position: [1, -1, 0] }) })
    // ),
    // axesHelper()
  )
);
