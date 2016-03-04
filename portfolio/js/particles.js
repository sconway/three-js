// (function() {

var container, 
	controls = [],
	camera, 
	scene, 
	raycaster, 
	renderer,
	selectedProject,
	ogCameraPosition,
	lastCameraPosition,
	scaleXDown,
	absolute,
	curSphere,
	isExpanding = false,
	isShrinking = false,
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
	minFace = 50,
	maxFace = 90,
	numShapes = 10,
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


/**
 * 
 * 
 */
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

	// $("#previewImg").attr("src", "images/projects/zildjian.png");

	document.addEventListener( 'mousemove', onDocumentMouseMove, false );
	// window.addEventListener("devicemotion", handleMotion, false);
	$(".canvas").click(function() { zoomToProject(); });
	$("#backBtn").click(function() { backToProjectView(); });


	
	var windowResize = new THREEx.WindowResize(renderer, camera);
}


function renderScene() {
	renderer = new THREE.WebGLRenderer({alpha : true});
	renderer.setClearColor( 0x000000, 1 );
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


/**
 * 	This function is responsible for adding the various shapes to the canvas
 *  and placing them in random locations in 3D space
 */
function addShapes() {
	var numImages = images.length;

	for ( var i = 0; i < numShapes; i ++ ) {
		var size     = ((i + 2) * 10) - ((i + 1) * 5),
		    faceSize = rando(minFace, maxFace),
		    numFaces = Math.random(),
			material = new THREE.MeshBasicMaterial( {  
							map: loaders[Math.floor(Math.random() * numImages)], 
							side: THREE.DoubleSide 
						}),
			color   = new THREE.MeshLambertMaterial( { 
							color: 0xffffff 
						}),
			object = new THREE.Mesh( 
						new THREE.SphereGeometry( size, 64, 64 ),
						color
						);
 
		object.position.x = Math.random() * 800 - 400;
		object.position.y = Math.random() * 800 - 400;
		object.position.z = Math.random() * 800 - 400;

		object.rotation.x = Math.random() * 2 * Math.PI;
		object.rotation.y = Math.random() * 2 * Math.PI;
		object.rotation.z = Math.random() * 2 * Math.PI;

		controls.push( new THREE.DeviceOrientationControls( object , true ) );

		scene.add( object );
	}
}


function addLight() {
	var light = new THREE.DirectionalLight( 0xffffff, 1 );
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
}


function zoomToProject() {
	if (!projectInView) {
		raycaster.setFromCamera( mouse, camera );

		var intersect = raycaster.intersectObjects( scene.children )[0].object;
		selectedProject = intersect;
		lastCameraPosition = selectedProject.position;
		projectInView = true;
		zoomOut = false;

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


// function expandSelection() {
// 	if (!projectInView) {
// 		circleCamera();
// 	} else if (selectedProject && !scaleDown) {
// 		oldRotation = selectedProject.rotation;
// 		lastCameraPosition = selectedProject.position;
// 		selectedProject.rotation.x = 0;
// 		selectedProject.rotation.y = 0;
// 		selectedProject.rotation.z = 0;
// 		selectedProject.position.x = 0;
// 		selectedProject.position.y = 0;
// 		selectedProject.position.z = 0;
// 		camera.lookAt(selectedProject.position);
// 		if (selectedProject.scale.x < scaleToX) {
// 			selectedProject.scale.x += 1;
// 		}
// 		if (selectedProject.scale.y < scaleToY) {
// 			selectedProject.scale.y += 1;
// 		}
// 		if (selectedProject.scale.z < scaleToZ) {
// 			selectedProject.scale.z += 1;
// 		}
// 	} else if (scaleDown) {
// 		console.log("project selected, scaling down");
// 		if (selectedProject.scale.x > 1) {
// 			selectedProject.scale.x -= 1;
// 		} else if (selectedProject.scale.y > 1) {
// 			selectedProject.scale.y -= 1;
// 		} else if (selectedProject.scale.z > 1) {
// 			selectedProject.scale.z -= 1;
// 		} else {
// 			projectInView = false;
// 			scaleDown = false;
// 			selectedProject = null;
// 		}
// 	}
// }


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


function updateControls() {
	var numControls = controls.length;

	for (var i = 0; i < numControls; i++) {
		controls[i].update();
	}
}


function expandSphere() {
	if (curSphere.scale.x < 2) {
		curSphere.scale.x += 0.1;
		curSphere.scale.y += 0.1;
		curSphere.scale.z += 0.1;
	} 
}

function shrinkSphere() {
	if(curSphere.scale.x > 1) {
		curSphere.scale.x -= 0.1;
		curSphere.scale.y -= 0.1;
		curSphere.scale.z -= 0.1;
	}
}


function animate() {
	requestAnimationFrame( animate );
	updateControls();
	render();
	handleCameraMovement();
}


function render() {

	if (!projectInView) {
		circleCamera();
	}

	if (isExpanding) {
		expandSphere();
	}

	if (isShrinking) {
		shrinkSphere();
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
	var numIntersects = intersects.length;

	if ( intersects.length > 0 ) {
		console.log("There are intersects");
		if (INTERSECTED != intersects[0].object ) {
			console.log("INTERSECTED not first object");
			// INTERSECTED.scale.x = INTERSECTED.scale.y = INTERSECTED.scale.z = 1;
			$("html").css({cursor: 'pointer'});
			curSphere = INTERSECTED = intersects[0].object;
			isExpanding = true;
			isShrinking = false;

			// INTERSECTED.scale.x += 1;
			// INTERSECTED.scale.y += 1;
			// INTERSECTED.scale.z += 1;
			// $("#previewImg").attr("src", INTERSECTED.material.map.image.currentSrc);

			// // loop though any intersected elements, excluding the first,
			// // and make sure it is at it's original scale;
			// for (var i = 0; i < numIntersects; i++) {
			// 	console.log("looping");
			// 	if (INTERSECTED != intersects.object) {
			// 		intersects[i].object.scale.x = 1;
			// 		intersects[i].object.scale.y = 1;
			// 		intersects[i].object.scale.z = 1;
			// 	}
			// }
		} else {
			console.log("INTERSECTED is first object");
			// INTERSECTED.scale.x = INTERSECTED.scale.y = INTERSECTED.scale.z = 1;
			// for (var i = 0; i < numIntersects; i++) {
			// 	console.log("looping");
			// 	intersects[i].object.scale.x = 1;
			// 	intersects[i].object.scale.y = 1;
			// 	intersects[i].object.scale.z = 1;
			// }
		}

	} else {
		isExpanding = false;
		isShrinking = true;
		$("html").css({cursor: 'initial'});
		$("#previewImg").attr("src", null);
		if ( INTERSECTED ) {
			console.log("No Intersects but there is an Intersect defined");
			// reset all cubes to default size when nothing is intersected
			// INTERSECTED.scale.x = INTERSECTED.scale.y = INTERSECTED.scale.z = 1;
			// INTERSECTED.material.emissive.setHex( INTERSECTED.currentHex );
		}else {
			console.log("No Intersects and there is no Intersect defined");
		}

		INTERSECTED = null;
	}

	renderer.render( scene, camera );
}

	



// })();

