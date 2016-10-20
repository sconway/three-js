// standard global variables
var container, v, floor, scene, camera, renderer, controls, stats,
    keyboard = new THREEx.KeyboardState(),
    clock = new THREE.Clock(),
    runtime = new ShaderFrogRuntime(),
    mesh,
    line,
    tubeMaterial,
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
    camera.position.set(0, 0, 50);
    camera.lookAt(scene.position);
    scene.add(camera);
    runtime.registerCamera( camera );

    // add this so the shader JS knows about the camera.

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
    loadShader();

    var windowResize = new THREEx.WindowResize(renderer, camera);
}


function addLight() {
    var light = new THREE.AmbientLight( 0xffffff );
    scene.add(light);
}


function addTube( material ) {

    var CustomSinCurve = THREE.Curve.create(
        function ( scale ) { //custom curve constructor
            this.scale = (scale === undefined) ? 1 : scale;
        },

        function ( t ) { //getPoint: t is between 0-1
            var tx = t * 6 - 3,
                ty = Math.cos( 3.8 * Math.PI * t ),
                tz = 1;

            return new THREE.Vector3(tx, ty, tz).multiplyScalar(this.scale);
        }
    );

    var path = new CustomSinCurve( 5 );

    var geometry = new THREE.TubeGeometry(
        path,  //path
        255,    //segments
        2,     //radius
        255,     //radiusSegments
        false  //closed
    );



    var tube = new THREE.Mesh( geometry, material );

    scene.add( tube );

}


function loadShader() {

    runtime.load( 'shader1.json', function( shaderData ) {

        tubeMaterial     = runtime.get( shaderData.name );
        addTube( tubeMaterial );

    });

}


function animate() {
    requestAnimationFrame( animate );
    render();       
    update();
}


function update(){
    controls.update();
}


function render() {
    
    renderer.render( scene, camera );
    runtime.updateShaders( clock.getElapsedTime() );

}
