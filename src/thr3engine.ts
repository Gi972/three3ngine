import van from "vanjs-core";
import * as THREE from "three";
import {
  AmbientLightProps,
  AxesHelperProps,
  BoxGeometryProps,
  DirectionalLightProps,
  GridHelperProps,
  GroupProps,
  HemisphereLightProps,
  MeshBasicMaterialProps,
  MeshLambertMaterialProps,
  MeshProps,
  MeshStandardMaterialProps,
  MeshToonMaterialProps,
  PointLightHelperProps,
  PointLightProps,
  SphereGeometryProps,
  SpotLightHelperProps,
  SpotLightProps,
  ThreeElementsProps,
} from "./typings/three-types";
import { Renderer } from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTF, GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

const { div } = van.tags;

export const DEFAULT = "__default";
export const DEFAULTS = new Map();

export type AttachFnType = (parent: Instance, self: Instance) => () => void;
export type AttachType = string | AttachFnType;

export type ColorManagementRepresentation =
  | { enabled: boolean | never }
  | { legacyMode: boolean | never };

interface Catalogue {
  [name: string]: {
    new (...args: any): Instance;
  };
}

export const catalogue: Catalogue = {};

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
  | THREE.Material
  | THREE.Object3D
  | THREE.BufferGeometry;

export type Instance = BaseInstance & { [key: string]: any };

export type DiffSet = [
  key: string,
  value: unknown,
  isEvent: boolean,
  keys: string[]
][];

export const hasColorSpace = <
  T extends Renderer | THREE.Texture | object,
  P = T extends Renderer ? { outputColorSpace: string } : { colorSpace: string }
>(
  object: T
): object is T & P => "colorSpace" in object || "outputColorSpace" in object;

export const getColorManagement = (): ColorManagementRepresentation | null =>
  (catalogue as any).ColorManagement ?? null;

export function diffProps({ children, ...props }: ThreeElementsProps): DiffSet {
  const entries = Object.entries(props);
  const changes: [
    key: string,
    value: unknown,
    isEvent: boolean,
    keys: string[]
  ][] = [];

  entries.forEach(([key, value]) => {
    // Collect handlers and bail out
    if (/^on(Pointer|Click|DoubleClick|ContextMenu|Wheel)/.test(key))
      return changes.push([key, value, true, []]);
    let entries: string[] = [];
    changes.push([key, value, false, entries]);
  });

  return changes;
}

export function attachProps(instance: Instance, data: ThreeElementsProps = {}) {
  const changes = diffProps(data);

  for (let i = 0; i < changes.length; i++) {
    let [key, value, isEvent, keys] = changes[i];

    if (hasColorSpace(instance)) {
      const sRGBEncoding = 3001;
      const SRGBColorSpace = "srgb";
      const LinearSRGBColorSpace = "srgb-linear";

      if (key === "encoding") {
        key = "colorSpace";
        value = value === sRGBEncoding ? SRGBColorSpace : LinearSRGBColorSpace;
      } else if (key === "outputEncoding") {
        key = "outputColorSpace";
        value = value === sRGBEncoding ? SRGBColorSpace : LinearSRGBColorSpace;
      }
    }

    let currentInstance = instance;
    let targetProp = currentInstance[key];

    if (keys.length) {
      targetProp = keys.reduce((acc, key) => acc[key], instance);
      // If the target is atomic, it forces us to switch the root
      if (!(targetProp && targetProp.set)) {
        const [name, ...reverseEntries] = keys.reverse();
        currentInstance = reverseEntries
          .reverse()
          .reduce((acc, key) => acc[key], instance);
        key = name;
      }
    }

    if (value === DEFAULT + "remove") {
      if (currentInstance.constructor) {
        // create a blank slate of the instance and copy the particular parameter.
        let ctor = DEFAULTS.get(currentInstance.constructor);
        if (!ctor) {
          // @ts-ignore
          ctor = new currentInstance.constructor();
          DEFAULTS.set(currentInstance.constructor, ctor);
        }
        value = ctor[key];
      } else {
        // instance does not have constructor, just set it to 0
        value = 0;
      }
    }

    // tcheck les pointers
    if (
      targetProp &&
      targetProp.set &&
      (targetProp.copy || targetProp instanceof THREE.Layers)
    ) {
      // If value is an array
      if (Array.isArray(value)) {
        if (targetProp.fromArray) targetProp.fromArray(value);
        else targetProp.set(...value);
      }
      // If nothing else fits, just set the single value, ignore undefined
      // https://github.com/pmndrs/react-three-fiber/issues/274
      else if (value !== undefined) {
        const isColor = targetProp instanceof THREE.Color;
        // Allow setting array scalars
        if (!isColor && targetProp.setScalar) targetProp.setScalar(value);
        // Layers have no copy function, we must therefore copy the mask property
        else if (
          targetProp instanceof THREE.Layers &&
          value instanceof THREE.Layers
        )
          targetProp.mask = value.mask;
        // Otherwise just set ...
        else targetProp.set(value);
        // For versions of three which don't support THREE.ColorManagement,
        // Auto-convert sRGB colors
        // https://github.com/pmndrs/react-three-fiber/issues/344
        if (!getColorManagement() && isColor) targetProp.convertSRGBToLinear();
      }
      // Else, just overwrite the value
    } else {
      currentInstance[key] = value;
    }
  }
}

