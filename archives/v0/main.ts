import './style.css'
import van from 'vanjs-core';
import { thr3e } from './thr3e';
import { MeshProps } from './three-types';
import * as THREE from 'three';

const {
  mesh,
  boxGeometry,
  meshStandardMaterial,
  meshBasicMaterial,
  meshToonMaterial,
  meshPhongMaterial,
  ambientLight,
  group,
  pointLight,
  Canvas,
  gridHelper,
  axesHelper,
} = thr3e;

const hover = van.state(false);

const Cube = (props: MeshProps = {}) => {
  const obj = mesh(
    props,
    boxGeometry(),
    meshStandardMaterial({
      color: 'orange',
    })
  );

  obj.render = (delta: any) => {
    obj.rotation.x = delta * 0.001;
    obj.rotation.y = delta * 0.001;
  };

  return obj;
};

const Cube2 = (props: MeshProps) => {
  const obj = mesh(
    boxGeometry(),
    meshBasicMaterial({
      color: new THREE.Color('red').convertSRGBToLinear(),
    }),
    props
  );

  obj.onPointerOver = () => {
    hover.val = true;
  };
  obj.onPointerOut = () => {
    hover.val = false;
  };

  return obj;
};

const Cube3 = (props: MeshProps) => {
  const obj = mesh(
    props,
    boxGeometry(),
    meshToonMaterial({
      color: new THREE.Color(0x049ef4),
    })
  );

  return obj;
};

const Cube4 = (props: MeshProps) => {
  const obj = mesh(
    props,
    boxGeometry(),
    meshPhongMaterial({
      color: 'green',
    })
  );

  const grolb = axesHelper({
    args: [2],
    position: [-3, 0, 0],
    children: obj,
  });

  return grolb;
};

const GroupCube = (props: MeshProps = {}) => {
  const c1 = Cube3({ position: [1, 0, 0] });
  const c3 = Cube({ position: [-1, 0, 0] });

  const groupc = group(props,c1, c3 );
  return groupc;
};

const Box = Cube({
  position: [1, 0, 0],
  children: [Cube2({ position: [1, 0, 0] })],
});
const Box2 = Cube2({ position: [0, 0, 0] });
const Box3 = Cube3({ position: [-1, 0, 0] });
const Box4 = Cube4({ position: [0, 0, 0] });

const AmbientLight = ambientLight({ intensity: 4 });
const PointLight = pointLight({ position: [-1, 0, 0] });

van.add(
  document.getElementById('app')!,
  Canvas(
    AmbientLight,
    PointLight,
    Box,
    Box2,
    Box3,
    Box4,
    GroupCube({
      position: [0, 2, 0],
    }),
    gridHelper({
      rotation: [Math.PI / 2, 0, 0],
      args: [10, 50],
    }),
    gridHelper({
      args: [10, 50],
    }),
    axesHelper({ args: [2] })
  )
);
