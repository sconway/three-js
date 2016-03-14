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
	alpha,
	beta,
	gamma,
	font,
	sprite,
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
	video, videoImage, videoImageContext, videoTexture,
	intersectMutex = true,
	unIntersectMutex = true,
	isTweening = false,
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

	loadFont();
	raycaster = new THREE.Raycaster();
	renderScene();

	document.addEventListener( 'mousemove', onDocumentMouseMove, false );
	// window.addEventListener("devicemotion", handleMotion, false);
	$(".canvas").click(function() { zoomToProject(); });
	$("#backBtn").click(function() { backToProjectView(); });
	
	var windowResize = new THREEx.WindowResize(renderer, camera);
}


function renderScene() {
	renderer = new THREE.WebGLRenderer({alpha : true});
	renderer.setClearColor( 0x0e0e15, 1 );
	renderer.setPixelRatio( window.devicePixelRatio );
	renderer.setSize( window.innerWidth, window.innerHeight );
	renderer.sortObjects = false;
	container.appendChild(renderer.domElement);
}


/**
 * Loads in the pre-defined font and saves it to a variable. When finished,
 * the function to create and add the text is called.
 */
function loadFont() {
	var loader = new THREE.FontLoader();
		loader.load( 'js/helvetiker_regular.typeface.js', function ( response ) {
			font = response;
			addShapes();
		} );
}


/**
 * Places the project teaser in a position relative to the hovered project.
 * This function treats the screen as a cartesinal coordinate plane, and 
 * performs the following logic: If the project is in the first quadrant
 * (upper left), place the teaser to the right and below. If in Q2, place
 * the teaser left and below. If Q3, place it right and above. And finally,
 * for Q4, place the teaser left and above. Helps keep the page balanced :)
 *
 * @param      current     :     THREE.Mesh
 *
 */
function setTeaserContainer(current) {
	// make sure the mouse has been moved before dropping the
	// teaser down. Prevents it from showing on load.
	if (curMouse.x > 0 && curMouse.y > 0) {
		$("#teaserName, #projectTitle").html(current.name);

		if (curMouse.x > window.innerWidth/2) {
			// mouse on right bottom of screen (Q4)
			if (curMouse.y > window.innerHeight/2) {
				revealTeaser(curMouse.x - 430, curMouse.y - 275, true);
				// addTeaserBackground(current.position.x + 375, 
				// 					current.position.y - 10, 
				// 					-350,
				// 					current);
			} 
			// mouse on right top of screen (Q2)
			else {
		    	revealTeaser(curMouse.x - 425, curMouse.y - 60, false);
		    	// addTeaserBackground(current.position.x + 375, 
							// 		current.position.y + 30, 
							// 		-350,
							// 		current);
			}
		} else {
			// mouse on the bottom left of screen (Q3)
			if (curMouse.y > window.innerHeight/2) {
				revealTeaser(curMouse.x + 115, curMouse.y - 275, true);
				// addTeaserBackground(current.position.x - 375, 
				// 					current.position.y - 20, 
				// 					-350,
				// 					current);
			} 
			// mouse on the top left of screen (Q4)
			else {
				revealTeaser(curMouse.x + 115, curMouse.y - 60, false);
				// addTeaserBackground(current.position.x - 375, 
				// 					current.position.y + 30, 
				// 					-350,
				// 					current);
			}
		}
	}
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

	// var map = new THREE.TextureLoader().load( "images/sprite1.png" );
 //    var material = new THREE.SpriteMaterial( { map: map, color: 0xffffff, fog: true } );
 //    var sprite = new THREE.Sprite( material );
 //    scene.add( sprite );


	for ( var i = 0; i < numImages; i ++ ) {
		var size     = ((i + 2) * 10) - ((i + 1) * 5),
		    faceSize = rando(minFace, maxFace),
		    numFaces = Math.random(),
			material = new THREE.MeshBasicMaterial( {  
							map: loaders[i], 
							side: THREE.DoubleSide 
						}),
			color   = new THREE.MeshLambertMaterial( { 
							color: 0xffffff * Math.random(),
							side: THREE.DoubleSide,
							transparent: true,
							opacity: 0.9
						}),
			object = new THREE.Mesh( 
						new THREE.SphereGeometry( size, 64, 64 ),
						color
						);

			// var map = new THREE.TextureLoader().load( "images/sprite1.png" );
		 //    var material = new THREE.SpriteMaterial( { map: map, color: 0xffffff, fog: true } );
		 //    sprite = new THREE.Sprite( material );
		 //    scene.add( sprite );
 
		object.rotation.x = Math.random() * 2 * Math.PI;
		object.rotation.y = Math.random() * 2 * Math.PI;
		object.rotation.z = Math.random() * 2 * Math.PI;

		object.name = names[i];

		// addText(object.name, object.position);

		// controls.push( new THREE.DeviceOrientationControls( object , true ) );

		scene.add( object );
	}
}


