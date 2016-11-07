// (function() {

var container, controls, camera, scene, raycaster, renderer, curSphere, cssRenderer,
	positions, mainMesh, sprite1, sprite2, sprite3, sprite4, sprite5, linePlane,
	curProject, projectImage1, projectImage2, projectImage3, projectImage4,
	projectText1, projectText2, projectText3, projectText4, json, glowMesh,
	intersectMutex = true,  unIntersectMutex = true,  isTweening  = false,
	movePlane      = false, projectClicked   = false, projectClickedAfterTween = false, clickedOnce = false,
	stopCamera     = false, projectInView    = false, theta = 0, json,
	spinTheta = 0.005, cameraZ = 2000, cubeSize = 50, numProjectPics = 8,
	mouse      = new THREE.Vector2(), 
	curMouse   = new THREE.Vector2(),
	planeGroup = new THREE.Object3D(),
	shapeGroup = new THREE.Object3D(), 
	iconGroup  = new THREE.Object3D(),
	clock      = new THREE.Clock(),
	runtime    = new ShaderFrogRuntime(),
	INTERSECTED,
	aspect = window.innerWidth / window.innerHeight,
	names  = [ "Wentworth", "BB&K", "Father Peyton", "ARC Advisory", "Standish Mellon", 
			   "Wolf Greenfield", "Zildjian Cymbals", "Enernoc" ],
	loaders = [], icons = [], planes = [], objects = [];


var PLANE_0_Z         = -1000,
	PLANE_0_X         = -280,
	PLANE_0_X_ORIGIN  = -1000,
	PLANE_1_Z         = -2100,
	PLANE_1_X         = 620,
	PLANE_1_X_ORIGIN  = 1000,
	PLANE_2_Z         = -4700,
	PLANE_2_X         = -550,
	PLANE_2_X_ORIGIN  = -4000,
	PLANE_3_Z         = -3700,
	PLANE_3_X         = 280,
	PLANE_3_X_ORIGIN  = 4000,
	PLANE_4_Z         = -6300,
	PLANE_4_X         = -280,
	PLANE_4_X_ORIGIN  = -6000,
	PLANE_5_Z         = -7600,
	PLANE_5_X         = 620,
	PLANE_5_X_ORIGIN  = 6000,
	PLANE_6_Z         = -10400,
	PLANE_6_X         = -350,
	PLANE_6_X_ORIGIN  = -8000,
	PLANE_7_Z         = -9000,
	PLANE_7_X         = 280,
	PLANE_7_X_ORIGIN  = 8000,
	PLANE_Z_THRESHOLD = -1200;


uniforms = {
	amplitude: { value: 5.0 },
	opacity:   { value: 0.3 },
	color:     { value: new THREE.Color( 0xff0000 ) }
};

var shaderMaterial = new THREE.ShaderMaterial( {
	uniforms:       uniforms,
	vertexShader:   document.getElementById( 'vertexshader' ).textContent,
	fragmentShader: document.getElementById( 'fragmentshader' ).textContent,
	blending:       THREE.AdditiveBlending,
	depthTest:      false,
	transparent:    true
});

                                 
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
 	return (window.innerWidth < 992);
 }


/**
 * This function is responsible for scrolling the page to the supplied
 * center point. It creates an interval and calls the scrollBy method
 * within that interval to slide up or down the page.
 *
 *  @param scrollPoint : Integer
 *  @param duration    : Integer
 */
function handleSectionScroll( scrollPoint, duration ) {
    $('html, body').stop().animate( {scrollTop: scrollPoint}, duration, "linear" );
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
	spheresToRandom( 1250 );
});


/**
 * Converts an objects position in the scene to a 2D vector,
 * relative to the device viewport.
 */
function toScreenPosition( obj ) {

    var vector = new THREE.Vector3();

    var widthHalf  = 0.5 * renderer.context.canvas.width ;
    var heightHalf = 0.5 * renderer.context.canvas.height;

    obj.updateMatrixWorld();
    vector.setFromMatrixPosition(obj.matrixWorld);
    vector.project(camera);


    vector.x = (   ( vector.x * widthHalf )  + widthHalf )  / ( isMobile() ? 2 : 1 );
    vector.y = ( - ( vector.y * heightHalf ) + heightHalf ) / ( isMobile() ? 2 : 1 );

    return { 
        x: vector.x,
        y: vector.y
    };

};


/**
 * This function initializes most of the components of this page.
 * It sets up the camera, light, and objects. It also adds the
 * various handlers that are used for interaction.
 */
function init() {

	container = document.getElementById("container");
	camera    = new THREE.PerspectiveCamera( 45, aspect, 1, 10000 );
	scene     = new THREE.Scene();
	raycaster = new THREE.Raycaster();

	camera.position.set( 0, 0, cameraZ );
	runtime.registerCamera( camera );

	renderScene();
	fadeLoader();
	addMainShape();
	addLight();
	addShapes();
	addPlane();
	parseProjectDetails();
	addIcons();
	createText();
	animateName();
	animateNameColor();
	handleProjectClicks();
 
	controls  = new THREE.OrbitControls( camera, renderer.domElement );

	document.addEventListener( 'mousemove', onDocumentMouseMove, false );
	window.addEventListener( 'resize', onWindowResize, false );

}


function handleProjectClicks() {

	// When there's a click, zoom to the project that's hovered on. On Mobile
	// devices, just do what we do for a desktop hover event.
	$(".canvas").on( 'mousedown', function( event ) {

		if ( !isMobile() ) {

			// Set the project clicked variable here in case the user clicks a
			// project while the spheres are moving to the middle. 
			if ( INTERSECTED && !projectInView ) {
				projectClicked = true;
			}

			// Make sure we are hovered on a project when a click is done,
			// no project has been clicked, and a project is not currently in view.
			if ( INTERSECTED && !projectInView && !projectClickedAfterTween && !isTweening ) {
				projectClickedAfterTween = true;
				currentProject = INTERSECTED.name;

				$("#addIcon").removeClass( "visible" );
				populateProjectDetails( currentProject );
				lastSphereToCurrent( INTERSECTED );
			}

		} else {
			checkMobileIntersection( event );
		}

	});


	$(".prev-next").click( function() {

		if ( $(this).hasClass("prev-btn") ) {
			currentProject = json[ currentProject ].previous;
			animateProjectPlanesBack( currentProject );
		} else {
			currentProject = json[ currentProject ].next;
			// populateProjectDetails( currentProject );
			animateProjectPlanesBack( currentProject );
		}

	});


	$("#backBtn").click( function() {

		// Return to the original view if we are still in the project view
		// and not currently tweening any animations.
		if ( projectClicked && !isTweening ) {
			animateProjectPlanesBack();
		}

	});

}


