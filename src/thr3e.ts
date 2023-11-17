import * as THREE from 'three';
import {
  EventHandlers,
  MeshProps,
  PerspectiveCameraProps,
  OrthographicCameraProps,
  MeshBasicMaterialProps,
  MeshStandardMaterialProps,
  MeshToonMaterialProps,
  AmbientLightProps,
  PointLightProps,
  GridHelperProps,
  MeshPhongMaterialProps,
  ThreeElements,
  AxesHelperProps,
} from './three-types';
import { OrbitControls } from 'three-orbitcontrols-ts';
import van from 'vanjs-core';



const { div } = van.tags;
export type BaseInstance =
  | (Omit<
      THREE.Object3D,
      'children' | 'attach' | 'add' | 'remove' | 'raycast'
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

export type Renderer = {
  render: (scene: THREE.Scene, camera: THREE.Camera) => any;
};

export const hasColorSpace = <
  T extends Renderer | THREE.Texture | object,
  P = T extends Renderer ? { outputColorSpace: string } : { colorSpace: string }
>(
  object: T
): object is T & P => 'colorSpace' in object || 'outputColorSpace' in object;

export type Instance = BaseInstance & { [key: string]: any };

interface Catalogue {
  [name: string]: {
    new (...args: any): Instance;
  };
}
const __DEV__ =
  typeof process !== 'undefined' && process.env.NODE_ENV !== 'production';

export const catalogue: Catalogue = {};

type ClassConstructor = { new (): void };
export type ColorManagementRepresentation =
  | { enabled: boolean | never }
  | { legacyMode: boolean | never };

type Meshp = THREE.Mesh<
  THREE.BufferGeometry,
  THREE.MeshBasicMaterial,
  THREE.Object3DEventMap
> &
  EventHandlers & { render?: (delta: number) => void };

type Three3gine = {
  renderer: any;
  scene: any;
  perspectiveCamera: (
    props?: PerspectiveCameraProps
  ) => THREE.PerspectiveCamera;
  orthographicCamera: (
    props?: OrthographicCameraProps
  ) => THREE.OrthographicCamera;
  boxGeometry: any;
  meshBasicMaterial: (
    props?: MeshBasicMaterialProps
  ) => THREE.MeshBasicMaterial;
  meshStandardMaterial: (
    props?: MeshStandardMaterialProps
  ) => THREE.MeshStandardMaterial;
  meshPhongMaterial: (
    props?: MeshPhongMaterialProps
  ) => THREE.MeshPhongMaterial;
  meshToonMaterial: (props?: MeshToonMaterialProps) => THREE.MeshToonMaterial;
  ambientLight: (props?: AmbientLightProps) => THREE.AmbientLight;
  pointLight: (props?: PointLightProps) => THREE.PointLight;
  mesh: (
    ...props: (MeshProps | THREE.BufferGeometry | THREE.Material)[]
  ) => Meshp;
  //| THREE.Group<THREE.Object3DEventMap>;


  group: (
    ...args: (
      | THREE.Mesh
      | Meshp
      | Meshp[]
      | MeshProps
      | AxesHelperProps
      | THREE.AxesHelper
    )[]
  ) => THREE.Group;
  gridHelper: (props?: GridHelperProps) => THREE.GridHelper;
  axesHelper: (
    props?: AxesHelperProps
  ) => THREE.AxesHelper | THREE.Group<THREE.Object3DEventMap>;
  Canvas: (
    ...props: (
      | THREE.AmbientLight
      | THREE.PointLight
      | Meshp
      | THREE.Group
      | THREE.GridHelper
      | THREE.AxesHelper
    )[]
  ) => HTMLDivElement;
};

export const getColorManagement = (): ColorManagementRepresentation | null =>
  (catalogue as any).ColorManagement ?? null;

export const DEFAULT = '__default';
export const DEFAULTS = new Map();

export type AttachFnType = (parent: Instance, self: Instance) => () => void;
export type AttachType = string | AttachFnType;

type ThreeElementsProps = ThreeElements[keyof ThreeElements];

export type InstanceProps =
  | ({
      [key: string]: unknown;
    } & {
      args?: any[];
      object?: object;
      visible?: boolean;
      dispose?: null;
      attach?: AttachType;
    })
  | ThreeElementsProps;

export type DiffSet = [
  key: string,
  value: unknown,
  isEvent: boolean,
  keys: string[]
][];

export type EquConfig = {
  /** Compare arrays by reference equality a === b (default), or by shallow equality */
  arrays?: 'reference' | 'shallow';
  /** Compare objects by reference equality a === b (default), or by shallow equality */
  objects?: 'reference' | 'shallow';
  /** If true the keys in both a and b must match 1:1 (default), if false a's keys must intersect b's */
  strict?: boolean;
};

export const is = {
  obj: (a: any) => a === Object(a) && !is.arr(a) && typeof a !== 'function',
  fun: (a: any): a is Function => typeof a === 'function',
  str: (a: any): a is string => typeof a === 'string',
  num: (a: any): a is number => typeof a === 'number',
  boo: (a: any): a is boolean => typeof a === 'boolean',
  und: (a: any) => a === void 0,
  arr: (a: any) => Array.isArray(a),
  equ(
    a: any,
    b: any,
    { arrays = 'shallow', objects = 'reference', strict = true }: EquConfig = {}
  ) {
    // Wrong type or one of the two undefined, doesn't match
    if (typeof a !== typeof b || !!a !== !!b) return false;
    // Atomic, just compare a against b
    if (is.str(a) || is.num(a)) return a === b;
    const isObj = is.obj(a);
    if (isObj && objects === 'reference') return a === b;
    const isArr = is.arr(a);
    if (isArr && arrays === 'reference') return a === b;
    // Array or Object, shallow compare first to see if it's a match
    if ((isArr || isObj) && a === b) return true;
    // Last resort, go through keys
    let i;
    // Check if a has all the keys of b
    for (i in a) if (!(i in b)) return false;
    // Check if values between keys match
    if (isObj && arrays === 'shallow' && objects === 'shallow') {
      for (i in strict ? b : a)
        if (!is.equ(a[i], b[i], { strict, objects: 'reference' })) return false;
    } else {
      for (i in strict ? b : a) if (a[i] !== b[i]) return false;
    }
    // If i is undefined
    if (is.und(i)) {
      // If both arrays are empty we consider them equal
      if (isArr && a.length === 0 && b.length === 0) return true;
      // If both objects are empty we consider them equal
      if (isObj && Object.keys(a).length === 0 && Object.keys(b).length === 0)
        return true;
      // Otherwise match them by value
      if (a !== b) return false;
    }
    return true;
  },
};

export function diffProps({ children, ...props }: InstanceProps): DiffSet {
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
    // Split dashed props
    let entries: string[] = [];
    if (key.includes('-')) entries = key.split('-');
    changes.push([key, value, false, entries]);

  });

  return changes;
}

