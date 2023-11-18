import "./style.css";
import van from "vanjs-core";
import { three3gine } from "./thr3engine";
import { MeshProps } from "./typings/three-types";

const { Canvas, boxGeometry, meshBasicMaterial, mesh, meshToonMaterial } =
  three3gine;

const Cube = (props: MeshProps = {}) => {
  const obj = mesh(
    { position: [0, 3, 0] },
    boxGeometry(),
    meshBasicMaterial({
      color: "orange",
    }),
    meshToonMaterial()
  );

  obj.render = (delta: any) => {
    obj.rotation.x = delta * 0.001;
    obj.rotation.y = delta * 0.001;
  };

  return obj;
};

van.add(document.getElementById("app")!, Canvas(Cube()));