/**
 * This function sets up the scene renderer and sets things like
 * the size color, ratio, etc.
 */
function renderScene() {
	renderer = new THREE.WebGLRenderer({ alpha : true, antialias: true });
	renderer.setClearColor( 0x1a1a1b, 0 );
	renderer.setPixelRatio( window.devicePixelRatio );
	renderer.setSize( window.innerWidth, window.innerHeight );
	renderer.sortObjects = false;
	container.appendChild(renderer.domElement);

	cssRenderer = new THREE.CSS3DRenderer();
	cssRenderer.setSize(window.innerWidth, window.innerHeight);
	container.appendChild(cssRenderer.domElement);
}


/**
 * Called whenever the screen rezises, used to reset the renderer's
 * size and the camera's views so objects change proportionally.
 */
function onWindowResize(){

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );
    cssRenderer.setSize(window.innerWidth, window.innerHeight);

}


/**
 * This function is responsible for parsing the project details
 * JSON object and supplying the method to add the detail planes
 * with the information it needs.
 */
function parseProjectDetails() {

	var jqxhr = $.getJSON( "json/projects.json", function( data ) {
		json = data;
	    addProjectDetailPlanes();
	})
	.fail(function() {
		console.log( "error getting json " );
	});

}


/**
 * Adds lighting to the scene. Stays in a fixed position.
 */
function addLight() {

	var spotLight = new THREE.SpotLight( 0x999999, 0.25 );
	spotLight.position.set( 500, 500, 1000 );
	scene.add( spotLight );

}


/**
 * Adds the main project sphere
 */
function addMainShape() {

	var material     = new THREE.MeshLambertMaterial({
			color: 0xffffff,
			// emissive: 0xffff00
		}),
		geometry     = new THREE.SphereGeometry( 400, 64, 64 );

	mainMesh = new THREE.Mesh( geometry, material );

	shapeGroup.add( mainMesh );
	scene.add( shapeGroup );

	// Glow Material
	var customMaterial = new THREE.ShaderMaterial({
		    uniforms: {  },
			vertexShader:   document.getElementById( 'vertexShaderGlow'   ).textContent,
			fragmentShader: document.getElementById( 'fragmentShaderGlow' ).textContent,
			side: THREE.BackSide,
			blending: THREE.AdditiveBlending,
			transparent: true
		}),
		ballGeometry = new THREE.SphereGeometry( 400, 64, 64 );

	glowMesh = new THREE.Mesh( ballGeometry, customMaterial );

	glowMesh.scale.set( 2.0, 2.0, 2.0 );
	scene.add( glowMesh );

}


/**
 * Adds the main project plane. Small at first, its scale will
 * be tweened when the camera zooms into it.
 */
function addPlane() {

	var plane = new THREE.PlaneGeometry( 50, 50, 100, 100 );

	plane.center();

	var vertices = plane.vertices;
	var buffergeometry = new THREE.BufferGeometry();

	var position = new THREE.Float32Attribute( vertices.length * 3, 3 ).copyVector3sArray( vertices );
	buffergeometry.addAttribute( 'position', position )

	var displacement = new THREE.Float32Attribute( vertices.length * 3, 3 );
	buffergeometry.addAttribute( 'displacement', displacement );

	var customColor = new THREE.Float32Attribute( vertices.length * 3, 3 );
	buffergeometry.addAttribute( 'customColor', customColor );

	var color = new THREE.Color( 0xffffff );

	for( var i = 0, l = customColor.count; i < l; i ++ ) {
		color.setHSL( i / l, 0.5, 0.5 );
		color.toArray( customColor.array, i * customColor.itemSize );
	}

	linePlane = new THREE.Line( buffergeometry, shaderMaterial );
	linePlane.rotation.set( ( (Math.PI / 2 )  - 0.1 ), 0, 0 );
	linePlane.position.set( 0, -60, 150 );
	linePlane.scale.set( 0.001, 0.001, 0.001 );

	// add the plane to our group( also includes the project planes )
	planeGroup.add( linePlane );
	scene.add( planeGroup );

}



/**
 * This function adds the planes that contain information about the
 * current project. There are 
 *
 */
