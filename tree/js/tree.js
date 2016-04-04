// standard global variables
var container, v, floor, scene, camera, renderer, controls, stats,
    keyboard = new THREEx.KeyboardState(),
    clock = new THREE.Clock(),
    mesh,
    line,
    count = 0,
    theta = 0,
    planeWidth = window.innerWidth, 
    planeHeight = window.innerHeight,
    floorSize = planeWidth * 3,
    VIEW_ANGLE = 45, 
    ASPECT = window.innerWidth / window.innerHeight, 
    NEAR = 0.1, 
    FAR = 20000,
    radius = window.innerWidth/4, 
    MAX_POINTS = 5000,
    drawCount;

init();
animate();


/**
 * Helper function that returns a random number between the two supplied
 * numbers. 
 *
 *  @param min  :  Integer
 *  @param max  :  Integer
 */
function rando(min, max) {
  return Math.floor(Math.random() * (max - min) + min);
}


/**
 * Helper function that returns a boolean. 
 * True if the client device is "mobile", false otherwise.
 */
 function isMobile() {
    return (window.innerWidth < 1024);
 }



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
    camera.position.set(0, 20, planeWidth/4);
    camera.lookAt(scene.position);

    // RENDERER
    if ( Detector.webgl )
        renderer = new THREE.WebGLRenderer( {antialias:true} );
    else
        renderer = new THREE.CanvasRenderer(); 

    // Scales the content down to fit the screen size
    renderer.setSize(window.innerWidth, window.innerHeight);
    container = document.getElementById( 'container' );
    container.appendChild( renderer.domElement );

    controls = new THREE.OrbitControls( camera, renderer.domElement );

    // LIGHT
    addLight();
    // addFloor();
    addTree();

    var windowResize = new THREEx.WindowResize(renderer, camera);
}


/**
 * This function is called about 60 times per second, and is responsible
 * for moving the camera back and forth over an arc. It also updates the 
 * the project names to be viewing the camera.
 */
function circleCamera() {
    theta += 0.2;
    camera.position.x = radius * Math.sin( THREE.Math.degToRad( theta ) );
    camera.position.y = radius * Math.sin( THREE.Math.degToRad( theta ) );
    camera.lookAt( scene.position );
    camera.updateMatrixWorld();
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
    floor.position.y = -(planeHeight/6);
    floor.rotation.x = Math.PI / 2;
    scene.add(floor);
    scene.fog = new THREE.Fog( 0x333333, 0.1, floorSize);

    var skyBoxGeometry = new THREE.CubeGeometry( 10000, 10000, 10000 );
    var skyBoxMaterial = new THREE.MeshBasicMaterial( { color: 0x333333, side: THREE.BackSide } );
    var skyBox = new THREE.Mesh( skyBoxGeometry, skyBoxMaterial );
    scene.add(skyBox);
}


function addTree() {
    var geometry = new THREE.BufferGeometry();

    // attributes
    var positions = new Float32Array( MAX_POINTS * 3 ); // 3 vertices per point
    geometry.addAttribute( 'position', new THREE.BufferAttribute( positions, 3 ) );

    // drawcalls
    drawCount = 2; // draw the first 2 points, only
    geometry.setDrawRange( 0, drawCount );

    // material
    var material = new THREE.LineBasicMaterial( { 
            color: 0xffffff * Math.random(), 
            linewidth: 20
        } );

    // line
    line = new THREE.Line( geometry,  material );

    scene.add( line );

    updatePositions();
}


// update positions
function updatePositions() {

    var positions = line.geometry.attributes.position.array;

    var x = y = z = index = 0;

    for ( var i = 0, l = MAX_POINTS; i < l; i ++ ) {

        positions[ index ++ ] = x;
        positions[ index ++ ] = y;
        positions[ index ++ ] = z;

        x += rando(-3,4);
        y += rando(-1, 2);
        z += rando(-3, 4);

    }

}


function animate() {
    requestAnimationFrame( animate );

    drawCount = ( drawCount + 1 ) % MAX_POINTS;

    line.geometry.setDrawRange( 0, drawCount );

    if ( drawCount === 0 ) {

        // periodically, generate new data

        updatePositions();

        line.geometry.attributes.position.needsUpdate = true; // required after the first render

        line.material.color.setHSL( Math.random(), 1, 0.5 );
    }

    render();       
    update();
}

function update(){
    controls.update();
    // stats.update();
}

function render() {
    renderer.render( scene, camera );

    circleCamera();

}
