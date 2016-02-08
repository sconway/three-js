// standard global variables
var container, v, floor, scene, camera, renderer, controls, stats;
var keyboard = new THREEx.KeyboardState();
var clock = new THREE.Clock();
// custom global variables
var mesh;

init();
animate();

// FUNCTIONS        
function init() {
    // SCENE
    scene = new THREE.Scene();

    // CAMERA
    var SCREEN_WIDTH = window.innerWidth, 
        SCREEN_HEIGHT = window.innerHeight;
        VIEW_ANGLE = 45, 
        ASPECT = SCREEN_WIDTH / SCREEN_HEIGHT, 
        NEAR = 0.1, 
        FAR = 20000;

    camera = new THREE.PerspectiveCamera( VIEW_ANGLE, ASPECT, NEAR, FAR);
    scene.add(camera);
    camera.position.set(0, 20, 400);
    camera.lookAt(scene.position);

    // RENDERER
    if ( Detector.webgl )
        renderer = new THREE.WebGLRenderer( {antialias:true} );
    else
        renderer = new THREE.CanvasRenderer(); 

    renderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);
    container = document.getElementById( 'ThreeJS' );
    container.appendChild( renderer.domElement );

    controls = new THREE.OrbitControls( camera, renderer.domElement );

    // LIGHT
    var light = new THREE.PointLight(0xffffff);
    light.position.set(100,250,100);
    scene.add(light);

    // FLOOR
    var loader = new THREE.TextureLoader().load('images/checkerboard.png');
    loader.wrapS = THREE.RepeatWrapping;
    loader.wrapT = THREE.RepeatWrapping;
    loader.repeat.set( 50, 50 );
    var floorMaterial = new THREE.MeshBasicMaterial( { map: loader, side: THREE.DoubleSide} );
    var floorGeometry = new THREE.PlaneGeometry(SCREEN_WIDTH*3, SCREEN_WIDTH*3, 50, 50);
    floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.position.y = -(SCREEN_HEIGHT/8);
    floor.rotation.x = Math.PI / 2;
    scene.add(floor);
    scene.fog = new THREE.Fog( 0xf2f2f2, 0.1, FAR/10 );


    var cubeGeometry = new THREE.CubeGeometry( 50, 50, 50, 20, 20, 20 );
    var particleMaterial = new THREE.ParticleBasicMaterial({ size: 12, color: 0xff0000, transparency: true, alphaTest: 0.5 });
    var particleCube = new THREE.ParticleSystem( cubeGeometry, particleMaterial );
    var particleCube2 = new THREE.ParticleSystem( cubeGeometry, particleMaterial );
    particleCube.position.set(0, 50, 0);
    particleCube2.position.set(0, 500, 0);

    floor.add( particleCube );
    floor.add( particleCube2 );


    // SKYBOX
    var skyBoxGeometry = new THREE.CubeGeometry( 10000, 10000, 10000 );
    var skyBoxMaterial = new THREE.MeshBasicMaterial( { color: 0xf2f2f2, side: THREE.BackSide } );
    var skyBox = new THREE.Mesh( skyBoxGeometry, skyBoxMaterial );
    scene.add(skyBox);
    new THREEx.WindowResize(renderer, camera);
}


function animate() {
    requestAnimationFrame( animate );
    render();       
    update();
}

function update(){
    if ( keyboard.pressed("left") ) {
        floor.rotation.z += 0.01;
    }
    if ( keyboard.pressed("right") ) { 
        floor.rotation.z -= 0.01;
    }
    if ( keyboard.pressed("q") ) { 
        console.log("Y value:", floor.position.y );
        floor.position.y -= 1;
    }
    if ( keyboard.pressed("w") ) { 
        console.log("Y value:", floor.position.y );
        floor.position.y += 1;
    }
    if ( keyboard.pressed("up") ) { 
        console.log("Z value:", floor.position.z );
        floor.position.z += 5;
    }
    if ( keyboard.pressed("down") ) { 
        console.log("Z value:", floor.position.z );
        floor.position.z -= 5;
    }

    controls.update();
    // stats.update();
}

function render() {
    renderer.render( scene, camera );
}