function addProjectDetailPlanes( ) {
	console.log("adding Project detial plane");

	// For every project picture/description, we will need to create a CSS3DObject
	// and add the corresponding image/text to it, before placing it in the scene.
	for ( var i = 0; i < numProjectPics; i++ ) {

		switch ( i ) {
			case 0:
				var planeImg = "<img src='images/projects/zildjian/home.jpg' >"
				// var planeImg = "";

				var img = document.createElement( 'div' );
				img.className = 'project-plane image';

				projectImage1 = new THREE.CSS3DObject( img );
				projectImage1.element.innerHTML = planeImg;
			    
				projectImage1.position.set( PLANE_0_X_ORIGIN, 0, PLANE_0_Z );
				projectImage1.rotation.y = 0.15;

				planeGroup.add( projectImage1 );
				planes.push( projectImage1 );

				break;
			case 1:
				var planeText = "My Role for the Zildjian project involved developing and styling the entire front end for this full site re-design. This website was built in the Drupal Content Management System, which gave the user full control over every piece of content throughout the site. "

				var text = document.createElement( 'div' );
				text.className = 'project-plane text';

				projectText1 = new THREE.CSS3DObject( text );
				projectText1.element.innerHTML = planeText;
			    
				projectText1.position.set( PLANE_1_X_ORIGIN, 0, PLANE_1_Z );
				projectText1.rotation.y = -0.2;

				planeGroup.add( projectText1 );
				planes.push( projectText1 );

				break;
			case 2:
				var planeText = "My Role for the Zildjian project involved developing and styling the entire front end for this full site re-design. This website was built in the Drupal Content Management System, which gave the user full control over every piece of content throughout the site. "

				var text = document.createElement( 'div' );
				text.className = 'project-plane text';

				projectText2 = new THREE.CSS3DObject( text );
				projectText2.element.innerHTML = planeText;
			    
				projectText2.position.set( PLANE_2_X_ORIGIN, 0, PLANE_2_Z );
				projectText2.rotation.y = 0.2;

				planeGroup.add( projectText2 );
				planes.push( projectText2 );

				break;
			case 3:
				var planeImg = "<img src='images/projects/zildjian/home.jpg' >"
				// var planeImg = "";

				var img = document.createElement( 'div' );
				img.className = 'project-plane image';

				projectImage2 = new THREE.CSS3DObject( img );
				projectImage2.element.innerHTML = planeImg;
			    
				projectImage2.position.set( PLANE_3_X_ORIGIN, 0, PLANE_3_Z );
				projectImage2.rotation.y = -0.15;

				planeGroup.add( projectImage2 );
				planes.push( projectImage2 );

				break;
			case 4:
				var planeImg = "<img src='images/projects/zildjian/home.jpg' >"
				// var planeImg = "";

				var img = document.createElement( 'div' );
				img.className = 'project-plane image';

				projectImage3 = new THREE.CSS3DObject( img );
				projectImage3.element.innerHTML = planeImg;
			    
				projectImage3.position.set( PLANE_4_X_ORIGIN, 0, PLANE_4_Z );
				projectImage3.rotation.y = 0.15;

				planeGroup.add( projectImage3 );
				planes.push( projectImage3 );

				break;
			case 5:
				var planeText = "My Role for the Zildjian project involved developing and styling the entire front end for this full site re-design. This website was built in the Drupal Content Management System, which gave the user full control over every piece of content throughout the site. "

				var text = document.createElement( 'div' );
				text.className = 'project-plane text';

				projectText3 = new THREE.CSS3DObject( text );
				projectText3.element.innerHTML = planeText;
			    
				projectText3.position.set( PLANE_5_X_ORIGIN, 0, PLANE_5_Z );
				projectText3.rotation.y = -0.2;

				planeGroup.add( projectText3 );
				planes.push( projectText3 );

				break;
			case 6:
				var planeText = "My Role for the Zildjian project involved developing and styling the entire front end for this full site re-design. This website was built in the Drupal Content Management System, which gave the user full control over every piece of content throughout the site. "

				var text = document.createElement( 'div' );
				text.className = 'project-plane text';

				projectText4 = new THREE.CSS3DObject( text );
				projectText4.element.innerHTML = planeText;
			    
				projectText4.position.set( PLANE_6_X_ORIGIN, 0, PLANE_6_Z );
				projectText4.rotation.y = 0.2;

				planeGroup.add( projectText4 );
				planes.push( projectText4 );

				break;
			case 7:
				var planeImg = "<img src='images/projects/zildjian/home.jpg' >"
				// var planeImg = "";

				var img = document.createElement( 'div' );
				img.className = 'project-plane image';

				projectImage4 = new THREE.CSS3DObject( img );
				projectImage4.element.innerHTML = planeImg;
			    
				projectImage4.position.set( PLANE_7_X_ORIGIN, 0, PLANE_7_Z );
				projectImage4.rotation.y = -0.15;

				planeGroup.add( projectImage4 );
				planes.push( projectImage4 );

				break;
			default:
				break;
		}

	}

	// scene.add( planeGroup );
}


/**
 * This function is called before the project details for a current project
 * are shown. It is responsible for populating the project planes with the
 * text and the images for the current project.
 *
 * @param     project     :     String
 *
 */
function populateProjectDetails( project ) {

	var currentProject = json[ project ];

	projectImage1.element.innerHTML = '<img src=' + currentProject.img1 + ' />';
	projectImage2.element.innerHTML = '<img src=' + currentProject.img2 + ' />';;
	projectImage3.element.innerHTML = '<img src=' + currentProject.img3 + ' />';;
	projectImage4.element.innerHTML = '<img src=' + currentProject.img4 + ' />';;

	projectText1.element.innerHTML = currentProject.text1;
	projectText2.element.innerHTML = currentProject.text2;
	projectText3.element.innerHTML = currentProject.text3;
	projectText4.element.innerHTML = currentProject.text4;

}


/**
 * 	This function is responsible for adding the various shapes to the canvas
 *  and placing them in random locations in 3D space
 */
function addShapes() {
	var numChildren = names.length;

	runtime.load( [
		'json/shader1.json',
		'json/shader2.json',
		'json/shader3.json',
		'json/shader4.json',
		'json/shader5.json',
		'json/shader6.json',
		'json/shader7.json',
		], function( shaderData ) {

		    var material, glowMaterial, geo, glowGeo;

		    // Loop through all the items we will make shapes for, and assign
		    // them a certain shader depending on their order.
		    for ( var i = 0; i < numChildren; i++ ) {

		    	switch (i) {
					case 0:
					    material     = runtime.get( shaderData[0].name );
					    geo     = new THREE.SphereGeometry( 60, 64, 64 );
						break;
					case 1:
					    material = runtime.get( shaderData[1].name );
					    geo = new THREE.SphereGeometry( 30, 64, 64 );
						break;
					case 2:
						material = runtime.get( shaderData[2].name );
						geo = new THREE.SphereGeometry( 25, 64, 64 );
						break;
					case 3:
						material = runtime.get( shaderData[0].name );
						geo = new THREE.SphereGeometry( 45, 64, 64 );
						break;
					case 4:
						material = runtime.get( shaderData[3].name );
						geo = new THREE.SphereGeometry( 60, 64, 64 );
						break;
					case 5:
						material = runtime.get( shaderData[4].name );
						geo = new THREE.SphereGeometry( 40, 64, 64 );
						break;
					case 6:
						material = runtime.get( shaderData[5].name );
						geo = new THREE.SphereGeometry( 40, 64, 64 );
						break;
					case 7:
						material = runtime.get( shaderData[6].name );
						geo = new THREE.SphereGeometry( 30, 64, 64 );
						break;
					default:
						break;
				}

		    	var gradient = new THREE.Mesh( geo, material );

				gradient.name = names[i];

				objects.push( gradient );
				shapeGroup.add( gradient );

			}


			// since there won't be a current sphere on page load, set one initially,
			// and then move the spheres into a random location in the 3D space.
			curSphere = objects[ rando(3,6) ];
			spheresToRandom( 1250 );

		});

}