export function attachProps(instance: Instance, data: InstanceProps = {}) {
  
  const changes = diffProps(data);

  for (let i = 0; i < changes.length; i++) {
    let [key, value, isEvent, keys] = changes[i];

    if (hasColorSpace(instance)) {
      const sRGBEncoding = 3001;
      const SRGBColorSpace = 'srgb';
      const LinearSRGBColorSpace = 'srgb-linear';

      if (key === 'encoding') {
        key = 'colorSpace';
        value = value === sRGBEncoding ? SRGBColorSpace : LinearSRGBColorSpace;
      } else if (key === 'outputEncoding') {
        key = 'outputColorSpace';
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

    if (value === DEFAULT + 'remove') {
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
      } else if (
        targetProp.copy &&
        value &&
        (value as ClassConstructor).constructor &&
        // Some environments may break strict identity checks by duplicating versions of three.js.
        // Loosen to unminified names, ignoring descendents.
        // https://github.com/pmndrs/react-three-fiber/issues/2856
        // TODO: fix upstream and remove in v9
        (__DEV__
          ? targetProp.constructor.name ===
            (value as ClassConstructor).constructor.name
          : targetProp.constructor === (value as ClassConstructor).constructor)
      ) {
        targetProp.copy(value);
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

      // Auto-convert sRGB textures, for now ...
      // https://github.com/pmndrs/react-three-fiber/issues/344
      if (
        currentInstance[key] instanceof THREE.Texture &&
        // sRGB textures must be RGBA8 since r137 https://github.com/mrdoob/three.js/pull/23129
        currentInstance[key].format === THREE.RGBAFormat &&
        currentInstance[key].type === THREE.UnsignedByteType
      ) {
        const texture = currentInstance[key] as THREE.Texture;
      }
    }
  }
}

export const thr3e: Three3gine = {
  renderer: (scene:any, camera:any) => {
    const render = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    render.setSize(window.innerWidth, window.innerHeight);
    render.setPixelRatio(Math.min(Math.max(1, window.devicePixelRatio), 2));

    render.toneMapping = THREE.ACESFilmicToneMapping;
    render.outputColorSpace = THREE.SRGBColorSpace;

    render.render(scene, camera);

    return render;
  },
  scene: (arg: any[]) => {
    const scene = new THREE.Scene();

    arg.forEach((item) => {
      scene.add(item);
    });

    return scene;
  },
  perspectiveCamera: (props) => {
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.z = 5;
    return camera;
  },
  orthographicCamera: (props) => {
    const camera = new THREE.OrthographicCamera(
      window.innerWidth / -2,
      window.innerWidth / 2,
      window.innerHeight / 2,
      window.innerHeight / -2,
      1,
      1000
    );

    // attachProps(camera, props);
    return camera;
  },
  boxGeometry: (props:any) => new THREE.BoxGeometry(props),
  axesHelper: (props?) => {
    const axesHelper = props?.args
      ? new THREE.AxesHelper(...props?.args)
      : new THREE.AxesHelper();

    if (props?.children) {
      const group = thr3e.group(props, axesHelper, props.children);
      return group;
    }

    attachProps(axesHelper, props);

    return axesHelper;
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
  meshToonMaterial: (props?) => {
    const material = props?.args
      ? new THREE.MeshToonMaterial(...props.args)
      : new THREE.MeshToonMaterial();
    attachProps(material, props);
    return material;
  },
  meshPhongMaterial: (props?) => {
    const material = props?.args
      ? new THREE.MeshPhongMaterial(...props.args)
      : new THREE.MeshPhongMaterial();
    attachProps(material, props);
    return material;
  },
  mesh: (...args) => {
  
    let props: MeshProps = {};
    let geometry = new THREE.BufferGeometry();
    let materials: any[] = [];

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

    if (props.children) {
      const group = thr3e.group(props, mesh, props.children);
      return group;
    }

    attachProps(mesh, props);

    return mesh;
  },

  ambientLight: (props) => {
    const ambientLight = props?.args
      ? new THREE.AmbientLight(...props.args)
      : new THREE.AmbientLight();
    attachProps(ambientLight, props);
    return ambientLight;
  },
  pointLight: (props?) => {
    const pointLight = props?.args
      ? new THREE.PointLight(...props.args)
      : new THREE.PointLight();
    attachProps(pointLight, props);
    return pointLight;
  },
  // cameraControls :()=>{
  //  // return new CameraControls( camera, renderer.domElement );
  // },
  gridHelper: (props) => {
    const gridHelper = props?.args
      ? new THREE.GridHelper(...props.args)
      : new THREE.GridHelper();
    attachProps(gridHelper, props);
    return gridHelper;
  },
  group: (...arg) => {
    const group = new THREE.Group();

    arg.flat().forEach((item) => {
      if (item instanceof THREE.Mesh) {
        group.add(item);
        return;
      }

      if (item instanceof THREE.AxesHelper) {
        group.add(item);
        return;
      }

      attachProps(group, item);
    });

    return group;
  },
  Canvas: (...objects) => {
    const camera = thr3e.perspectiveCamera({ position: [0, 0, 5] });
    const Scene = thr3e.scene(objects);
    const Render = thr3e.renderer(Scene, camera);

    let width = 0;
    let height = 0;
    let intersects: any[] = [];
    let hovered :any= {};
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

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
      Render.setSize(width, height);
      Scene.traverse((obj:any) => {
        if (obj.onResize)
          obj.onResize(viewportWidth, viewportHeight, camera.aspect);
      });
    }

    window.addEventListener('resize', resize);
    resize();

    window.addEventListener('pointermove', (e) => {
      mouse.set((e.clientX / width) * 2 - 1, -(e.clientY / height) * 2 + 1);
      raycaster.setFromCamera(mouse, camera);
      intersects = raycaster.intersectObjects(Scene.children, true);

      // If a previously hovered item is not among the hits we must call onPointerOut
      Object.keys(hovered).forEach((key) => {
        const hit = intersects.find((hit) => hit.object.uuid === key);
        if (hit === undefined) {
          const hoveredItem = hovered[key];
          if (hoveredItem.object.onPointerOver)
            hoveredItem.object.onPointerOut(hoveredItem);
          delete hovered[key];
        }
      });

      intersects.forEach((hit:any) => {
        // If a hit has not been flagged as hovered we must call onPointerOver
        if (!hovered[hit.object.uuid]) {
          hovered[hit.object.uuid] = hit;
          if (hit.object.onPointerOver) hit.object.onPointerOver(hit);
        }
        // Call onPointerMove
        if (hit.object.onPointerMove) hit.object.onPointerMove(hit);
      });
    });

    new OrbitControls(camera, thr3e.renderer.domElement);

    function animate(t:any) {
      requestAnimationFrame(animate);
      Scene.traverse((obj:any) => {
        if (obj.render) obj.render(t);
      });
      Render.render(Scene, camera);
    }

    animate(0);

    return div(Render.domElement);
  },
};