function addVideo() {
	// create the video element
	video = document.getElementById( 'video' );
	video.load(); // must call after setting/changing source
	video.play();
	
	videoImage = document.createElement( 'canvas' );
	videoImage.width = 852;
	videoImage.height = 478;

	videoImageContext = videoImage.getContext( '2d' );
	// background color if no video present
	videoImageContext.fillStyle = '#000000';
	videoImageContext.fillRect( 0, 0, videoImage.width, videoImage.height );

	videoTexture = new THREE.Texture( videoImage );
	videoTexture.minFilter = THREE.LinearFilter;
	videoTexture.magFilter = THREE.LinearFilter;
	
	return new THREE.MeshBasicMaterial( { 
				map: videoTexture, 
				transparent: true,
				opacity: 0.7,
				overdraw: true, 
				side:THREE.DoubleSide 
			} );
	// the geometry on which the movie will be displayed;
	// 		movie image will be scaled to fit these dimensions.
	// var movieGeometry = new THREE.PlaneGeometry( 240, 100, 4, 4 );
	// var movieScreen = new THREE.Mesh( movieGeometry, movieMaterial );
	// movieScreen.position.set(0,50,0);
	// scene.add(movieScreen);
	
	// camera.position.set(0,150,300);
	// camera.lookAt(movieScreen.position);
}


/**
 * Creates and adds the teaser for the hovered project at the specified
 * position. The position is intended to be relative to the projects
 * current position.
 *
 * @param		x 		: 		Integer
 * @param		y 		: 		Integer
 * @param		z 		: 		Integer
 * @param       cur     :       THREE.Mesh
 */
function addTeaserBackground(x, y, z, cur) {
	var geometry = new THREE.PlaneGeometry( 700, 600 ),
	    material = new THREE.MeshBasicMaterial( 
	    {
	    	map: loaders[names.indexOf(cur.name)],
	    	// color: 0xffff00,
	    	side: THREE.DoubleSide
	    }),
	    plane = new THREE.Mesh( geometry, addVideo() );

	cur.lookAt( camera.position );

	plane.name = "project_teaser";
	plane.position.x = x;
	plane.position.y = y;
	plane.position.z = z;

	scene.add( plane );
	plane.lookAt( camera.position )
}



function addNames() {
	var len = names.length;

	for (var i = 0; i < len; i++) {
		var el = scene.getObjectByName(names[i]);
		if (el.name.length > 0) {
			addText(el.name, el.position);
		}
	}
}


/**
 * Adds lighting to the scene. Stays in a fixed position.
 */
function addLight() {
	var light = new THREE.HemisphereLight( 0xdddddd , 0x000000, 0.6 );
	light.position.set( 1, 1, 1 ).normalize();
	light.name = "project_light";
	scene.add( light );
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
        	color:  0xf8f8f8
    	}),
    	textGeom = new THREE.TextGeometry( text , 
    	{
    		font: font,
    		size: 14.0,
    		height: 25.0,
    		bevelThickness: 4.0
    	}),
    	textMesh = new THREE.Mesh( textGeom, material );
    
    textMesh.position.x = pos.x + 50;
    textMesh.position.y = pos.y - 10;
    textMesh.position.z = pos.z - 25;
    textMesh.name = "project_name";

    scene.add( textMesh );

    textMesh.lookAt( camera.position );
}


/**
 * Removes the project name text however many times are specified.
 *
 * @param		numItems	: 	 integer
 */
function removeText(numItems, name) {
	for (var i = 0; i < numItems; i++) {
		removeObject(name);
	}
}


/**
 * Creates the 3-D container for the project description
 *
 * @param      pos     :     Vector3
 *
 */
function revealTeaser(x, y, slideUp) {
	if (INTERSECTED) {
		if (slideUp) {
			$("#teaser")
				.css({
					left: x + "px",
					top:  y + "px"
				})
				.addClass("slide-up");
		} else {
			$("#teaser")
				.css({
					left: x + "px",
					top:  y + "px"
				})
				.addClass("slide-down");	
		}
	}
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

		removeText(scene.clone().children.length, "project_name");
		removeObject("project_teaser");
		$("#teaser").removeClass("slide-up").removeClass("slide-down");

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
}


/**
 * This function is called about 60 times per second, and is responsible
 * for moving the camera back and forth over an arc. It also updates the 
 * the project names to be viewing the camera.
 */