/**
 * Adds the various icons that orbit around the main shape.
 */
function addIcons() {

	//DRINK
	var textTexture = new THREE.TextureLoader().load('images/assets/icon1.png');
	// CODE
	var imgTexture = new THREE.TextureLoader().load('images/assets/icon2.png');
	// MAGNET
	var texture3 = new THREE.TextureLoader().load('images/assets/icon3.png');
	// WEIGHT
	var texture4 = new THREE.TextureLoader().load('images/assets/icon4.png');
	// MONEY
	var texture5 = new THREE.TextureLoader().load('images/assets/icon5.png');

	var material1 = new THREE.SpriteMaterial( { map: textTexture } );
	var material2 = new THREE.SpriteMaterial( { map: imgTexture } );
	var material3 = new THREE.SpriteMaterial( { map: texture3 } );
	var material4 = new THREE.SpriteMaterial( { map: texture4 } );
	var material5 = new THREE.SpriteMaterial( { map: texture5 } );

	sprite1   = new THREE.Sprite( material1 );
	sprite2   = new THREE.Sprite( material2 );
	sprite3   = new THREE.Sprite( material3 );
	sprite4   = new THREE.Sprite( material4 );
	sprite5   = new THREE.Sprite( material5 );
	
	sprite1.position.set( -500, 100, 500 );
	sprite2.position.set( 400, 0, 1000 );
	sprite3.position.set( -600, 100, 1000 );
	sprite4.position.set( -1200, 0, 200 );
	sprite5.position.set( 1000, 100, -100 );
	
	sprite1.scale.set( 100, 100, 100 );
	sprite2.scale.set( 100, 100, 100 );
	sprite3.scale.set( 100, 100, 100 );
	sprite4.scale.set( 100, 100, 100 );
	sprite5.scale.set( 100, 100, 100 );

	iconGroup.add( sprite1 );
	iconGroup.add( sprite2 );
	iconGroup.add( sprite3 );
	iconGroup.add( sprite4 );
	iconGroup.add( sprite5 );

	scene.add( iconGroup );

}


/**
 * This function is called after the page loads and adds the classes
 * that fade the loading animation out. 
 */
function fadeLoader() {
	var body   = document.getElementById("body"),
		loader = document.getElementById("loader"),
		canvas = document.getElementById("container");

	loader.className += " fade-out";
	canvas.className += " fade-in";

	setTimeout(function() {
		body.removeChild(loader);
	}, 3000);
}


/**
 * Loads in the pre-defined font and saves it to a variable. When finished,
 * the function to create and add the text is called.
 */
function loadFont() {
	var loader = new THREE.FontLoader();
		loader.load( 'js/helvetiker_regular.typeface.js', function ( response ) {
			addMainShape();
			addShapes();
			createText();
		} );
}


/**
 * Creates the 3-D text and adds it to the scene. An object is created
 * for the project, and the type(s) of work involved.
 *
 */
function createText() {

 	var project = document.createElement( 'div' );
	project.className = 'cur-project';

	projectName = new THREE.CSS3DObject( project );
	projectName.position.set( 0, 500, -100 );
  
	scene.add( projectName );

}


/**
 * Removes the project name text that is above the main sphere.
 */
function hideText() {
	projectName.element.innerHTML = null;
}


/*
 * Sets the project name to display the name of the item passed in
 *
 * @param      intersect      :      THREEjS group
 *
 */
function showText( intersect ) {

	var pName  = intersect.object.name,
		skill1 = intersect.object.skill1;

	projectName.element.innerHTML = pName;

}


/**
 * This function animates the name in the upper left corner by swapping
 * random instances of letters with random instances of dashes.
 */
function animateName() {

	function swapLetters() {

		$(".swap-letters").each( function() {
			var nameLen    = $(this).children().length,
				dashLen    = $(this).find( ".name-dash" ).length,
				randomChar = $(this).children().eq( rando( 0, nameLen ) ),
				randomDash = $(this).find( ".name-dash" ).eq( rando( 0, dashLen ) );

			randomChar.before( randomDash );
		});
		
	}
	
	var int = setInterval( swapLetters, 200 );

}


/**
 * Uses the sweep library to change the color of the name
 * in the upper, right corner. Iterates through all HSL values.
 */
function animateNameColor() {

	var text = document.getElementById( 'changingText' ),
		back = document.getElementById( 'backBtn' );


	sweep( text, ['color'], 'hsl(0, 1, 0.5)', 'hsl(359, 1, 0.5)', {
		callback: animateNameColor,
		direction: 1,
		duration: 20000,
		space: 'HUSL'
	});

	sweep( back, ['color'], 'hsl(0, 1, 0.5)', 'hsl(359, 1, 0.5)', {
		direction: 1,
		duration: 20000,
		space: 'HUSL'
	});

}


/**
 * Called whenever the mouse is moved. Updates the variables keeping track
 * of the current mouse position. These variables are used to calculate
 * intersections, when a THREE.js object is being hovered on.
 *
 * @param      event     :     JavaScript Event Object
 *
 */
function onDocumentMouseMove( event ) {
	event.preventDefault();
	curMouse.x = event.clientX;
	curMouse.y = event.clientY;
	mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
	mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
}


/**
 * Called whenever the mouse wheel is scrolled. Zooms the camera in or out
 * within the bounds.
 */
