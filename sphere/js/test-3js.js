// var context = $("body").getContext('2d');
 
// context.fillStyle   = '#000';
// context.lineWidth   = 1;
 
// var deg_to_rad = Math.PI / 180.0;
// var depth = 9;
 
// function drawLine(x1, y1, x2, y2, brightness){
//     context.moveTo(x1, y1);
//     context.lineTo(x2, y2);
// }

// function drawTree(x1, y1, angle, depth){
//     if (depth != 0){
//         var x2 = x1 + (Math.cos(angle * deg_to_rad) * depth * 10.0);
//         var y2 = y1 + (Math.sin(angle * deg_to_rad) * depth * 10.0);
//         drawLine(x1, y1, x2, y2, depth);
//         drawTree(x2, y2, angle - 20, depth - 1);
//         drawTree(x2, y2, angle + 20, depth - 1);
//     }
// }

/*
    Three.js "tutorials by example"
    Author: Lee Stemkoski
    Date: July 2013 (three.js v59dev)
 */

/*
    Three.js "tutorials by example"
    Author: Lee Stemkoski
    Date: July 2013 (three.js v59dev)
*/

// MAIN

// standard global variables
var container, scene, camera, renderer, controls, stats;
var keyboard = new THREEx.KeyboardState();
var clock = new THREE.Clock();

// custom global variables
var targetList = [];
var projector, mouse = { x: 0, y: 0 };

init();
animate();
  
function init() {
    // SCENE
    scene = new THREE.Scene();

    // CAMERA
    var SCREEN_WIDTH = window.innerWidth, 
        SCREEN_HEIGHT = window.innerHeight;
        VIEW_ANGLE = 45, 
        ASPECT = SCREEN_WIDTH / SCREEN_HEIGHT, 
        NEAR = 0.1, 
        FAR = 20000,
        camera = new THREE.PerspectiveCamera( VIEW_ANGLE, ASPECT, NEAR, FAR);
    scene.add(camera);
    camera.position.set(0,150,400);
    camera.lookAt(scene.position);  

    // RENDERER
    if ( Detector.webgl )
        renderer = new THREE.WebGLRenderer( {antialias:true} );
    else
        renderer = new THREE.CanvasRenderer(); 
    renderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);
    container = document.getElementById( 'ThreeJS' );
    container.appendChild( renderer.domElement );

    // EVENTS
    THREEx.WindowResize(renderer, camera);
    THREEx.FullScreen.bindKey({ charCode : 'm'.charCodeAt(0) });

    // CONTROLS
    controls = new THREE.OrbitControls( camera, renderer.domElement );

    // STATS
    stats = new Stats();
    stats.domElement.style.position = 'absolute';
    stats.domElement.style.bottom = '0px';
    stats.domElement.style.zIndex = 100;
    container.appendChild( stats.domElement );

    // LIGHT
    var light = new THREE.PointLight(0xffffff);
    light.position.set(0,250,0);
    scene.add(light);

    // FLOOR
    var floorTexture = new THREE.ImageUtils.loadTexture( 'images/wood.jpg' );
    floorTexture.wrapS = floorTexture.wrapT = THREE.ClampToEdgeWrapping; 
    floorTexture.repeat.set( 1,1 );
    var floorMaterial = new THREE.MeshBasicMaterial( { map: floorTexture, side: THREE.DoubleSide } );
    var floorGeometry = new THREE.PlaneGeometry(1000, 1000, 10, 10);
    var floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.position.y = -0.5;
    floor.rotation.x = Math.PI / 2;
    scene.add(floor);

    // SKYBOX/FOG
    var skyBoxGeometry = new THREE.CubeGeometry( 10000, 10000, 10000 );
    var skyBoxMaterial = new THREE.MeshBasicMaterial( { color: 0x9999ff, side: THREE.BackSide } );
    var skyBox = new THREE.Mesh( skyBoxGeometry, skyBoxMaterial );
    scene.add(skyBox);
    
    ////////////
    // CUSTOM //
    ////////////

    // this material causes a mesh to use colors assigned to faces
    var faceColorMaterial = new THREE.MeshBasicMaterial( 
                         { color: 0xffffff, vertexColors: THREE.FaceColors } );
    
    var sphereGeometry = new THREE.SphereGeometry( 80, 32, 16 );

    console.log(sphereGeometry.faces.length);

    // set the color of each of the faces of the sphere 
    for ( var i = 0; i < sphereGeometry.faces.length; i++ ) {
        face = sphereGeometry.faces[ i ];   
        face.color.setRGB( 0, 0.8 * Math.random() + 0.2, 0 );       
    }

    var sphere = new THREE.Mesh( sphereGeometry, faceColorMaterial );
    sphere.position.set(0, 50, 0);
    scene.add(sphere);
    
    targetList.push(sphere);
    
    //////////////////////////////////////////////////////////////////////
    
    // initialize object to perform world/screen calculations
    projector = new THREE.Projector();
    
    // when the mouse moves, call the given function
    document.addEventListener( 'mousedown', onDocumentMouseDown, false );
    
}

function onDocumentMouseDown( event ) {
    // the following line would stop any other event handler from firing
    // (such as the mouse's TrackballControls)
    // event.preventDefault();
    console.log("Click.");
    
    // update the mouse variable
    mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
    mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
    
    // find intersections

    // create a Ray with origin at the mouse position
    //   and direction into the scene (camera direction)
    var vector = new THREE.Vector3( mouse.x, mouse.y, 1 );
    projector.unprojectVector( vector, camera );
    var ray = new THREE.Raycaster( camera.position, vector.sub( camera.position ).normalize() );

    // create an array containing all objects in the scene with which the ray intersects
    var intersects = ray.intersectObjects( targetList );
    
    // if there is one (or more) intersections
    if ( intersects.length > 0 ) {
        console.log("Hit @ " + toString( intersects[0].point ) );
        // change the color of the closest face.
        intersects[ 0 ].face.color.setRGB( 0.8 * Math.random() + 0.2, 0, 0 ); 
        intersects[ 0 ].object.geometry.colorsNeedUpdate = true;
    }

}

function toString(v) { return "[ " + v.x + ", " + v.y + ", " + v.z + " ]"; }

function animate() {
    requestAnimationFrame( animate );
    render();       
    update();
}

function update() {
    if ( keyboard.pressed("z") ) { 
        // do something
    }
    
    controls.update();
    stats.update();
}

function render() {
    renderer.render( scene, camera );
}