function circleCamera() {
	theta += 0.2;
	camera.position.x = radius * Math.cos( THREE.Math.degToRad( theta ) );
	camera.position.y = radius * Math.cos( THREE.Math.degToRad( theta ) );
	camera.lookAt( scene.position );
	camera.updateMatrixWorld();
	var numChildren = scene.children.length;

	for (var i = 1; i < numChildren; i++) {
		// if (scene.children[i].name === "project_name") {
			scene.children[i].lookAt(camera.position);
		// }
	}
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
	// clone the scene so the number of children doesn't change when we remove
	var children = scene.clone().children; 
		numChildren = children.length;

	// Tween all project spheres, starting at the second child, since the
	// first child in the scene is the light.
	for (var i = 1; i < numChildren; i++) {
		if (curSphere != scene.children[i] && !isTweening) {
			new TWEEN.Tween(scene.children[i].position)
			.to({
				x: current.position.x,
				y: current.position.y,
				z: current.position.z
			}, 750)
			.easing( TWEEN.Easing.Linear.None )
			.onStart( function() {
				isTweening = true;
				// remove all project names from the scene
				removeText(numChildren, "project_name");
				removeObject("project_teaser");
			})
		    .onUpdate( function() {
		    	// if the project is hovered off while the other spheres are 
		    	// moving towards it, reset all tweens and sphere positions.
		    	if ( !INTERSECTED ) {
		    		TWEEN.removeAll();
		    		isTweening = false;
		    		spheresToRandom();
		    		shrinkSphere();
		    		console.log("Project hovered off; Removing all tweens.");
		    	}
		    	renderer.render(scene, camera);
		    })
		    .onComplete( function() {
		    	// ensure this is only called once, right when the tween's done
		    	if ( isTweening ) {
		    		isTweening = false;
			    	console.log("Done tweening to hovered sphere index is: ", i);
			    	setTeaserContainer(current);
			    	current.material = addVideo();	
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

	// Tween all project spheres, starting at the second child, since the
	// first child in the scene is the light.
	for (var i = 1; i < numChildren; i++) {
		var posX = Math.random() * 1000 - 600,
			posY = Math.random() * 900 - 500,
			posZ = Math.random() * 1000 - 600,
			vector = new THREE.Vector3(posX, posY, posZ);

		// Make sure we don't tween the current sphere and make sure that the
		// spheres are not currently being tweened.
		if (curSphere != scene.children[i] && 
			!isTweening && 
			scene.children[i].name !== "project_name" &&
			scene.children[i].name !== "project_teaser") {

			new TWEEN.Tween(scene.children[i].position)
				.to({
					x: posX,
					y: posY,
					z: posZ
				}, 1250)
				.easing( TWEEN.Easing.Elastic.InOut )
				.onStart( function() {
					isTweening = true;
					curSphere.material = new THREE.MeshLambertMaterial( { 
												color: 0xffffff * Math.random(),
												side: THREE.DoubleSide,
												transparent: true,
												opacity: 0.9
											});
					$("#teaser").removeClass("slide-up").removeClass("slide-down");
				})
			    .onUpdate( function() {
			    	renderer.render(scene, camera);
			    } )
			    .onComplete( function() {
			    	if (isTweening){
			    		isTweening = false;
			    		curSphere.material = new THREE.MeshLambertMaterial( { 
												color: 0xffffff * Math.random(),
												side: THREE.DoubleSide,
												transparent: true,
												opacity: 0.9
											});
				    	$("#teaser").removeClass("slide-up").removeClass("slide-down");
			    		addNames();
				    	console.log("Done tweening; adding project names. index is: ", i);
			    	}
			    	
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
	var numChildren = scene.clone().children.length;

	new TWEEN.Tween(object.scale)
		.to({
			x: 4,
			y: 4,
			z: 4
		}, 500)
		.easing( TWEEN.Easing.Circular.Out )
	    .onStart( function() {
	    	
	    })
	    .onUpdate( function() {
	    	renderer.render(scene, camera);
	    })
	    .onComplete( function() {
	    	console.log("done expanding sphere. Adding video texture.");
	    	// object.material = addVideo();
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

    if (selectedObject) {
		scene.remove( selectedObject );
    	console.log("Just removed: ", selectedObject);
    } 
}


/*
 * This function handles an intersection with a given project object.
 * 
 * @param    intersects    :    array
 *
 */
function onIntersection(intersects) {
	var numIntersects = intersects.length, 
		children      = scene.clone().children,
		numChildren   = children.length;

	// only run this if the intersected 
 	if ( INTERSECTED != intersects[0].object && 
 		 intersects[0].object.name != "project_name" &&
 		 intersects[0].object.name != "project_teaser" ) {

		$("html").css({cursor: 'pointer'});
		curSphere = INTERSECTED = intersects[0].object;
		
		if (!projectInView) {
			stopCamera = true;
			unIntersectMutex = true;
		}

		if (intersectMutex) {
			intersectMutex = false;
			removeText(numChildren, "project_name");
			removeObject("project_teaser");
			expandSphere(curSphere);
			spheresToCurrent(curSphere);
		}
	}
}


/*
 * This function handles a hover off of a given project object.
 * It removes any project text and sets the variables to size the
 * orbs back to their original size.
 */
function onNoIntersections(intersects) {
	
	if ( !projectInView ){
		stopCamera     = false;
		intersectMutex = true;
		if (unIntersectMutex) {
			removeText(scene.clone().children.length, "project_name");
			removeObject("project_teaser");
			$("#teaser").removeClass("slide-up").removeClass("slide-down");
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
	// updateControls();
	render();
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

	if (rotateCamera) {
	    spinCamera();
	}

	// updates the sample video 
	if (video) {
		if ( video.readyState === video.HAVE_ENOUGH_DATA ) {
			videoImageContext.drawImage( video, 0, 0 );
			if ( videoTexture ) 
				videoTexture.needsUpdate = true;
		}
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