function mouseWheel( event ) {

    // Don't zoom the camera back past its origin
    if ( camera.position.z <= 400 ) {
	    camera.position.z += event.wheelDeltaY * 0.05;

	    // safety check in case we scroll the camera past the origin
	    if ( camera.position.z > 400 ) {
	    	camera.position.z = 400;
	    }

	    // loop through all of the planes and move them as the camera moves
	    for ( var i = 0; i < planes.length; i++ ) {
	    	 // safety check in case we scroll the plane past the origin
		    if ( planes[ 0 ].position.z < PLANE_0_Z ) {
		    	planes[ 0 ].position.z = PLANE_0_Z;
		    }
	    	 // safety check in case we scroll the plane past the origin
		    if ( planes[ 1 ].position.z < PLANE_1_Z ) {
		    	planes[ 1 ].position.z = PLANE_1_Z;
		    }
	    	 // safety check in case we scroll the plane past the origin
		    if ( planes[ 2 ].position.z < PLANE_2_Z ) {
		    	planes[ 2 ].position.z = PLANE_2_Z;
		    }
	    	 // safety check in case we scroll the plane past the origin
		    if ( planes[ 3 ].position.z < PLANE_3_Z ) {
		    	planes[ 3 ].position.z = PLANE_3_Z;
		    }

	    	 // safety check in case we scroll the plane past the origin
		    if ( planes[ 4 ].position.z < PLANE_4_Z ) {
		    	planes[ 4 ].position.z = PLANE_4_Z;
		    }

	    	 // safety check in case we scroll the plane past the origin
		    if ( planes[ 5 ].position.z < PLANE_5_Z ) {
		    	planes[ 5 ].position.z = PLANE_5_Z;
		    }

	    	 // safety check in case we scroll the plane past the origin
		    if ( planes[ 6 ].position.z < PLANE_6_Z ) {
		    	planes[ 6 ].position.z = PLANE_6_Z;
		    }

	    	 // safety check in case we scroll the plane past the origin
		    if ( planes[ 7 ].position.z < PLANE_7_Z ) {
		    	planes[ 7 ].position.z = PLANE_7_Z;
		    }

		    // Moves all planes forward as the user scrolls.
	    	if ( planes[ 0 ].position.z >= PLANE_0_Z ) {
		    	planes[ 0 ].position.z -= event.wheelDeltaY * 0.4;
		    	planes[ 1 ].position.z -= event.wheelDeltaY * 0.4;
		    	planes[ 2 ].position.z -= event.wheelDeltaY * 0.4;
		    	planes[ 3 ].position.z -= event.wheelDeltaY * 0.4;
		    	planes[ 4 ].position.z -= event.wheelDeltaY * 0.4;
		    	planes[ 5 ].position.z -= event.wheelDeltaY * 0.4;
		    	planes[ 6 ].position.z -= event.wheelDeltaY * 0.4;
		    	planes[ 7 ].position.z -= event.wheelDeltaY * 0.4;
	    	}

	    	// Checks if the position of each plane is within the 'viewing threshold'.
	    	// This is used to fully show only the planes that are close to the viewport.
	    	if ( planes[ i ].position.z > PLANE_Z_THRESHOLD ) {
	    		planes[ i ].element.classList.add( "shown" );
	    	} else {
	    		planes[ i ].element.classList.remove( "shown" );
	    	}

	    }

    }

}


/**
 * As per the name, this function sets the project planes Z position
 * back to the original value. This is needed in case the user clicks
 * to go back after they have scrolled, and the planes have been moved.
 */
function resetProjectPlaneZPosition() {

	for ( var i = 0; i < planes.length; i++ ) {

		var newZ;

		switch ( i ) {
			case 0:
				newZ = PLANE_0_Z;
			 	break;
			case 1:
				newZ = PLANE_1_Z;
			 	break;
			case 2:
				newZ = PLANE_2_Z;
			 	break;
			case 3:
				newZ = PLANE_3_Z;
			 	break;
			case 4:
				newZ = PLANE_4_Z;
			 	break;
			case 5:
				newZ = PLANE_5_Z;
			 	break;
			case 6:
				newZ = PLANE_6_Z;
			 	break;
			case 7:
				newZ = PLANE_7_Z;
			 	break;
			default:
				break;
		}

		planes[ i ].position.z = newZ;

	}

}


/**
 * Called after a click on a mobile device. It detects if there are any
 * objects clicked on, and passes those objects to a function that handles
 * them. A function to reset the scene is called if there are no objects
 * clicked on.
 */
