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
	font,
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
	intersectMutex = true,
	unIntersectMutex = true,
	moveCamera = false,
	scaleToX = window.innerWidth/50,
	scaleToY = window.innerHeight/50,
	scaleDown = false,
	spheresMoving = false,
	rotateCamera = false,
	zoomOut = false,
	stopCamera = false,
	projectInView = false,
	radius = window.innerWidth/2, 
	theta = 0,
	cameraZ = 1500,
	cubeSize = 50,
	scaleToZ = cameraZ/cubeSize,
	minFace = 50,
	maxFace = 90,
	numShapes = 10,
	keyboard = new THREEx.KeyboardState(),
	mouse = new THREE.Vector2(), 
	curMouse = new THREE.Vector2(), 
	INTERSECTED,
	aspect = window.innerWidth / window.innerHeight,
	images = [ "college-culture.png", "copyright.png", "father-peyton.png", 
			   "iha-today.png", "standish-home.png", "wolf-greenfield.png",
			   "zildjian.png", "enernoc.png" ],
	names  = [ "College Culture", "Copyright Clearance", "Father Peyton",
			   "IHA Today", "Standish Mellon", "Wolf Greenfield", 
			   "Zildjian Cymbals", "Enernoc" ],
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
 * This function initializes most of the components of this page.
 * It sets up the camera, light, and objects. It also adds the
 * various handlers that are used for interaction.
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
	// addProjectContainer();

	// loadFont();
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

	for ( var i = 0; i < numImages; i ++ ) {
		var size     = ((i + 2) * 10) - ((i + 1) * 5),
		    faceSize = rando(minFace, maxFace),
		    numFaces = Math.random(),
			// material = new THREE.MeshBasicMaterial( {  
			// 				map: loaders[i], 
			// 				side: THREE.DoubleSide 
			// 			}),
			color   = new THREE.MeshLambertMaterial( { 
							color: 0xffffff,
							transparent: true,
							opacity: 0.9
						}),
			object = new THREE.Mesh( 
						new THREE.SphereGeometry( size, 64, 64 ),
						color
						);
 
		// object.position.x = Math.random() * 800 - 400;
		// object.position.y = Math.random() * 800 - 400;
		// object.position.z = Math.random() * 800 - 400;

		object.rotation.x = Math.random() * 2 * Math.PI;
		object.rotation.y = Math.random() * 2 * Math.PI;
		object.rotation.z = Math.random() * 2 * Math.PI;

		object.name = names[i];

		controls.push( new THREE.DeviceOrientationControls( object , true ) );

		scene.add( object );
	}
}


/**
 * Loads in the pre-defined font and saves it to a variable. When finished,
 * the function to create and add the text is called.
 */
function loadFont() {
	var loader = new THREE.FontLoader();
		loader.load( 'js/open_sans.typeface.js', function ( response ) {
			font = response;
		} );
}


/**
 * Creates the 3-D text and adds it to the scene
 *
 * @param      text     :     string
 * @param      pos      :     Vector3 object
 *
 */
function addText(text, pos) {
	var material = new THREE.MeshPhongMaterial(
		{
        	color: 0xffffff
    	}),
    	textGeom = new THREE.TextGeometry( text , 
    	{
    		font: font,
    		size: 48.0
    	}),
    	textMesh = new THREE.Mesh( textGeom, material );
    
    textMesh.position.x = pos.x + 50;
    textMesh.position.y = pos.y;
    textMesh.position.z = pos.z - 100;
    textMesh.name = "project_name";
    textMesh.lookAt( camera.position );

    scene.add( textMesh );

    textGeom.computeBoundingBox();
}


/**
 * Creates the 3-D container for the project description
 *
 * @param      pos     :     Vector3
 *
 */
function addProjectContainer(x, y) {
	// var material = new THREE.MeshBasicMaterial( 
	// 	{
	// 		map: loaders[names.indexOf(name)],
	// 		side: THREE.DoubleSide
	// 	}),
	// 	geometry = new THREE.PlaneGeometry(window.innerWidth, window.innerHeight, 12, 16),
	// 	plane    = new THREE.Mesh(geometry, material);

	// 	console.log(names.indexOf(name));

	// 	plane.position.x = 500;
	// 	plane.position.z = -1000;
	// 	plane.name = "project_container";
	// 	plane.lookAt( camera.position );

	// 	scene.add(plane);
	if (INTERSECTED) {
		$("#teaser")
			.css({
				left: x + 100 + "px",
				top:  y + "px"
			})
			.stop()
			.slideDown(750);
	}
	
}


function addLight() {
	var light = new THREE.HemisphereLight( 0xdddddd , 0x000000, 0.5 );
	light.position.set( 1, 1, 1 ).normalize();
	scene.add( light );
}


