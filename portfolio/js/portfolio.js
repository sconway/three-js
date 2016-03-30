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
	clickedOnce = false,
	mouseDown = false,
	rotateSphere = false,
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
	spinTheta = 0.005,
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
	loaders = [],
	objects = [];


// init();
// animate();

                                 
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
 * Helper function that will only be fired once. Thanks to David Walsh for
 * the code. 
 *
 *  @param fn       :  Lambda function
 *  @param context  :  Object
 */
function once(fn, context) { 
	var result;

	return function() { 
		if(fn) {
			result = fn.apply(context || this, arguments);
			fn = null;
		}

		return result;
	};
}


// This guy will only fire once :)
var canOnlyFireOnce = once(function() {
	spheresToRandom();
});


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
	$(".canvas").click( function(event) { 
		if ( window.innerWidth > 1000 ) {
			zoomToProject();
		} else {
			mouseDown = true;
			showProject(event);
		}
	});

	$(".js-project-details").click(function(event) { 
		event.stopPropagation();

		zoomToProject(); 
	});

	$(".js-back-to-project").click(function() { backToProjectView(); });
	
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
 * @param      x           :     Integer
 * @param      y           :     Integer
 *
 */
function setTeaserContainer(current, x, y) {
	var distance = camera.position.distanceTo(current.position);
	console.log("distance: ", distance);

	// make sure the mouse has been moved before dropping the
	// teaser down. Prevents it from showing on load.
	if ( (x > 0 && y > 0) || mouseDown ) {
		$("#teaserName, #projectTitle").html(current.children[0].name);

		if ( window.innerWidth > 1000 ) {
			if ( x > window.innerWidth/2 ) {
				var xFactor = distance < window.innerWidth ? 650 : 600;

				// mouse on right bottom of screen (Q4)
				if ( y > window.innerHeight/2 ) {
					revealTeaser(x - xFactor, y - 275);
				} 
				// mouse on right top of screen (Q2)
				else {
			    	revealTeaser(x - xFactor, y - 60);
				}
			} else {
				var xFactor = distance < window.innerWidth ? 300 : 250;

				// mouse on the bottom left of screen (Q3)
				if ( curMouse.y > window.innerHeight/2 ) {
					revealTeaser(x + xFactor, y - 275);
				} 
				// mouse on the top left of screen (Q4)
				else {
					revealTeaser(x + xFactor, y - 60);
				}
			}
		} else {
			// just place the teaser in the bottom center when we are on mobile
			revealTeaser(30, 200);
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

	for ( var i = 0; i < numImages; i++ ) {
		var size     = ((i + 2) * 10) - ((i + 1) * 5),
			material = new THREE.MeshBasicMaterial( {  
							map: loaders[i], 
							side: THREE.DoubleSide 
						}),
			color    = new THREE.ShaderMaterial( {
						    uniforms: 
							{ 
								"c": { type: "f", value: 1.0 },
								"p": { type: "f", value: 1.0 },
								glowColor: { type: "c", value: new THREE.Color(0xffffff * Math.random()) },
								viewVector: { type: "v3", value: camera.position }
							},
							vertexShader:   document.getElementById( 'vertexShader'   ).textContent,
							fragmentShader: document.getElementById( 'fragmentShader' ).textContent,
							side: THREE.FrontSide,
							blending: THREE.AdditiveBlending,
							transparent: true
						} ),
			moonGlow   = new THREE.Mesh( 
						new THREE.SphereGeometry( 40, 64, 64 ),
						color.clone()
						),
			group    = new THREE.Object3D();

		moonGlow.scale.multiplyScalar(1.2);
		moonGlow.name = names[i];
 		group.name = "project_group";

		text = createText(moonGlow.name, moonGlow.position);

		group.add( moonGlow );
		group.add( text );

		// controls.push( new THREE.DeviceOrientationControls( group , true ) );

		objects.push(group);
		scene.add( group );
	}


	// since there won't be a current sphere on page load, set one initially,
	// and then move the spheres into a random location in the 3D space.
	curSphere = scene.clone().children[rando(3,7)].children[0];
	hideText();
	spheresToRandom();
}


/**
 * Creates and returns a THREE.js material with a video mapped to the surface.
 * The name parameter is used to determine which video to apply.
 * 
 * @param      name     :     string
 *
 * returns     THREE.material
 */
function addVideo(name) {
	video = document.getElementById( name );
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
				opacity: 0.9,
				overdraw: true, 
				side:THREE.DoubleSide 
			} );
}


