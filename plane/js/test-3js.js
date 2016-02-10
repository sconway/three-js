// standard global variables
var container, v, floor, scene, camera, renderer, controls, stats,
    keyboard = new THREEx.KeyboardState(),
    clock = new THREE.Clock(),
    mesh,
    planeWidth = 2000, 
    planeHeight = 900,
    floorSize = planeWidth * 3,
    VIEW_ANGLE = 45, 
    ASPECT = window.innerWidth / window.innerHeight, 
    NEAR = 0.1, 
    FAR = 20000;

init();
animate();


/**
 * Sets up the necessary items for initialization. This includes
 * the camera, renderer, scene, controls, etc. 
 */      
function init() {
    // SCENE
    scene = new THREE.Scene();

    // CAMERA
    camera = new THREE.PerspectiveCamera( VIEW_ANGLE, ASPECT, NEAR, FAR);
    scene.add(camera);
    camera.position.set(0, 20, floorSize/2);
    camera.lookAt(scene.position);

    // RENDERER
    if ( Detector.webgl )
        renderer = new THREE.WebGLRenderer( {antialias:true} );
    else
        renderer = new THREE.CanvasRenderer(); 

    // Scales the content down to fit the screen size
    renderer.setSize(window.innerWidth, window.innerHeight);
    container = document.getElementById( 'ThreeJS' );
    container.appendChild( renderer.domElement );

    controls = new THREE.OrbitControls( camera, renderer.domElement );

    // LIGHT
    addLight();
    addFloor();
    addPanels();

    var windowResize = new THREEx.WindowResize(renderer, camera);
}


function addLight() {
    var light = new THREE.PointLight(0xffffff);
    light.position.set(100,250,100);
    scene.add(light);
}

function addFloor() {
    var loader = new THREE.TextureLoader().load('images/checkerboard.png');
    loader.wrapS = THREE.RepeatWrapping;
    loader.wrapT = THREE.RepeatWrapping;
    loader.repeat.set( 50, 50 );

    var floorMaterial = new THREE.MeshBasicMaterial( { map: loader, side: THREE.DoubleSide} );
    var floorGeometry = new THREE.PlaneGeometry(floorSize, floorSize, 50, 50);
    floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.position.y = -(planeHeight/8);
    floor.rotation.x = Math.PI / 2;
    scene.add(floor);
    scene.fog = new THREE.Fog( 0xf2f2f2, 0.1, floorSize);

    var skyBoxGeometry = new THREE.CubeGeometry( 10000, 10000, 10000 );
    var skyBoxMaterial = new THREE.MeshBasicMaterial( { color: 0xf2f2f2, side: THREE.BackSide } );
    var skyBox = new THREE.Mesh( skyBoxGeometry, skyBoxMaterial );
    scene.add(skyBox);
}


function addPanels() {
    makeCube(0,((floorSize/2) - 400), -150, 10);
    makeCube(400,500, -150, 10);
    makeCube(-400,planeHeight, -150, -10);
    makeCube(0, 0, -150, 0);
    makeCube(planeWidth*1.5, 0, -150, 90);
}


function makeCube(x,y,z, rotation) {
    var cube = new THREE.Mesh(
            new THREE.BoxGeometry(200, 2, 250),
            new THREE.MeshLambertMaterial({ color: 0xff0000 })
        )

    cube.position.set(x, y, z);
    cube.rotation.z = rotation;
    floor.add(cube);
}


function handleFloorMovement() {
    if ( keyboard.pressed("left") ) {
        floor.rotation.z += 0.01;
    }
    if ( keyboard.pressed("right") ) { 
        floor.rotation.z -= 0.01;
    }
    if ( keyboard.pressed("up") ) { 
        console.log("Z value:", floor.position.z );
        floor.position.z += 5;
    }
    if ( keyboard.pressed("down") ) { 
        console.log("Z value:", floor.position.z );
        floor.position.z -= 5;
    }
}


function handleCameraMovement() {
    if ( keyboard.pressed("q") ) { 
        camera.position.x -= 1;
    }
    if ( keyboard.pressed("w") ) { 
        camera.position.x += 1;
    }
    if ( keyboard.pressed("a") ) { 
        camera.position.y -= 1;
    }
    if ( keyboard.pressed("s") ) { 
        camera.position.y += 1;
    }
    if ( keyboard.pressed("z") ) { 
        camera.position.z -= 1;
    }
    if ( keyboard.pressed("x") ) { 
        camera.position.z += 1;
    }
    if ( keyboard.pressed("e") ) { 
        camera.rotation.x -= 0.01;
    }
    if ( keyboard.pressed("r") ) { 
        camera.rotation.x += 0.01;
    }
    if ( keyboard.pressed("d") ) { 
        camera.rotation.y -= 0.01;
    }
    if ( keyboard.pressed("f") ) { 
        camera.rotation.y += 0.01;
    }
    if ( keyboard.pressed("c") ) { 
        camera.rotation.z -= 0.01;
    }
    if ( keyboard.pressed("v") ) { 
        camera.rotation.z += 0.01;
    }
}


function animate() {
    requestAnimationFrame( animate );
    render();       
    update();
}

function update(){
    handleFloorMovement();
    handleCameraMovement();
    controls.update();
    // stats.update();
}

function render() {
    renderer.render( scene, camera );
}