function checkMobileIntersection( event ) {
	event.preventDefault();

	// convert client X,Y to the renderer X,Y
	curMouse.x = ( event.clientX / renderer.domElement.clientWidth ) * 2 - 1;
	curMouse.y = - ( event.clientY / renderer.domElement.clientHeight ) * 2 + 1;

	raycaster.setFromCamera( mouse, camera );

	var intersects = raycaster.intersectObjects( objects, true );

	// Make sure there are intersects.
	if ( intersects.length > 0 ) {

		// If one of the spheres is clicked for a second time, zoom to it.
		if ( curSphere.parent === intersects[0].object.parent && clickedOnce ) {
			clickedOnce = false;
			zoomToProject();
		} else {
			clickedOnce = true;
			onMobileIntersection( intersects );
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
	console.log("zoomToProject called");
	// Only zoom to the project if there is not one in view
	// and we are not currently tweening.
	if ( !projectInView && !isTweening ) {
		raycaster.setFromCamera( mouse, camera );

		projectInView      = true;

		new TWEEN.Tween( camera.position )
			.to({
				x: 0,
				y: 0,
				z: 400
			}, 3000)
			.easing( TWEEN.Easing.Sinusoidal.Out )
			.onStart( function() {

				isTweening = true;

	           	// get rid of the plus icon
	           	$("#addIcon").removeClass( "visible" );
	           	fadeSphere( true );

	           	setTimeout( function() {
					expandPlane();
	           	}, 2000 );
	           	
			})
		    .onUpdate( function() {
		    	renderer.render(scene, camera);
		    })
		    .onComplete( function() {

		    	isTweening = false;
		    	
		    	// hide the icons while we are viewing the projects
		    	iconGroup.scale.set( 0, 0, 0);

		    	window.addEventListener( 
					'mousewheel', 
					mouseWheel, 
					Modernizr.passiveeventlisteners ? {passive: true} : false 
				);

		    })
		    .start();
	}

}


/**
 * This function is called about 60 times per second, and is responsible
 * for moving the camera back and forth over an arc. It also updates the 
 * the project names to be viewing the camera.
 */
function circleCamera() {

	// var t = clock.getElapsedTime();
	var t = theta;

	// // orbit from top right to bottom left
	sprite1.position.x = Math.cos( t ) * 300;
	sprite1.position.y = Math.sin( t ) * -600;
	sprite1.position.z = Math.cos( t ) * -600;

	// // orbit from top left to bottom right
	sprite2.position.x = Math.sin( 1.3 * t ) * -300;
	sprite2.position.y = Math.cos( 1.3 * t ) * -600;
	sprite2.position.z = Math.sin( 1.3 * t ) * -600;

	sprite3.position.x = Math.cos( 1.5 + ( 1.3 * t ) ) * 700;
	sprite3.position.y = Math.cos( 1.5 + ( 1.3 * t ) ) * 300;
	sprite3.position.z = Math.sin( 1.5 + ( 1.3 * t ) ) * 800;

	sprite4.position.x = Math.cos( 1.3 * t ) * 700;
	sprite4.position.y = Math.cos( 1.3 * t ) * -300;
	sprite4.position.z = Math.sin( 1.3 * t ) * 800;

	sprite5.position.x = Math.cos( 1.4 * t ) * -800;
	sprite5.position.y = Math.cos( 1.4 * t );
	sprite5.position.z = Math.sin( 1.4 * t ) * 700;

	theta += 0.02;

}


/**
 * Move the last sphere to the center of the scene before zooming into it.
 */
function lastSphereToCurrent( sphere ) {
	console.log("lastSphereToCurrent called");
	new TWEEN.Tween( curSphere.position )
		.to({
			x: 0,
			y: 0,
			z: 400
		}, 1000 )
		.easing( TWEEN.Easing.Elastic.InOut )
		.onStart( function() {
			isTweening = true;
		})
	    .onUpdate( function() {
	    	renderer.render( scene, camera );
	    })
	    .onComplete( function() {
	    	isTweening = false;

	    	zoomToProject();
	    })
	    .start();
}


/**
 * Moves all spheres on the scene to the location of the intersected object.
 *
 * @param      current     :     THREE.Mesh
 * @param      duration    :     Integer
 *
 */
function spheresToCurrent( current, duration ) {
	console.log("spheresToCurrent called");
	var numChildren = objects.length;

	// Tween all project spheres, starting at the second child, since the
	// first child in the scene is the light.
	for (var i = 0; i < numChildren; i++) {

		if (current != objects[i] && !isTweening) {

			new TWEEN.Tween(objects[i].position)
				.to({
					x: 0,
					y: 0,
					z: 400
				}, duration )
				.easing( TWEEN.Easing.Elastic.InOut )
				.onStart( function() {
					isTweening = true;
				})
			    .onUpdate( function() {

			    	// if the project is hovered off while the other spheres are 
			    	// moving towards it, reset all tweens and sphere positions.
			    	if ( !INTERSECTED ) {
			    		console.log("removing all tweens 3");
			    		TWEEN.removeAll();
			    		isTweening = false;
			    		spheresToRandom( 1250 );
			    		shrinkSphere( curSphere );
			    	}

			    	renderer.render( scene, camera );

			    })
			    .onComplete( function() {

			    	// If a project was clicked while the spheres were animating,
			    	// zoom to the project after the animation is done.
			    	if ( projectClicked ) {
			    		currentProject = INTERSECTED.name;

						$("#addIcon").removeClass( "visible" );
						populateProjectDetails( currentProject );
						lastSphereToCurrent( INTERSECTED );
			    	}

			    	// ensure this is only called once, right when the tween's done
			    	if ( isTweening ) {
			    		isTweening = false;
			    	}
			    	
			    })
			    .start();

		}

	}

}


/**
 * Moves all spheres on the scene to a random location.
 */
function spheresToRandom( duration ) {
	console.log("spheresToRandom called");
	var numChildren = objects.length;

	// Tween all project spheres, starting at the second child, since the
	// first child in the scene is the light.
	for ( var i = 0; i < numChildren; i++ ) {
		var vector;

		switch (i) {
			case 0:
				vector = new THREE.Vector3( -200, 240, 320 );
				break;
			case 1:
				vector = new THREE.Vector3( -160, 75, 370 );
				break;
			case 2:
				vector = new THREE.Vector3( 150, 150, 350 );
				break;
			case 3:
				vector = new THREE.Vector3( -240, -190, 320 );
				break;
			case 4:
				vector = new THREE.Vector3( 50, -60, 410 );
				break;
			case 5:
				vector = new THREE.Vector3( 120, -100, 390 );
				break;
			case 6:
				vector = new THREE.Vector3( 320, 50, 300 );
				break;
			case 7:
				vector = new THREE.Vector3( 220, -240, 260 );
				break;
			default:
				break;
		}


		// Make sure we don't tween the current sphere and make sure that the
		// spheres are not currently being tweened.
		if ( !isTweening ) {

			new TWEEN.Tween(objects[i].position)
				.to({
					x: vector.x,
					y: vector.y,
					z: vector.z
				}, duration)
				.easing( TWEEN.Easing.Elastic.InOut )
				.onStart( function() {
					isTweening = true;
				})
			    .onUpdate( function() {
			    	renderer.render(scene, camera);
			    })
			    .onComplete( function() {

			    	// called once when the tween completes
			    	if ( isTweening ) {
			    		isTweening  = false;
			    		shrinkSphere( curSphere );
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
function expandSphere( object ) {
	console.log("expandSphere called");
	var scaleSize   = 2;

	new TWEEN.Tween( object.scale )
		.to({
			x: scaleSize,
			y: scaleSize,
			z: scaleSize
		}, 500 )
		.easing( TWEEN.Easing.Circular.Out )
	    .onUpdate( function() {
	    	renderer.render(scene, camera);
	    })
	    .onComplete( function() {
	    	// Get the 2D position of the sphere so we can place the add icon.
	    	var pos = toScreenPosition( curSphere );

	    	$("#addIcon")
	    		.css( { left: pos.x + "px", top: pos.y + "px"})
	    		.addClass( "visible" );
	    })
	    .start();
}


/**
 * Used to enlarge the main project plane that is in the center of the
 * scene. Called after the project is zoomed to.
 */
function expandPlane() {
	console.log("expandPlane called");
	new TWEEN.Tween( linePlane.scale )
		.to({
			x: 40,
			y: 30,
			z: 20
		}, 3000 )
		.easing( TWEEN.Easing.Sinusoidal.In )
		.onStart( function() {
			isTweening = true;

			setTimeout( function() {
				movePlane = true;
			}, 2000 );
		})
	    .onUpdate( function() {
	    	renderer.render(scene, camera);
	    })
	    .onComplete( function() {
	    	isTweening = false;

			animateProjectPlanes();

	    	// show the back button to bring the user to the main view
	    	$("#backBtn").addClass( "visible" );

	    	// Show the current project name
	    	$("#projectName")
	    		.addClass( "visible" )
	    		.html( currentProject );
	    })
	    .start();
}


/**
 * This function gets called once a project has been zoomed in on,
 * and reveals the planes containing the images of the current project.
 */
function animateProjectPlanes() {
	console.log("animateProjectPlanes called");

	for ( var i = 0; i < planes.length; i++ ) {

		var newX;

		switch ( i ) {
			case 0:
				newX = PLANE_0_X;
			 	break;
			case 1:
				newX = PLANE_1_X;
			 	break;
			case 2:
				newX = PLANE_2_X;
			 	break;
			case 3:
				newX = PLANE_3_X;
			 	break;
			case 4:
				newX = PLANE_4_X;
			 	break;
			case 5:
				newX = PLANE_5_X;
			 	break;
			case 6:
				newX = PLANE_6_X;
			 	break;
			case 7:
				newX = PLANE_7_X;
			 	break;
			default:
				break;
		}

		fadePanelAfterDelay( i );

		new TWEEN.Tween( planes[ i ].position )
		    .delay( i * 100 )
			.to({
				x: newX
			}, 1000 )
			.easing( TWEEN.Easing.Sinusoidal.In )
		    .onUpdate( function() {
		    	renderer.render(scene, camera);
		    })
		    .start();

	}
	
}


/**
 * Used to create distinct timeouts since this will often be called inside
 * of a loop and we need to change the scope.
 *
 * @param     i      :     Integer
 *
 */
function fadePanelAfterDelay( i ) {

	// Timeouts used to add the visible class to the project panels
	setTimeout( function() {
		planes[ i ].element.className += " visible";

		// Show the controls once we show the last panel.
		if ( i === planes.length - 1 ) {
			$(".project-control, #projectName").addClass( "visible" );
		} 
	}, i*150);

}


/**
 * Used to fade the glowing sphere in and out before and after a 
 * project is zoomed to/from.
 *
 * @param    zoomIn    :    boolean
 *
 */
function fadeSphere( zoomIn ) {

	var scale = ( zoomIn ? 0.01 : 2.0 );

	new TWEEN.Tween( glowMesh.scale )
			.to({
				x: scale,
				y: scale,
				z: scale
			}, 1000 )
			.easing( TWEEN.Easing.Linear.None )
		    .onUpdate( function() {
		    	renderer.render(scene, camera);
		    })
		    .start();

}


/**
 * Scales the supplied object down by tweening the scale property.
 *
 * @param      object     :     THREE.Mesh
 *
 */
function shrinkSphere( object ) {
	console.log("shrinkSphere called");

	$("#addIcon").removeClass( "visible" );

	if ( curSphere ) {

		new TWEEN.Tween( object.scale )
			.to({
				x: 1,
				y: 1,
				z: 1
			}, 500 )
			.easing( TWEEN.Easing.Circular.Out )
		    .onUpdate( function() {
		    	renderer.render(scene, camera);
		    })
		    .start();

	}

}


/**
 * Called when the back button is clicked, this function shrinks the project
 * plane back to its original scale.
 */
function shrinkPlane() {
	console.log("shrinkPlane called");
	new TWEEN.Tween( linePlane.scale )
		.to({
			x: 0.001,
			y: 0.001,
			z: 0.001
		}, 3000 )
		.easing( TWEEN.Easing.Sinusoidal.Out )
		.onStart( function() {

			$(".project-control").removeClass( "visible" );

			setTimeout( function() {
				zoomCameraOut();
			}, 2000 );

		})
	    .onUpdate( function() {
	    	renderer.render(scene, camera);
	    })
	    .start();
}


/**
 * Called when the back button is clicked, this function shrinks the project
 * detail planes/panels back to their original scale.
 *
 * @param     current     :      string
 *
 */
function animateProjectPlanesBack( current ) {
	console.log("animateProjectPlanesBack called");
	var mutex1 = true,
		mutex2 = true,
		newX;

	// Loop through the project planes, starting with the last one, and
	// tween their x values back to the original position.
	for ( var i = planes.length - 1; i >= 0; i--) {

		switch ( i ) {
			case 0:
				newX = PLANE_0_X_ORIGIN;
			 	break;
			case 1:
				newX = PLANE_1_X_ORIGIN;
			 	break;
			case 2:
				newX = PLANE_2_X_ORIGIN;
			 	break;
			case 3:
				newX = PLANE_3_X_ORIGIN;
			 	break;
			case 4:
				newX = PLANE_4_X_ORIGIN;
			 	break;
			case 5:
				newX = PLANE_5_X_ORIGIN;
			 	break;
			case 6:
				newX = PLANE_6_X_ORIGIN;
			 	break;
			case 7:
				newX = PLANE_7_X_ORIGIN;
			 	break;
			default:
				break;
		}

		new TWEEN.Tween( planes[ i ].position )
			// .delay( 250 * i )
			.to({
				x: newX
			}, 1000 )
			.onStart( function() {

				// make sure this is only called once
				if ( mutex1 ) {
					mutex1 = false;
					$(".project-plane, #projectName").removeClass( "visible" );

					// If there is a project, it means that we will animate the
					// slides out, switch projects, then bring them back. If not,
					// we bring the camera back to the main view.
					if ( !current ) {
						shrinkPlane();
					} 

				}

			})
			.easing( TWEEN.Easing.Sinusoidal.In )
		    .onUpdate( function() {
		    	renderer.render(scene, camera);
		    })
		    .onComplete( function() {
		    	
		    	if ( mutex2 && current ) {
		    		mutex2 = false;

		    		$("#projectName").html( current );
		    		populateProjectDetails( current );
		    		animateProjectPlanes();
		    	}

		    })
		    .start();

	}
	
}


/**
 * Tweens the camera from its current, zoomed-in, position to the previously
 * stored camera position.
 */
function zoomCameraOut() {
	console.log("zoomCameraOut");

	hideText();

	new TWEEN.Tween(camera.position)
		.to({
			x: 0,
			y: 0,
			z: cameraZ
		}, 3000)
		.easing( TWEEN.Easing.Linear.None )
		.onStart( function() {
			movePlane = false;

			// bring the icons back
			iconGroup.scale.set( 1, 1, 1 );
		})
	    .onUpdate( function() {
	    	camera.lookAt( scene.position );
	    	renderer.render( scene, camera );
	    })
	    .onComplete( function() {
	    	// clean up tweens just in case
	    	console.log("removing all tweens1");
	    	TWEEN.removeAll();

			projectInView    = false;
			projectClicked   = false;
			projectClickedAfterTween   = false;
			stopCamera       = false;
			intersectMutex   = true;
			spinTheta        = 0.005;

			resetProjectPlaneZPosition();
			shrinkSphere( curSphere );
			spheresToRandom( 1250 );
			fadeSphere( false ); // keep as last item
	    })
	    .start();
}


function updateControls() {
	var numControls = controls.length;

	for ( var i = 0; i < numControls; i++ ) {
		controls[ i ].update();
	}
}


/*
 * This function handles an intersection with a given project object.
 * 
 * @param    intersects    :    array
 *
 */
function onIntersection( intersects ) {

	var numIntersects = intersects.length;

	// only run this if the intersected 
 	if ( INTERSECTED != intersects[ 0 ].object && !isTweening && 
 		curMouse.x !== 0 && curMouse.y !== 0 ) {

		$("html").css( {cursor: 'pointer'} );
		curSphere = INTERSECTED = intersects[ 0 ].object;

		if ( !projectInView ) {
			stopCamera       = true;
			unIntersectMutex = true;
		}

		if ( intersectMutex && !projectInView ) {

			intersectMutex = false;
			stopCamera     = true;

			showText( intersects[0] );
			expandSphere( curSphere );
			spheresToCurrent( curSphere, 1250 );

		}
	}

}


/**
 * Called when there is a mobile intersection. Expands the clicked
 * sphere and sets the necessary booleans.
 */
function onMobileIntersection( intersects ) {
	console.log("onMobileIntersection called");
	// If a different sphere has been clicked, shrink the old one.
	if ( curSphere && curSphere !== intersects[ 0 ].object ) {
		intersectMutex = true;
		shrinkSphere( curSphere );
	}

    curSphere = INTERSECTED = intersects[ 0 ].object;

	if ( !projectInView ) {
		stopCamera       = true;
		unIntersectMutex = true;
	}

	// Only call this once, and if a click has been made.
	// Prevents it from being called initially.
	if ( intersectMutex ) {

		if ( !isMobile() ) {
			console.log("removing all tweens2");
			TWEEN.removeAll();
		}

		intersectMutex = false;
		showText( intersects[0] );
		expandSphere( curSphere );
		spheresToCurrent( curSphere, 1250 );

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
			spheresToRandom( 1250 );
			shrinkSphere( curSphere );
			hideText();

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
function onNoIntersections( intersects ) {
	
	// Don't do anything if there's a project in view.
	if ( !projectInView ){

		stopCamera     = false;
		intersectMutex = true;

		// only execute this once, if a project is not clicked
		if ( unIntersectMutex && !projectClickedAfterTween ) {
			console.log("No Intersections");
			spheresToRandom( 1250 );
			shrinkSphere( curSphere );
			hideText();

			stopCamera = false;
			unIntersectMutex = false;
		}

	} 

	$("html").css({cursor: 'initial'});

	INTERSECTED = null;

}


/**
 * Loops through all of the vertices making up the plane,
 * and moves them around slightly to animate the lines. 
 * Also updates the color values of each vertex to get a
 * cool color animation.
 */
function animateLinePlane() {
	var time = Date.now() * 0.001;
	// linePlane.rotation.y = 0.25 * time;

	uniforms.amplitude.value = Math.sin( 0.5 * time ) / 2;
	uniforms.color.value.offsetHSL( 0.0005, 0, 0 );

	var attributes = linePlane.geometry.attributes;
	var array = attributes.displacement.array;

	for ( var i = 0, l = array.length; i < l; i += 3 ) {
		array[ i     ] += 0.05 * ( 0.5 - Math.random() ) / 3;
		array[ i + 1 ] += 0.05 * ( 0.5 - Math.random() ) / 3;
		array[ i + 2 ] += 0.05 * ( 0.5 - Math.random() ) / 3;
	}

	attributes.displacement.needsUpdate = true;
}


/**
 * Uses the requestAnimationFrame function to create a recursive loop
 * that updates the necessary items and calls the render function.
 */
function animate() {
	requestAnimationFrame( animate );
	runtime.updateShaders( clock.getElapsedTime() );
	TWEEN.update();

	render();
}


/*
 * This function is called many times per second (~60) and is
 * used to update any animations or interactions.
 */
function render() {

	// only move the icons around if we aren't viewing a project
	// or hovering on a project sphere.
	if ( !projectInView && !stopCamera ) {
		circleCamera();
	}

	// only animate the plane when we're viewing the project details.
	if ( movePlane ) {
		animateLinePlane();
	}

	// find intersections
	raycaster.setFromCamera( mouse, camera );

	var intersects = raycaster.intersectObjects( objects, true );

	// Check if the mouse pointer has intersected any of the objects
	if ( !isMobile() ) {
		if ( intersects.length > 0 ) {
			onIntersection( intersects );
		} else {
			onNoIntersections();
		}
	}

	if ( controls )
		controls.update();

	renderer.render( scene, camera );
	cssRenderer.render( scene, camera );

}

	



// })();