/**
 * Adds lighting to the scene. Stays in a fixed position.
 */
function addLight() {
	var group  = new THREE.Object3D();
	group.add( new THREE.AmbientLight( 0x222222 ) );
	light = new THREE.HemisphereLight( 0x666666 , 0x000000);
	light.position.set( 1, 1, 1 ).normalize();
	group.add( light );
	group.name = "project_light";
	scene.add( group );
}


/**
 * Creates the 3-D text and returns it
 *
 * @param      text     :     string
 * @param      pos      :     Vector3 object
 *
 * returns     THREE.Mesh
 */
function createText(text, pos) {
	var material = new THREE.MeshPhongMaterial(
		{
        	color:  0xf8f8f8
    	}),
    	textGeom = new THREE.TextGeometry( text , 
    	{
    		font: font,
    		size: window.innerWidth > 1000 ? 14.0 : 22.0,
    		height: 50.0,
    		bevelThickness: 4.0
    	}),
    	textMesh = new THREE.Mesh( textGeom, material );
    
    textMesh.position.x = pos.x + 50;
    textMesh.position.y = pos.y - 10;
    textMesh.position.z = pos.z - 25;
    textMesh.name = "project_name";
    textMesh.lookAt( camera.position );

    return textMesh;
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


function hideText() {
	var numChildren = scene.clone().children.length;

	for (var i = 1; i < numChildren; i++) {
		// removeObject(name);
		if (scene.children[i].name === "project_group") {
			scene.children[i].children[1].material.visible = false;
		}
	}
}


/*
 * Sets the text mesh for each project group to be visible. Iterates
 * through the children in the scene to find the various project groups.
 */
function showNames() {
	var numChildren = scene.clone().children.length;

	for (var i = 1; i < numChildren; i++) {
		// removeObject(name);
		if (scene.children[i].name === "project_group") {
			scene.children[i].children[1].material.visible = true;
		}
	}
}


/**
 * Creates the 3-D container for the project description
 *
 * @param      pos     :     Vector3
 *
 */
function revealTeaser(x, y) {
	if (INTERSECTED) {
		console.log("revealing Teaser");
		$("#teaser")
			.css({
				left: window.innerWidth > 1000 ? (x + "px") : "50%",
				top:  window.innerWidth > 1000 ? (y + "px") : "50%"
			})
			.addClass("active");	
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


/**
 * Called after a click on a mobile device. It detects if there are any
 * objects clicked on, and passes those objects to a function that handles
 * them. A function to reset the scene is called if there are no objects
 * clicked on.
 */
function showProject(event) {
	event.preventDefault();

	curMouse.x = ( event.clientX / renderer.domElement.clientWidth ) * 2 - 1;
	curMouse.y = - ( event.clientY / renderer.domElement.clientHeight ) * 2 + 1;

	raycaster.setFromCamera( mouse, camera );

	var intersects = raycaster.intersectObjects( objects, true );

	// Make sure there are intersects.
	if ( intersects.length > 0 ) {

		if ( curSphere === intersects[0].object && clickedOnce ) {
			clickedOnce = false;
			zoomToProject();
		} else {
			clickedOnce = true;
			onMobileIntersection(intersects);
		}
	} else {
		clickedOnce = false;
		onNoMobileIntersection();
	}

}


/**
 * This function is called whenever the canvas is clicked on. It sets the
 * variables used to control the current state, and then calls the function
 * responsible for zooming the camera toward the selected object.
 */
function zoomToProject() {
	if (!projectInView && !isTweening) {
		raycaster.setFromCamera( mouse, camera );

		// var intersect = raycaster.intersectObjects( scene.children, true )[0].object;
		// selectedProject = intersect;
		selectedProject = curSphere;
		console.log(selectedProject);
		lastCameraPosition = camera.clone().position;
		projectInView = true;
		$("#teaser").removeClass("active");

		zoomToSelection(selectedProject.parent.position);

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
	camera.position.x = radius * Math.sin( THREE.Math.degToRad( theta ) );
	camera.position.y = radius * Math.sin( THREE.Math.degToRad( theta ) );
	camera.lookAt( scene.position );
	camera.updateMatrixWorld();
	var numChildren = objects.length;

	for (var i = 0; i < numChildren; i++) {
		objects[i].lookAt(camera.position);
	}
}


/**
 * Iterate the rotation of the camera just a bit
 */
function spinCamera() {
	camera.rotation.x -= 0.001;
    camera.rotation.y -= 0.001;
}


/**
 * Iterate the rotation of the current sphere just a bit
 */
function spinSphere() {
	if (curSphere) {
		curSphere.parent.rotation.x -= spinTheta;
	    curSphere.parent.rotation.y -= spinTheta;
	}
}


/**
 * Moves all spheres on the scene to the location of the intersected object.
 *
 * @param      current     :     THREE.Mesh
 *
 */
function spheresToCurrent(current) {
	// clone the scene so the number of children doesn't change when we remove
	var children = scene.clone().children, 
		numChildren = children.length;

	console.log("current: ", current);

	// Tween all project spheres, starting at the second child, since the
	// first child in the scene is the light.
	for (var i = 1; i < numChildren; i++) {
		if (current != scene.children[i] && !isTweening) {
			new TWEEN.Tween(scene.children[i].position)
				.to({
					x: window.innerWidth > 1000 ? current.position.x : 0,
					y: window.innerWidth > 1000 ? current.position.y : 350,
					z: window.innerWidth > 1000 ? current.position.z : 0
				}, 750)
				.easing( TWEEN.Easing.Linear.None )
				.onStart( function() {
					isTweening = true;
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
				    	setTeaserContainer(current, curMouse.x, curMouse.y);
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
	var numChildren = objects.length;

	// Tween all project spheres, starting at the second child, since the(i * 65 - (i * 4)) 
	// first child in the scene is the light.
	for ( var i = 0; i < numChildren; i++ ) {
		var posX = window.innerWidth > 1000 ? (-600 + ((i+1) * 100)) * (i % 2 === 0 ? 1 : -1) : -60,
			posY = window.innerWidth > 1000 ? ((i + 1) * 60 * (i % 2 === 0 ? 1 : -1)) : (i * (65 - i)) * (i % 2 === 0 ? -1 : 1),
			posZ = window.innerWidth > 1000 ? (Math.random() * 700 - 300) : rando(200, 400),
			vector = new THREE.Vector3(posX, posY, posZ);

		// Make sure we don't tween the current sphere and make sure that the
		// spheres are not currently being tweened.
		if ( curSphere != objects[i] && !isTweening && 
			 curSphere && objects[i].name !== "project_name" ) {

			new TWEEN.Tween(objects[i].position)
				.to({
					x: posX,
					y: posY,
					z: posZ
				}, 1250)
				.easing( TWEEN.Easing.Elastic.InOut )
				.onStart( function() {
					isTweening = true;
					curSphere.material = new THREE.ShaderMaterial( {
						    uniforms: 
							{ 
								"c":   { type: "f", value: 1.0 },
								"p":   { type: "f", value: 1.0 },
								glowColor: { type: "c", value: new THREE.Color(0xffffff * Math.random()) },
								viewVector: { type: "v3", value: camera.position }
							},
							vertexShader:   document.getElementById( 'vertexShader'   ).textContent,
							fragmentShader: document.getElementById( 'fragmentShader' ).textContent,
							side: THREE.FrontSide,
							blending: THREE.AdditiveBlending,
							transparent: true
						} );
					$("#teaser").removeClass("active");
				})
			    .onUpdate( function() {
			    	renderer.render(scene, camera);
			    })
			    .onComplete( function() {
			    	// called once when the tween completes
			    	if ( isTweening ) {
			    		isTweening = false;
			    		shrinkSphere();
				    	$("#teaser").removeClass("active");
			    		showNames();
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
	var numChildren = scene.clone().children.length,
		scaleSize   = window.innerWidth > 1000 ? 8 : 4,
		sphere      = object.children[0];

	console.log("expand sphere called: ", object);

	new TWEEN.Tween(object.scale)
		.to({
			x: scaleSize,
			y: scaleSize,
			z: scaleSize
		}, 500)
		.easing( TWEEN.Easing.Circular.Out )
	    .onStart( function() {
	    	
	    })
	    .onUpdate( function() {
	    	renderer.render(scene, camera);
	    })
	    .onComplete( function() {
	    	// object.material = new THREE.MeshBasicMaterial( {  
						// 	map: loaders[names.indexOf(object.name)], 
						// 	side: THREE.DoubleSide 
						// });
			sphere.material = addVideo(sphere.name);
			if ( window.innerWidth > 1000 ) {
	    		rotateSphere = true;
	    	}
	    })
	    .start();
}


/**
 * Scales the supplied object down by tweening the scale property.
 */
function shrinkSphere() {
	var numChildren = objects.length;

	for (var i = 0; i < numChildren; i++) {
		new TWEEN.Tween(objects[i].scale)
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
 * This function is called after a click on a mobile device. It moves
 * the clicked sphere up to the top and calls the other spheres to move
 * towards it. 
 *
 * @param      sphere     :     THREE.Object
 *
 */
function moveSphereUp(sphere) {
	new TWEEN.Tween(sphere.position)
		.to({
			x: 0,
			y: 350,
			z: 0
		}, 500)
		.easing( TWEEN.Easing.Circular.Out )
		.onStart( function() {
			spheresToCurrent(sphere);
		})
	    .onUpdate( function() {
	    	renderer.render(scene, camera);
	    })
	    .onComplete( function() {
	    })
	    .start();
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
	    	// camera.lookAt(selectedProject.position);
	    	renderer.render(scene, camera);
	    })
	    .onComplete( function() {
	    	rotateCamera = true;
	    	spinTheta = 0.001;
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
	    	camera.lookAt(scene.position);
	    	renderer.render(scene, camera);
	    })
	    .onComplete( function() {
	    	selectedProject = null;
			projectInView = false;
			stopCamera = false;
			intersectMutex = true;
			spinTheta = 0.005;
			TWEEN.removeAll();
			spheresToRandom();
			shrinkSphere();
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
 	if ( INTERSECTED != intersects[0].object && !isTweening && 
 		 intersects[0].object.name != "project_name" &&
 		 curMouse.x !== 0 && curMouse.y !== 0 ) {

		$("html").css({cursor: 'pointer'});
		curSphere = INTERSECTED = intersects[0].object;

		if ( !projectInView ) {
			stopCamera = true;
			unIntersectMutex = true;
		}

		if ( intersectMutex ) {
			intersectMutex = false;
			hideText();
			expandSphere(curSphere.parent);
			spheresToCurrent(curSphere.parent);
		}
	}
}



function onMobileIntersection(intersects) {

    curSphere = INTERSECTED = intersects[0].object;

	if ( !projectInView ) {
		stopCamera = true;
		unIntersectMutex = true;
	}

	console.log("INTERSECTED", curSphere);
	// Only call this once, and if a click has been made.
	// Prevents it from being called initially.
	if ( intersectMutex ) {
		console.log("mobile intersection");
		intersectMutex = false;
		hideText();
		expandSphere(curSphere.parent);
		moveSphereUp(curSphere.parent);
	}

}


function onNoMobileIntersection() {

	// Don't do anything if there's a project in view.
	if ( !projectInView ){
		stopCamera     = false;
		intersectMutex = true;
		// Only call this once, and if a click has been made.
		// Prevents it from being called initially since there
		// will be no intersections on load.
		if ( unIntersectMutex ) {
			console.log("no intersections");
			spheresToRandom();
			shrinkSphere();
			if ( video ) video.pause();
			rotateSphere = false;
			unIntersectMutex = false;
		}
	}
	
	INTERSECTED = null;
}



/*
 * This function handles a hover off of a given project object.
 * It removes any project text and sets the variables to size the
 * orbs back to their original size.
 */
function onNoIntersections(intersects) {
	
	// Don't do anything if there's a project in view.
	if ( !projectInView ){
		stopCamera     = false;
		intersectMutex = true;
		if ( unIntersectMutex ) {
			spheresToRandom();
			shrinkSphere();
			if ( video ) video.pause();
			rotateSphere = false;
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
	if ( !projectInView && !stopCamera ) {
		circleCamera();
	}

	if ( rotateCamera ) {
	    spinCamera();
	}

	if ( rotateSphere ) {
		spinSphere();
	}

	// updates the sample video 
	if ( video ) {
		if ( video.readyState === video.HAVE_ENOUGH_DATA ) {
			videoImageContext.drawImage( video, 0, 0 );
			if ( videoTexture ) 
				videoTexture.needsUpdate = true;
		}
	}


	// find intersections
	raycaster.setFromCamera( mouse, camera );

	var intersects = raycaster.intersectObjects( scene.children, true );

	// Check if the mouse pointer has intersected any of the objects
	if ( window.innerWidth > 1000 ) {
		if ( intersects.length > 0 ) {
			onIntersection(intersects);
		} else {
			onNoIntersections();
		}
	}

	renderer.render( scene, camera );
}

	



// })();