function onDocumentMouseMove( event ) {
	event.preventDefault();
	curMouse.x = event.clientX;
	curMouse.y = event.clientY;
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
		lastCameraPosition = camera.clone().position;
		projectInView = true;
		$("#teaser").stop().slideUp(250);
		// zoomOut = false;

		zoomToSelection(selectedProject.position);

		$(".project-preview").addClass("hidden");
	}
}


/**
 * Brings the camera back to the main project view by removing the classes
 * that showed the project details and setting the necessary variables to 
 * zoom the camera to the original position.
 */
function backToProjectView() {
	$(".project-details, .project-intro, .canvas").removeClass("active");
	zoomCameraOut();
	rotateCamera = false;
	
	// zoomOut = true;
}


function circleCamera() {
	theta += 0.2;
	camera.position.x = radius * Math.sin( THREE.Math.degToRad( theta ) );
	camera.position.y = radius * Math.sin( THREE.Math.degToRad( theta ) );
	camera.lookAt( scene.position );
	camera.updateMatrixWorld();
	// var numChildren = scene.children.length;

	// for (var i = 1; i < numChildren; i++) {
	// 	scene.children[i].position.x += Math.sin( THREE.Math.degToRad( theta * Math.random(3, 6) ) );
	// 	scene.children[i].position.y += Math.sin( THREE.Math.degToRad( theta * Math.random(3, 6) ) );
	// }
}


function spinCamera() {
	camera.rotation.x -= 0.001;
    camera.rotation.y -= 0.001;
}


/**
 * Moves all spheres on the scene to the location of the intersected object.
 *
 * @param      current     :     THREE.Mesh
 *
 */
function spheresToCurrent(current) {
	var numChildren = scene.children.length;

	for (var i = 1; i < numChildren; i++) {
		if (curSphere != scene.children[i]) {
			new TWEEN.Tween(scene.children[i].position)
			.to({
				x: current.position.x,
				y: current.position.y,
				z: current.position.z
			}, 1000)
			.easing( TWEEN.Easing.Quartic.In )
		    .onUpdate( function() {
		    	console.log("tweening");
		    	renderer.render(scene, camera);
		    } )
		    .onComplete( function() {
		    	// make sure the mouse has been moved before dropping the
		    	// teaser down. Prevents it from showing on load.
		    	if (curMouse.x > 0 && curMouse.y > 0) {
		    		$("#teaserName, #projectTitle").html(current.name);

			    	addProjectContainer(curMouse.x, curMouse.y);
		    	}
		    })
		    .start();
		}
	}
}


/**
 * Moves all spheres on the scene to a random location.
 */
function spheresToRandom() {
	var numChildren = scene.children.length;

	for (var i = 1; i < numChildren; i++) {
		var posX = Math.random() * 800 - 400,
			posY = Math.random() * 800 - 400,
			posZ = Math.random() * 800 - 400;

		if (curSphere != scene.children[i]) {
			new TWEEN.Tween(scene.children[i].position)
			.to({
				x: posX,
				y: posY,
				z: posZ
			}, 1250)
			.easing( TWEEN.Easing.Elastic.InOut )
			.onStart( function() {
				$("#teaser").stop().slideUp(250);
			})
		    .onUpdate( function() {
		    	console.log("tweening back");
		    	renderer.render(scene, camera);
		    } )
		    .onComplete( function() {
		    	$("#teaser").stop().slideUp(250);
		    })
		    .start();
		}
	}
}


/**
 * Scales the supplied object up by tweening the scale property.
 *
 * @param      object     :     THREE.Mesh
 *
 */
function expandSphere(object) {
	new TWEEN.Tween(object.scale)
		.to({
			x: 2,
			y: 2,
			z: 2
		}, 500)
		.easing( TWEEN.Easing.Circular.Out )
	    .onUpdate( function() {
	    	renderer.render(scene, camera);
	    })
	    .onComplete( function() {
	    	
	    })
	    .start();
}


/**
 * Scales the supplied object down by tweening the scale property.
 */
function shrinkSphere() {
	var numChildren = scene.children.length;

	for (var i = 1; i < numChildren; i++) {
		new TWEEN.Tween(scene.children[i].scale)
			.to({
				x: 1,
				y: 1,
				z: 1
			}, 500)
			.easing( TWEEN.Easing.Circular.Out )
		    .onUpdate( function() {
		    	renderer.render(scene, camera);
		    })
		    .onComplete( function() {
		    })
		    .start();
	}
	
}


/**
 * Tweens the camera from its current zoomed-out position, to the position
 * to the position of the selected object. This essentially puts the camera
 * inside the select project sphere.
 */