export function buildGraph(object: THREE.Object3D) {
  const data: ObjectMap = { nodes: {}, materials: {} };
  if (object) {
    object.traverse((obj: any) => {
      if (obj.name) data.nodes[obj.name] = obj;
      if (obj.material && !data.materials[obj.material.name])
        data.materials[obj.material.name] = obj.material;
    });
  }
  return data;
}

export type ObjectMap = {
  nodes: { [name: string]: THREE.Object3D };
  materials: { [name: string]: THREE.Material };
};

type Loaders = {
  [url: string]: GLTF;
};

type UseGLTFL = (url: string) => GLTF & ObjectMap;
type USEGLTFL = UseGLTFL & { preload: (url: string) => Promise<void> };

type Three3gine = {
  boxGeometry: (props?: BoxGeometryProps) => THREE.BoxGeometry;
  sphereGeometry: (props?: SphereGeometryProps) => THREE.SphereGeometry;
  meshBasicMaterial: (
    props?: MeshBasicMaterialProps
  ) => THREE.MeshBasicMaterial;

  meshLambertMaterial: (
    props?: MeshLambertMaterialProps
  ) => THREE.MeshLambertMaterial;
  meshToonMaterial: (props?: MeshToonMaterialProps) => THREE.MeshToonMaterial;
  meshStandardMaterial: (
    props?: MeshStandardMaterialProps
  ) => THREE.MeshStandardMaterial;
  perspectiveCamera: () => THREE.PerspectiveCamera;
  mesh: (
    ...props: (
      | MeshProps
      | THREE.BufferGeometry
      | THREE.Material
      | THREE.Mesh
      | THREE.Group
    )[]
  ) => THREE.Mesh | THREE.Group;

  ambientLight: (props?: AmbientLightProps) => THREE.AmbientLight;
  hemisphereLight: (props?: HemisphereLightProps) => THREE.HemisphereLight;
  spotLight: (props?: SpotLightProps) => THREE.SpotLight;
  spotLightHelper: (props?: SpotLightHelperProps) => THREE.SpotLightHelper;
  directionalLight: (props?: DirectionalLightProps) => THREE.DirectionalLight;
  pointLight: (props?: PointLightProps) => THREE.PointLight;
  pointLightHelper: (props?: PointLightHelperProps) => THREE.PointLightHelper;
  Camera: THREE.Camera;
  axesHelper: (props?: AxesHelperProps) => THREE.AxesHelper;
  gridHelper: (props?: GridHelperProps) => THREE.GridHelper;
  group: (
    ...args: (GroupProps | THREE.Object3D | MeshProps)[]
  ) => THREE.Group | THREE.Group<THREE.Object3DEventMap>;
  Controls: (object: THREE.Camera, domElement: HTMLElement) => OrbitControls;
  Scene: (objs: THREE.Object3D[]) => THREE.Scene;
  Canvas: (...props: THREE.Object3D[]) => HTMLDivElement;
  Renderer: (scene: THREE.Scene, camera: THREE.Camera) => THREE.WebGLRenderer;
  useGLTFL: USEGLTFL;
};

const useGLTFL: USEGLTFL = (url) => {
  const data = loaders[url];
  const loader = Object.assign(data, buildGraph(data.scene));
  return loader;
};

useGLTFL.preload = async (url: string) => {
  const loader = new GLTFLoader();
  try {
    loaders[url] = await loader.loadAsync(url);
  } catch (error) {
    throw new Error(`gltf loader ${url}, doesn't load`);
  }
};

const loaders: Loaders = {};

