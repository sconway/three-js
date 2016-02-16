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
	scaleXUp,
	scaleYDown,
	scaleYUp,
	rotateXUp,
	rotateXDown,
	rotateYUp,
	rotateYDown,
	rotateZUp,
	rotateZDown,
	scaleToX = window.innerWidth/50,
	scaleToY = window.innerHeight/50,
	scaleDown = false,
	zoomOut = false,
	projectInView = false,
	radius = 500, 
	theta = 0,
	cameraZ = 1500,
	cubeSize = 50,
	scaleToZ = cameraZ/cubeSize,
	numShapes = 200,
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


function init() {
	container = document.getElementById("container");
	camera = new THREE.PerspectiveCamera( 45, aspect, 1, 10000 );
	camera.position.z = cameraZ;
	ogCameraPosition = camera.position;
	scene = new THREE.Scene();

	addLight();
	addImages();
	addShapes();
	raycaster = new THREE.Raycaster();
	renderScene();

	controls = new THREE.OrbitControls( camera, renderer.domElement );

	stats = new Stats();
	stats.domElement.style.position = 'absolute';
	stats.domElement.style.top = '0px';
	container.appendChild( stats.domElement );

	document.addEventListener( 'mousemove', onDocumentMouseMove, false );
	document.addEventListener( 'mousedown', onDocumentMouseDown, false );

	var windowResize = new THREEx.WindowResize(renderer, camera);
}


function renderScene() {
	renderer = new THREE.WebGLRenderer();
	renderer.setClearColor( 0xf0f0f0 );
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
	var numImages = images.length,
		geometry = new THREE.BoxGeometry( 50, 50, 50 );

	for ( var i = 0; i < numShapes; i ++ ) {

		var object = new THREE.Mesh( geometry, 
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
	var light = new THREE.DirectionalLight( 0xffffff, 1 );
	light.position.set( 1, 1, 1 ).normalize();
	scene.add( light );
}


function onDocumentMouseMove( event ) {
	event.preventDefault();
	mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
	mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
}


function onDocumentMouseDown() {
	if (!projectInView) {
		raycaster.setFromCamera( mouse, camera );

		var intersect = raycaster.intersectObjects( scene.children )[0].object;
		selectedProject = intersect;
		lastCameraPosition = selectedProject.position;
		projectInView = true;
		zoomOut = false;

		console.log("intersect position: ", selectedProject.position);
		console.log("OG position: ", ogCameraPosition);

		scaleXUp = scaleXDown = scaleYUp = scaleYDown = null;
		camera.position.x > selectedProject.position.x ? scaleXDown = true : scaleXUp = true;
		camera.position.y > selectedProject.position.y ? scaleYDown = true : scaleYUp = true;
	} else {
		console.log("zoomed position: ", camera.position);
		scaleXUp = scaleXDown = scaleYUp = scaleYDown = null;
		camera.position.x > ogCameraPosition.x ? scaleXDown = true : scaleXUp = true;
		camera.position.y > ogCameraPosition.y ? scaleYDown = true : scaleYUp = true;
		selectedProject = null;
		projectInView = false;
		zoomOut = true;
	}
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
	if (camera.position.z > selectedProject.position.z + 20) {
		camera.position.z -= 10;
	}
}


function zoomCameraOut() {
	camera.lookAt(scene.position);
	// if (scaleXDown && camera.position.x > ogCameraPosition.x) {
	// 	console.log("zoom x down");
	// 	camera.position.x -= 4;
	// }
	// if (scaleXUp && camera.position.x < ogCameraPosition.x) {
	// 	console.log("zoom x up");
	// 	camera.position.x += 4;
	// }
	// if (scaleYDown && camera.position.y > ogCameraPosition.y) {
	// 	console.log("zoom y down");
	// 	camera.position.y -= 4;
	// }
	// if (scaleYUp && camera.position.y < ogCameraPosition.y) {
	// 	console.log("zoom y up");
	// 	camera.position.y += 4;
	// }
	if (camera.position.z < cameraZ) {
		camera.position.z += 10;
	}else {
		// camera.lookAt(scene.position);

		// console.log("OG camera position: ", ogCameraPosition);
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
	controls.update();
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

