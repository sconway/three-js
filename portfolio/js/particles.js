// (function() {

var container, 
	controls,
	stats,
	camera, 
	scene, 
	raycaster, 
	renderer,
	selectedProject,
	ogCameraPosition,
	lastCameraPosition,
	scaleXDown,
	absolute,
	alpha,
	beta,
	gamma,
	scaleXUp,
	scaleYDown,
	scaleYUp,
	rotateXUp,
	rotateXDown,
	rotateYUp,
	rotateYDown,
	rotateZUp,
	rotateZDown,
	cameraUpX,
	moveCamera = false,
	scaleToX = window.innerWidth/50,
	scaleToY = window.innerHeight/50,
	scaleDown = false,
	rotateCamera = false,
	zoomOut = false,
	projectInView = false,
	radius = 500, 
	theta = 0,
	cameraZ = 1500,
	cubeSize = 50,
	scaleToZ = cameraZ/cubeSize,
	numShapes = 600,
	frustumSize = 1000,
	keyboard = new THREEx.KeyboardState(),
	mouse = new THREE.Vector2(), 
	INTERSECTED,
	aspect = window.innerWidth / window.innerHeight,
	images = [ "college-culture.png", "copyright.png", "father-peyton.png", 
			   "iha-today.png", "standish-home.png", "wolf-greenfield.png",
			   "zildjian.png", "enernoc.png" ],
	loaders = [];


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


function init() {
	container = document.getElementById("container");
	camera = new THREE.PerspectiveCamera( 45, aspect, 1, 10000 );
	camera.position.set(0, 0, cameraZ);

	ogCameraPosition = camera.position.clone();
	scene = new THREE.Scene();

	addLight();
	addImages();
	addShapes();
	raycaster = new THREE.Raycaster();
	renderScene();

	stats = new Stats();
	stats.domElement.style.position = 'absolute';
	stats.domElement.style.top = '0px';
	container.appendChild( stats.domElement );

	document.addEventListener( 'mousemove', onDocumentMouseMove, false );
	// window.addEventListener("devicemotion", handleMotion, false);
	$(".canvas").click(function() { zoomToProject(); });
	$("#backBtn").click(function() { backToProjectView(); });



	var windowResize = new THREEx.WindowResize(renderer, camera);
}


function renderScene() {
	renderer = new THREE.WebGLRenderer();
	renderer.setClearColor( 0xdddddd );
	renderer.setPixelRatio( window.devicePixelRatio );
	renderer.setSize( window.innerWidth, window.innerHeight );
	renderer.sortObjects = false;
	container.appendChild(renderer.domElement);
}


function addImages() {
	for (var i = 0; i < images.length; i++) {
		var loader = new THREE.TextureLoader().load('images/projects/' + images[i]);
	    loader.wrapS = loader.wrapT = THREE.RepeatWrapping;
	    loaders.push(loader);
	}
}


function addShapes() {
	var numImages = images.length;

	for ( var i = 0; i < numShapes; i ++ ) {
		var faceSize  = rando(20, 40),
		    object = new THREE.Mesh( 
						new THREE.BoxGeometry( faceSize, faceSize, faceSize ), 
						new THREE.MeshBasicMaterial( {  
							map: loaders[Math.floor(Math.random() * numImages)], 
							side: THREE.DoubleSide 
						}));
 
		object.position.x = Math.random() * 800 - 400;
		object.position.y = Math.random() * 800 - 400;
		object.position.z = Math.random() * 800 - 400;

		object.rotation.x = Math.random() * 2 * Math.PI;
		object.rotation.y = Math.random() * 2 * Math.PI;
		object.rotation.z = Math.random() * 2 * Math.PI;

		scene.add( object );
	}
}


function addLight() {
	var light = new THREE.DirectionalLight( 0x000000, 1 );
	light.position.set( 1, 1, 1 ).normalize();
	scene.add( light );
}


function onDocumentMouseMove( event ) {
	event.preventDefault();
	mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
	mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
}

function handleMotion(event) {
  // absolute = event.absolute;
  alpha    = event.rotationRate.alpha;
  beta     = event.rotationRate.beta;
  gamma    = event.rotationRate.gamma;

  // Do stuff with the new orientation data
  console.log(gamma);
  // moveCamera = true;
}

function zoomToProject() {
	if (!projectInView) {
		raycaster.setFromCamera( mouse, camera );

		var intersect = raycaster.intersectObjects( scene.children )[0].object;
		selectedProject = intersect;
		lastCameraPosition = selectedProject.position;
		projectInView = true;
		zoomOut = false;

		// tweenCamera();

		$(".project-preview").addClass("hidden");

		console.log("intersect position: ", selectedProject.position);
		console.log("OG position: ", ogCameraPosition);

		scaleXUp = scaleXDown = scaleYUp = scaleYDown = null;
		camera.position.x > selectedProject.position.x ? scaleXDown = true : scaleXUp = true;
		camera.position.y > selectedProject.position.y ? scaleYDown = true : scaleYUp = true;
	}
}


function backToProjectView() {
	$(".project-details, .project-intro, .canvas").removeClass("active");
	scaleXUp = scaleXDown = scaleYUp = scaleYDown = null;
	camera.position.x > ogCameraPosition.x ? scaleXDown = true : scaleXUp = true;
	camera.position.y > ogCameraPosition.y ? scaleYDown = true : scaleYUp = true;
	rotateCamera = false;
	selectedProject = null;
	projectInView = false;
	zoomOut = true;
}