export const three3gine: Three3gine = {
  boxGeometry: (props?) => {
    const geometry = props?.args
      ? new THREE.BoxGeometry(...props.args)
      : new THREE.BoxGeometry();
    attachProps(geometry, props);
    return geometry;
  },
  sphereGeometry: (props?) => {
    const geometry = props?.args
      ? new THREE.SphereGeometry(...props.args)
      : new THREE.SphereGeometry();
    attachProps(geometry, props);
    return geometry;
  },
  meshBasicMaterial: (props?) => {
    const material = props?.args
      ? new THREE.MeshBasicMaterial(...props.args)
      : new THREE.MeshBasicMaterial();

    attachProps(material, props);
    return material;
  },
  meshStandardMaterial: (props?) => {
    const material = props?.args
      ? new THREE.MeshStandardMaterial(...props.args)
      : new THREE.MeshStandardMaterial();

    attachProps(material, props);
    return material;
  },
  meshLambertMaterial: (props?) => {
    const material = props?.args
      ? new THREE.MeshLambertMaterial(...props.args)
      : new THREE.MeshLambertMaterial();

    attachProps(material, props);
    return material;
  },
  meshToonMaterial: (props?) => {
    const material = props?.args
      ? new THREE.MeshToonMaterial(...props.args)
      : new THREE.MeshToonMaterial();
    attachProps(material, props);
    return material;
  },
  mesh: (...args) => {
    let props: MeshProps & { children?: any[] } = {};
    let geometry = new THREE.BufferGeometry();
    let materials: THREE.Material[] = [];

    args.forEach((item, index) => {
      if (item instanceof THREE.BufferGeometry) {
        geometry = item;
        return;
      }
      if (item instanceof THREE.Material) {
        materials.push(item);
        return;
      }
      if (
        index === 0 &&
        !(item instanceof THREE.Mesh || item instanceof THREE.Group)
      ) {
        props = item;
        return;
      }

      if (!props.children) {
        props.children = [];
      }

      props.children.push(item);
    });

    const mesh = new THREE.Mesh(geometry, ...materials);

    if (props?.children?.length) {
      const group = three3gine.group(props, mesh, props.children);
      return group;
    }

    attachProps(mesh, props);

    return mesh;
  },
  group: (...props) => {
    const group = new THREE.Group();

    props.flat().forEach((item) => {
      if (item instanceof THREE.Object3D) {
        group.add(item);
        return;
      }

      attachProps(group, item);
    });

    return group;
  },
  ambientLight: (props?: AmbientLightProps) => {
    return props?.args
      ? new THREE.AmbientLight(...props.args)
      : new THREE.AmbientLight();
  },
  hemisphereLight: (props) => {
    const light = props?.args
      ? new THREE.HemisphereLight(...props.args)
      : new THREE.HemisphereLight();
    attachProps(light, props);
    return light;
  },
  pointLight: (props) => {
    const light = props?.args
      ? new THREE.PointLight(...props.args)
      : new THREE.PointLight(0xff0000);
    attachProps(light, props);

    return light;
  },
  pointLightHelper: (props) => {
    const lightHelper = props?.args
      ? new THREE.PointLightHelper(...props.args)
      : new THREE.PointLightHelper(props?.children);
    attachProps(lightHelper, props);
    return lightHelper;
  },
  spotLight: (props) => {
    const light = props?.args
      ? new THREE.SpotLight(...props.args)
      : new THREE.SpotLight();
    attachProps(light, props);
    return light;
  },
  spotLightHelper(props) {
    const spotligtr = props?.args
      ? new THREE.SpotLightHelper(...props.args)
      : new THREE.SpotLightHelper(props?.children);

    return spotligtr;
  },
  directionalLight: (props) => {
    const light = props?.args
      ? new THREE.DirectionalLight(...props.args)
      : new THREE.DirectionalLight();

    attachProps(light, props);

    return light;
  },
  axesHelper: (props?: AxesHelperProps) => {
    return props?.args
      ? new THREE.AxesHelper(...props.args)
      : new THREE.AxesHelper();
  },
  gridHelper: (props?: GridHelperProps) => {
    const grid = props?.args
      ? new THREE.GridHelper(...props.args)
      : new THREE.GridHelper();

    attachProps(grid, props);
    return grid;
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
  useGLTFL: useGLTFL,
  Controls: (object, domElement) => new OrbitControls(object, domElement),
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
    camera.position.set(0, 0, 10);
    const scene = three3gine.Scene(objects);
    const render = three3gine.Renderer(scene, camera);
    const controls = three3gine.Controls(camera, render.domElement);

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

      controls.update();
      render.render(scene, camera);
    }

    animate(0);

    return div("Hello Thr3engine", render.domElement);
  },
};
