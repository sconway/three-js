import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import * as TWEEN from '@tweenjs/tween.js'

let camera;
let controls;
let treeGroup = new THREE.Group()
let clock = new THREE.Clock()
let renderer;
const canvas = document.querySelector('canvas.webgl')
const scene = new THREE.Scene()
const count = 50;
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}
const xAxis = new THREE.Vector3(1, 0, 0);
const zAxis = new THREE.Vector3(0, 0, 1);
const emptyVertex = new THREE.Vector3();
const textureLoader = new THREE.TextureLoader();

// Tree material
const treeMatcapTexture = textureLoader.load("./media/images/matcap1.png");
// encode the texture in sRGB
treeMatcapTexture.colorSpace = THREE.SRGBColorSpace
const material = new THREE.MeshMatcapMaterial();
material.matcap = treeMatcapTexture;

const getRandomBetween = (min, max) => Math.random() * (max - min) + min

/**
* obj - your object (THREE.Object3D or derived)
* point - the point of rotation (THREE.Vector3)
* axis - the axis of rotation (normalized THREE.Vector3)
* theta - radian value of rotation
* pointIsWorld - boolean indicating the point is in world coordinates (default = false)
*/
const rotateAboutPoint = (obj, point, axis, theta, pointIsWorld) => {
    pointIsWorld = (pointIsWorld === undefined)? false : pointIsWorld;

    if (pointIsWorld){
        obj.parent.localToWorld(obj.position); // compensate for world coordinate
    }

    obj.position.sub(point); // remove the offset
    obj.position.applyAxisAngle(axis, theta); // rotate the POSITION
    obj.position.add(point); // re-add the offset

    if (pointIsWorld){
        obj.parent.worldToLocal(obj.position); // undo world coordinates compensation
    }

    obj.rotateOnAxis(axis, theta); // rotate the OBJECT
}

const addTree = (size, position, maxHeight = 1, currentHeight = 1) => {
    // Quit when we are at the max height
    if (currentHeight > maxHeight) return;
    // Object values
    const {width = 3, depth = 3, height = 10, segments = 2} = size;
    const {x: posX = 0, y: posY = 0, z: posZ = 0} = position;

    const isHorizontal = currentHeight % 2 === 0;

    // Object
    const geometry = new THREE.BoxGeometry( width, height, depth, segments ); 
    const mesh = new THREE.Mesh(geometry, material);
    mesh.scale.y = 0;
    mesh.position.set(posX, posY, posZ)

    const rotationAxis = Math.random() < 0.5 ? xAxis : zAxis;
    const rotationAngle = Math.random() < 0.5 ? Math.PI * 0.5 : Math.PI * -0.5;

    // Compute next values
    const nextPosition = {
        x: rotationAxis.x === 1 || !isHorizontal ? posX : rotationAngle > 0 ? posX + height - width : posX - height + width,
        y: isHorizontal ? posY + height : posY,
        z: rotationAxis.z === 1 || !isHorizontal ? posZ : rotationAngle > 0 ? posZ - height + width : posZ + height - width
    }

    if (isHorizontal) {
        const mesh2 = new THREE.Mesh(geometry, material);
        mesh2.scale.y = 0;
        mesh2.position.set(posX, posY, posZ);

        // const rotationAxis2 = rotationAxis.x === 1 ? zAxis : xAxis;
        const rotationAngle2 = rotationAngle * -1;

        // Rotate first object
        rotateAboutPoint(mesh, new THREE.Vector3(posX, posY + (height/2) - (width/2), posZ), rotationAxis, rotationAngle)
        rotateAboutPoint(mesh2, new THREE.Vector3(posX, posY + (height/2) - (width/2), posZ), rotationAxis, rotationAngle2)

        // Compute next values
        const nextPosition2 = {
            x: rotationAxis.x === 1 || !isHorizontal ? posX : rotationAngle2 > 0 ? posX + height - width : posX - height + width,
            y: isHorizontal ? posY + height : posY,
            z: rotationAxis.z === 1 || !isHorizontal ? posZ : rotationAngle2 > 0 ? posZ - height + width : posZ + height - width
        }

        new TWEEN.Tween(mesh.scale)
            .to({ y: 1 }, 1000)
            .easing(TWEEN.Easing.Circular.Out)
            .onUpdate(() => {
                renderer.render( scene, camera );
            })
            .onComplete(() => {
                addTree(
                    {width: 3, depth: 3, height: height},
                    nextPosition,
                    maxHeight,
                    currentHeight + 1,
                );
            })
            .start()

        new TWEEN.Tween(mesh2.scale)
            .to({ y: 1 }, 1000)
            .easing(TWEEN.Easing.Circular.Out)
            .onUpdate(() => {
                renderer.render( scene, camera );
            })
            .onComplete(() => {
                addTree(
                    {width: 3, depth: 3, height: height},
                    nextPosition2,
                    maxHeight,
                    currentHeight + 1,
                );
            })
            .start() 

        scene.add(mesh);
        scene.add(mesh2)
    } else {
        scene.add(mesh);

        new TWEEN.Tween(mesh.scale)
            .to({ y: 1 }, 1000)
            .easing(TWEEN.Easing.Circular.Out)
            .onUpdate(() => {
                renderer.render( scene, camera );
            })
            .onComplete(() => {
                addTree(
                    {width: 3, depth: 3, height: height}, 
                    nextPosition,
                    maxHeight,
                    currentHeight + 1,
                );
            })
            .start() 
    }
            
}

const addRenderer = () => {
    renderer = new THREE.WebGLRenderer({
        antialias: true,
        canvas: canvas
    })
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
}

const addCamera = () => {
    camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 200)
    camera.position.set(0, 0, 100);
    scene.add(camera)
}

const addControls = () => {
    controls = new OrbitControls(camera, canvas)
    controls.enableDamping = true
}

const addListeners = () => {
    window.addEventListener('resize', () =>{
        // Update sizes
        sizes.width = window.innerWidth
        sizes.height = window.innerHeight
    
        // Update camera
        camera.aspect = sizes.width / sizes.height
        camera.updateProjectionMatrix()
    
        // Update renderer
        renderer.setSize(sizes.width, sizes.height)
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    });
}

const init = () => {
    addCamera();
    addRenderer();
    addControls();
    addListeners();
    scene.add(treeGroup)

    addTree(
        {width: 3, depth: 3, height: 12}, 
        {x: 0, y: -50, z: 0}, 
        17,
        1
    );

    tick();
}

const tick = () => {
    const elapsedTime = clock.getElapsedTime()

    TWEEN.update()

    // Update controls
    controls.update()

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

init();