function zoomToSelection(target) {
	TWEEN.removeAll();

	new TWEEN.Tween(camera.position)
		.to({
			x: target.x,
			y: target.y,
			z: target.z
		}, 3000)
		.easing( TWEEN.Easing.Linear.None )
	    .onUpdate( function() {
	    	console.log("tweening camera in");
	    	// camera.lookAt(selectedProject.position);
	    	renderer.render(scene, camera);
	    })
	    .onComplete( function() {
	    	rotateCamera = true;
			$(".project-details, .project-intro, .canvas").addClass("active");
	    })
	    .start();
}


/**
 * Tweens the camera from its current, zoomed-in, position to the previously
 * stored camera position.
 */
function zoomCameraOut() {
	TWEEN.removeAll();

	new TWEEN.Tween(camera.position)
		.to({
			x: lastCameraPosition.x,
			y: lastCameraPosition.y,
			z: lastCameraPosition.z
		}, 3000)
		.easing( TWEEN.Easing.Linear.None )
	    .onUpdate( function() {
	    	console.log("tweening camera out");
	    	camera.lookAt(scene.position);
	    	renderer.render(scene, camera);
	    })
	    .onComplete( function() {
	    	console.log("done zooming out");
	    	selectedProject = null;
			projectInView = false;
	    })
	    .start();
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


/*
 * Removes the supplied object from the scene.
 *
 * @param    name    :    string
 *
 */
function removeObject(name) {
	var selectedObject = scene.getObjectByName(name);
    if (selectedObject) scene.remove( selectedObject );
    // animate();
}


/*
 * This function handles an intersection with a given project object.
 * 
 * @param    intersects    :    array
 *
 */
function onIntersection(intersects) {
	var numIntersects = intersects.length, 
		numChildren   = scene.children.length;

 	if (INTERSECTED != intersects[0].object ) {
		removeObject("project_name");
		removeObject("project_container");

		$("html").css({cursor: 'pointer'});
		curSphere = INTERSECTED = intersects[0].object;
		
		if (!projectInView) {
			stopCamera = true;
			isShrinking = false;
			unIntersectMutex = true;
		}
		
		// spheresMoving = true;

		if (intersectMutex) {
			// addText(INTERSECTED.name, INTERSECTED.position);
			// addProjectContainer(INTERSECTED.name);
			expandSphere(curSphere);
			spheresToCurrent(curSphere);
			intersectMutex = false;
		}

		// $("#previewImg").attr("src", INTERSECTED.material.map.image.currentSrc);

		// // loop though any intersected elements, excluding the first,
		// // and make sure it is at it's original scale;
		for (var i = 0; i < numChildren; i++) {
			if ((INTERSECTED != scene.children[i]) && (scene.children[i].name != "project_container")) {
				scene.children[i].scale.x = 1;
				scene.children[i].scale.y = 1;
				scene.children[i].scale.z = 1;
			}
		}
	}
}


/*
 * This function handles a hover off of a given project object.
 * It removes any project text and sets the variables to size the
 * orbs back to their original size.
 */
function onNoIntersections(intersects) {
	
	if (!projectInView){
		stopCamera     = false;
		isExpanding    = false;
		intersectMutex = true;
		if (unIntersectMutex) {
			$("#teaser").stop().slideUp(250);
			spheresToRandom();
			shrinkSphere();
			unIntersectMutex = false;
		}
	} 

	$("html").css({cursor: 'initial'});
	$("#previewImg").attr("src", null);

	INTERSECTED = null;
}


function animate() {
	requestAnimationFrame( animate );
	TWEEN.update();
	updateControls();
	render();
	// handleCameraMovement();
}


/*
 * This function is called many times per second (~60) and is
 * used to update any animations or interactions.
 */
function render() {
	// cirlcle the camera around as long as there isn't a project
	// in view or one being hovered on.
	if (!projectInView && !stopCamera) {
		circleCamera();
	}

	// if (isExpanding) {
	// 	expandSphere();
	// }

	// if (isShrinking) {
	// 	shrinkSphere();
	// }
	
	// if (selectedProject) {
	// 	zoomToSelection();
	// }

	// if (zoomOut) {
	// 	zoomCameraOut();
	// }

	if (rotateCamera) {
	    spinCamera();
	}

	// find intersections
	raycaster.setFromCamera( mouse, camera );

	var intersects = raycaster.intersectObjects( scene.children );

	// Check if the mouse pointer has intersected any of the objects
	if ( intersects.length > 0 ) {
		onIntersection(intersects);
	} else {
		onNoIntersections();
	}

	renderer.render( scene, camera );
}

	



// })();

