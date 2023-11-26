import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

export function Test() {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  //document.body.appendChild(renderer.domElement);

  const geometry = new THREE.BoxGeometry(1, 1, 1);
  const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
  const cube = new THREE.Mesh(geometry, material);
  scene.add(cube);

  const light = new THREE.AmbientLight(0x404040); // soft white light
  scene.add(light);

  const pointLight = new THREE.PointLight(0xff0000, 1, 100);
  pointLight.position.set(0, 1, 10);

  const gridHelper = new THREE.GridHelper(400, 40, 0x0000ff, 0x808080);
  const pointLightHelper = new THREE.PointLightHelper(pointLight, 1);
  pointLightHelper.position.x = 2;

  scene.add(pointLight);
  scene.add(pointLightHelper);
  scene.add(gridHelper);

  camera.position.z = 5;

  const controls = new OrbitControls(camera, renderer.domElement);

  function animate() {
    requestAnimationFrame(animate);

    cube.rotation.x += 0.01;
    cube.rotation.y += 0.01;
    controls.update();

    renderer.render(scene, camera);
  }

  animate();
  return renderer;
}