function circleCamera() {
	theta += 0.1;
	camera.position.x = radius * Math.sin( THREE.Math.degToRad( theta ) );
	camera.position.y = radius * Math.sin( THREE.Math.degToRad( theta ) );
	camera.lookAt( scene.position );
	camera.updateMatrixWorld();
}


function expandSelection() {
	if (!projectInView) {
		circleCamera();
	} else if (selectedProject && !scaleDown) {
		oldRotation = selectedProject.rotation;
		lastCameraPosition = selectedProject.position;
		selectedProject.rotation.x = 0;
		selectedProject.rotation.y = 0;
		selectedProject.rotation.z = 0;
		selectedProject.position.x = 0;
		selectedProject.position.y = 0;
		selectedProject.position.z = 0;
		camera.lookAt(selectedProject.position);
		if (selectedProject.scale.x < scaleToX) {
			selectedProject.scale.x += 1;
		}
		if (selectedProject.scale.y < scaleToY) {
			selectedProject.scale.y += 1;
		}
		if (selectedProject.scale.z < scaleToZ) {
			selectedProject.scale.z += 1;
		}
	} else if (scaleDown) {
		console.log("project selected, scaling down");
		if (selectedProject.scale.x > 1) {
			selectedProject.scale.x -= 1;
		} else if (selectedProject.scale.y > 1) {
			selectedProject.scale.y -= 1;
		} else if (selectedProject.scale.z > 1) {
			selectedProject.scale.z -= 1;
		} else {
			projectInView = false;
			scaleDown = false;
			selectedProject = null;
		}
	}
}


function spinCamera() {
	camera.rotation.x -= 0.001;
    camera.rotation.y -= 0.001;
}


function slideCamera() {
	// console.log("beta: ", beta);
	beta > 0 ? camera.position.y += 1 : camera.position.y -= 1;
}


function zoomToSelection() {
	if (scaleXDown && camera.position.x > selectedProject.position.x) {
		camera.position.x -= 4;
	}
	if (scaleXUp && camera.position.x < selectedProject.position.x) {
		camera.position.x += 4;
	}
	if (scaleYDown && camera.position.y > selectedProject.position.y) {
		camera.position.y -= 4;
	}
	if (scaleYUp && camera.position.y < selectedProject.position.y) {
		camera.position.y += 4;
	}
	if (camera.position.z > selectedProject.position.z) {
		camera.position.z -= 10;
	}else {
		rotateCamera = true;
		$(".project-details, .project-intro, .canvas").addClass("active");
	}
}


function tweenCamera(){
	console.log("called");

	// backup original rotation
	var startRotation = new THREE.Euler().copy( camera.rotation );

	// final rotation (with lookAt)
	camera.lookAt( selectedProject.position );
	var endRotation = new THREE.Euler().copy( camera.rotation );

	// revert to original rotation
	camera.rotation.copy( startRotation );

	// Tween
	new TWEEN.Tween( camera ).to( { rotation: endRotation }, 600 ).start();


	// new TWEEN.Tween( camera.position ).to( {
	//         x: position.x,
	//         y: position.y,
	//         z: position.z }, 600 )
	//     .easing( TWEEN.Easing.Sinusoidal.EaseInOut).start();

	// new TWEEN.Tween( controls.target ).to( {
	//         x: target.x,
	//         y: target.y,
	//         z: target.z}, 600 )
	//     .easing( TWEEN.Easing.Sinusoidal.EaseInOut).start();
}


function zoomCameraOut() {
	camera.lookAt(scene.position);
	// console.log("Camera pos: ", camera.position);
	// console.log("OG pos: ", ogCameraPosition);
	if (scaleXDown && camera.position.x > ogCameraPosition.x) {
		console.log("zoom x down");
		camera.position.x -= 4;
	}
	if (scaleXUp && camera.position.x < ogCameraPosition.x) {
		console.log("zoom x up");
		camera.position.x += 4;
	}
	if (scaleYDown && camera.position.y > ogCameraPosition.y) {
		console.log("zoom y down");
		camera.position.y -= 4;
	}
	if (scaleYUp && camera.position.y < ogCameraPosition.y) {
		console.log("zoom y up");
		camera.position.y += 4;
	}
	if (camera.position.z < cameraZ) {
		camera.position.z += 10;
	}else {
		zoomOut = false;
		$(".project-preview").removeClass("hidden");
		console.log("done zooming");
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
	handleCameraMovement();
	stats.update();
}


function render() {
	if (!projectInView) {
		circleCamera();
	}
	
	if (selectedProject) {
		zoomToSelection();
	}

	if (zoomOut) {
		zoomCameraOut();
	}

	if (rotateCamera) {
	    spinCamera();
	}

	if (moveCamera) {
		slideCamera();
	}

	// find intersections
	raycaster.setFromCamera( mouse, camera );

	var intersects = raycaster.intersectObjects( scene.children );

	if ( intersects.length > 0 ) {
		if ( INTERSECTED != intersects[0].object ) {
			INTERSECTED = intersects[0].object;
			// console.log(INTERSECTED);
			$("#previewImg").attr("src", INTERSECTED.material.map.image.currentSrc);
		}
	} else {
		if ( INTERSECTED ) {
			// INTERSECTED.material.emissive.setHex( INTERSECTED.currentHex );
		}
		INTERSECTED = null;
	}

	renderer.render( scene, camera );
}

	



// })();

