import van from "vanjs-core";
import * as THREE from "three";
import {
  BoxGeometryProps,
  MeshBasicMaterialProps,
  MeshProps,
  MeshToonMaterialProps,
} from "./typings/three-types";
// import {
//   BoxGeometryProps,
//   Camera,
//   MeshBasicMaterialProps,
//   MeshProps,
//   Object3DProps,
// } from "./typings/three-types";

const { div } = van.tags;

export type BaseInstance =
  | (Omit<
      THREE.Object3D,
      "children" | "attach" | "add" | "remove" | "raycast"
    > & {
      children: Instance[];
      remove: (...object: Instance[]) => Instance;
      add: (...object: Instance[]) => Instance;
      raycast?: (
        raycaster: THREE.Raycaster,
        intersects: THREE.Intersection[]
      ) => void;
    })
  | THREE.Material;

export type Instance = BaseInstance & { [key: string]: any };

export function attachProps() {}

type Three3gine = {
  boxGeometry: (props?: BoxGeometryProps) => THREE.BoxGeometry;
  meshBasicMaterial: (
    props?: MeshBasicMaterialProps
  ) => THREE.MeshBasicMaterial;
  meshToonMaterial: (props?: MeshToonMaterialProps) => THREE.MeshToonMaterial;
  perspectiveCamera: () => THREE.PerspectiveCamera;
  mesh: (
    ...props: (MeshProps | THREE.BufferGeometry | THREE.Material)[]
  ) => THREE.Mesh;
  Camera: THREE.Camera;
  Scene: (objs: THREE.Object3D[]) => THREE.Scene;
  Canvas: (...props: THREE.Object3D[]) => HTMLDivElement;
  Renderer: (scene: THREE.Scene, camera: THREE.Camera) => THREE.WebGLRenderer;
};

export const three3gine: Three3gine = {
  boxGeometry: (props?) => {
    const geometry = props?.args
      ? new THREE.BoxGeometry(...props.args)
      : new THREE.BoxGeometry();
    //attachProps(material, props);
    return geometry;
  },
  meshBasicMaterial: (props?) => {
    const material = props?.args
      ? new THREE.MeshBasicMaterial(...props.args)
      : new THREE.MeshBasicMaterial();
    //attachProps(material, props);
    return material;
  },
  meshToonMaterial: (props?) => {
    const material = props?.args
      ? new THREE.MeshToonMaterial(...props.args)
      : new THREE.MeshToonMaterial();
    //attachProps(material, props);
    return material;
  },
  mesh: (...args) => {
    let props: MeshProps = {};
    let geometry = new THREE.BufferGeometry();
    let materials: THREE.Material[] = [];

    args.forEach((item) => {
      if (item instanceof THREE.BufferGeometry) {
        geometry = item;
        return;
      }
      if (item instanceof THREE.Material) {
        materials.push(item);
        return;
      }
      props = item;
    });

    const mesh = new THREE.Mesh(geometry, ...materials);
    // if (props.children) {
    //   const group = three3gine.group(props, mesh, props.children);
    //   return group;
    // }
    //attachProps(mesh, props);

    mesh;

    return mesh;
  },

  perspectiveCamera: () => {
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.z = 5;
    return camera;
  },
  Camera: new THREE.PerspectiveCamera(),
  Scene: (objs) => {
    const scene = new THREE.Scene();
    scene.add(...objs);
    return scene;
  },
  Renderer: (scene, camera) => {
    const render = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    render.setSize(window.innerWidth, window.innerHeight);
    render.setPixelRatio(Math.min(Math.max(1, window.devicePixelRatio), 2));
    render.toneMapping = THREE.ACESFilmicToneMapping;
    render.outputColorSpace = THREE.SRGBColorSpace;
    render.render(scene, camera);
    return render;
  },
  Canvas: (...objects) => {
    const camera = (three3gine.Camera = three3gine.perspectiveCamera());
    const scene = three3gine.Scene(objects);
    const render = three3gine.Renderer(scene, camera);

    let width = 0;
    let height = 0;

    function resize() {
      width = window.innerWidth;
      height = window.innerHeight;
      camera.aspect = width / height;
      const target = new THREE.Vector3(0, 0, 0);
      const distance = camera.position.distanceTo(target);
      const fov = (camera.fov * Math.PI) / 180;
      const viewportHeight = 2 * Math.tan(fov / 2) * distance;
      const viewportWidth = viewportHeight * (width / height);
      camera.updateProjectionMatrix();
      render.setSize(width, height);
      scene.traverse((obj) => {
        if (obj.onResize)
          obj.onResize(viewportWidth, viewportHeight, camera.aspect);
      });
    }

    window.addEventListener("resize", resize);
    resize();

    function animate(t: number) {
      requestAnimationFrame(animate);
      scene.traverse((obj) => {
        if (obj.render) obj.render(t);
      });
      render.render(scene, camera);
    }

    animate(0);

    return div("Hello Thr3engine", render.domElement);
  },
};
