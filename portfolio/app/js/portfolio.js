// (function() {

var container, 
	controls,
	camera,
	icon1 = 1, 
	scene, 
	raycaster, 
	renderer,
	selectedProject,
	lastCameraPosition,
	curSphere,
	font,
	textMesh,
	cssRenderer,
	mainMesh,
	sprite1, sprite2, sprite3, sprite4, sprite5,
	carousel, spacesphere, 
	video, videoImage, videoImageContext, videoTexture,
	intersectMutex = true,
	unIntersectMutex = true,
	isTweening = false,
	moveCamera = false,
	clickedOnce = false,
	mouseDown = false,
	rotateScene = false,
	iconLoaded = false, 
	scaleToX = window.innerWidth/50,
	scaleToY = window.innerHeight/50,
	scaleDown = false,
	spheresMoving = false,
	rotateCamera = false,
	zoomOut = false,
	noRender = false,
	stopCamera = false,
	projectInView = false,
	radius = window.innerWidth/3, 
	theta = 0,
	spinTheta = 0.005,
	cameraZ = 2000,
	cubeSize = 50,
	scaleToZ = cameraZ/cubeSize,
	minFace = 50,
	maxFace = 90,
	numShapes = 10,
	mouse = new THREE.Vector2(), 
	curMouse = new THREE.Vector2(),
	shapeGroup = new THREE.Object3D(), 
	iconGroup  = new THREE.Object3D(), 
	INTERSECTED,
	aspect = window.innerWidth / window.innerHeight,
	images = [ "bbk.png", "father-peyton.png", 
			   "iha-today.png", "standish-home.png", "wolf-greenfield.png",
			   "zildjian.png", "enernoc.png" ],
	names  = [ "Wentworth", "BB&K", "Father Peyton",
			   "IHA Today", "Standish Mellon", "Wolf Greenfield", 
			   "Zildjian Cymbals", "Enernoc" ],
	loaders = [],
	icons = [],
	objects = [];

var uniforms;
var clock = new THREE.Clock();
var runtime = new ShaderFrogRuntime();


/**
 * This function initializes the carousel that is used on the work section
 * of the portfolio. It handles setting up the various panels, moving them
 * into 3D space and keeping them evenly spaced out and rotated. 
 */
var initCarousel = function() {
    carousel   = new Carousel3D( document.getElementById('carousel') );

    var panelCount = $("#carousel").children().length,
        axisButton = document.getElementById('toggle-axis');

    var transformProp = Modernizr.prefixed('transform');

    // Represents our 3d carousel and associated properties
    function Carousel3D ( el ) {
        this.element = el;
        this.rotation = 0;
        this.panelCount = 0;
        this.totalPanelCount = this.element.children.length;
        this.theta = 0;
        this.isHorizontal = false;
    }

    Carousel3D.prototype.modify = function() {
        var panel, angle, i, spacing;

        // Displays the carousel in a horizontal fasion if the screen
        // width is smaller that the screen height. Vertical otherwise.
        if (window.outerWidth > window.outerHeight) {
            console.log("horizontal");
            this.isHorizontal = true;
            spacing = 0.75;
        } else {
            console.log("vertical");
            this.isHorizontal = false;
            spacing = 1.75;
        }

        this.panelSize = this.element[ this.isHorizontal ? 'offsetWidth' : 'offsetHeight' ];
        this.rotateFn = this.isHorizontal ? 'rotateY' : 'rotateX';
        this.theta = 360 / this.panelCount;

        // do some trig to figure out how big the carousel is in 3D space
        this.radius = Math.round( ( this.panelSize / spacing) / Math.tan( Math.PI / this.panelCount ) );

        for ( i = 0; i < this.panelCount; i++ ) {
            panel = this.element.children[i];
            angle = this.theta * i;
            // rotate panel, then push it out in 3D space
            panel.style[ transformProp ] = this.rotateFn + '(' + angle + 'deg) translateZ(' + this.radius + 'px)';
        }

        // hide other panels
        for (  ; i < this.totalPanelCount; i++ ) {
            panel = this.element.children[i];
            panel.style[ transformProp ] = 'none';
        }

        // adjust rotation so panels are always flat
        this.rotation = Math.round( this.rotation / this.theta ) * this.theta;
        this.transform();
    };

    // scales the carousel down, rotates it, then scales it back up
    Carousel3D.prototype.transform = function() {
        $(".carousel-wrapper").addClass("zoomed");
        $(".fade-out").addClass("faded");

        this.element.style[ transformProp ] = 'translateZ(-' +this.radius+ 'px) ' +
                                               this.rotateFn + 
                                               '(' +this.rotation+ 'deg)';

        console.log("transform prop: ", this.element.style[ transformProp ]);

        // After the carousel transforms, zoom it back in and scroll the other
        // carousel stops up so they are at their top.
        setTimeout(function () {
            $(".carousel-wrapper").removeClass("zoomed");
            $(".fade-out").removeClass("faded");
            $(".carousel-stop .scroll-container").stop().animate({scrollTop: 0}, 250);
        }, 1500);
    };

    // handle the clicks that will either cycle the carousel forwards or backwards
    $(".cycle-carousel").click(function(event) {
        var increment = parseInt( $(this).attr('data-increment'), 10 ),
            parent    = $(this).closest(".carousel-stop"),
        	nextStop  = parent.next(".carousel-stop"),
        	prevStop  = parent.prev(".carousel-stop");

        carousel.rotation += carousel.theta * increment * -1;
        carousel.transform();
		$(".carousel-stop").removeClass("z1");
    });

    // populate on startup
    carousel.panelCount = parseInt( panelCount, 10 );
    carousel.modify();

    // $(window).resize(function() {
    //     waitForFinalEvent(function() {
    //         carousel.modify();
    //     }, 200, "");
    // });

    // handleUI(carousel);
};






// ========================================================================

                                 
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
 * Function that handles a hover on one of the project images. When the image
 * is hovered on, the code image behind it is shown. The container for these
 * images is adjusted to be the height of whichever image is larger.
 */
function adjustRowHeight() {

	var ogHeight;

	$(".image-snippit").each( function() {
		$(this).parent().height( $(this).height() );
	});

	$(".code-sample--wrapper").hover( function() {

		var imgHeight  = $(this).find( ".img-snippit" ).height(),
			codeHeight = $(this).find( ".code-snippit" ).height(),
			maxHeight  = Math.max( imgHeight, codeHeight );

		ogHeight = $(this).height();

		$(this).height( maxHeight ).addClass( "active" );

	}, function() {

		$(this).height( ogHeight ).removeClass( "active" );

	});

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
	camera = new THREE.PerspectiveCamera( 45, aspect, 75, 10000 );
	camera.position.set( 0, 0, cameraZ );
	runtime.registerCamera( camera );

	scene     = new THREE.Scene();
	raycaster = new THREE.Raycaster();

	renderScene();
	fadeLoader();
	// addLight();
	initCarousel();
	addMainShape();
	addShapes();
	addIcons();
	createText();

	adjustRowHeight();
	animateName();
	animateNameColor();
 
	controls  = new THREE.OrbitControls( shapeGroup, renderer.domElement );

	document.addEventListener( 'mousemove', onDocumentMouseMove, false );

	// When there's a click, zoom to the project that's hovered on. On Mobile
	// devices, just do what we do for a desktop hover event.
	$(".canvas").on( 'mousedown', function( event ) {

		if ( !isMobile() ) {
			zoomToProject();
		} else {
			checkMobileIntersection( event );
		}

	});

	// Click handlers for the back and scroll buttons inside the project view.
	$(".js-back-to-project").click(function() { backToProjectView(); });
	$(".js-scroll-down").click(function() { handleSectionScroll( window.innerHeight, 1000 ); });
	
	// var windowResize = new THREEx.WindowResize(renderer, camera);
}


/**
 * This function sets up the scene renderer and sets things like
 * the size color, ratio, etc.
 */
function renderScene() {
	renderer = new THREE.WebGLRenderer({ alpha : true, antialias: true });
	renderer.setClearColor( 0x1a1a1b, 1 );
	renderer.setPixelRatio( window.devicePixelRatio );
	renderer.setSize( window.innerWidth, window.innerHeight );
	renderer.sortObjects = false;
	container.appendChild(renderer.domElement);
	var windowResize = new THREEx.WindowResize(renderer, camera);

	cssRenderer = new THREE.CSS3DRenderer();
	cssRenderer.setSize(window.innerWidth, window.innerHeight);
	container.appendChild(cssRenderer.domElement);
}


/**
 * Adds lighting to the scene. Stays in a fixed position.
 */
function addLight() {
	// var group  = new THREE.Object3D();
	// ambLight = new THREE.AmbientLight( 0x222222 );

	// light = new THREE.HemisphereLight( 0x666666 , 0x000000 );
	// light.position.set( 1, 1, 1 ).normalize();

	spotLight = new THREE.PointLight(0xffffff, 10);
	spotLight.position.set( 200, 500, 200 ).normalize();


	// scene.add( ambLight );
	// scene.add( light );
	scene.add( spotLight );
	// scene.add( lightHelper );
	// scene.add( new THREE.PointLightHelper( spotLight, 1 ) );
}


function addMainShape() {

	var material     = new THREE.MeshPhongMaterial({
							color: 0x000000,
							opacity: 0.5,
							specular: 0xe7e7e7,
							shininess: 50,
							transparent: true
						}),
		geometry     = new THREE.SphereGeometry( 400, 64, 64 );

	mainMesh = new THREE.Mesh( geometry, material );

	shapeGroup.add( mainMesh );
	scene.add( shapeGroup );

}


/**
 * 	This function is responsible for adding the various shapes to the canvas
 *  and placing them in random locations in 3D space
 */
function addShapes() {
	var numChildren = names.length;

	runtime.load( [
		'shader1.json',
		'shader2.json',
		'shader3.json',
		'shader4.json',
		'shader5.json',
		'shader6.json',
		'shader7.json',
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
			// hideText();
			spheresToRandom( 1250 );

		});

	
}


/**
 * Adds the various icons that orbit around the main shape.
 */
function addIcons() {

	//DRINK
	var texture1 = new THREE.TextureLoader().load('images/assets/icon1.png');
	// CODE
	var texture2 = new THREE.TextureLoader().load('images/assets/icon2.png');
	// MAGNET
	var texture3 = new THREE.TextureLoader().load('images/assets/icon3.png');
	// WEIGHT
	var texture4 = new THREE.TextureLoader().load('images/assets/icon4.png');
	// MONEY
	var texture5 = new THREE.TextureLoader().load('images/assets/icon5.png');

	var material1 = new THREE.SpriteMaterial( { map: texture1 } );
	var material2 = new THREE.SpriteMaterial( { map: texture2 } );
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
			font = response;
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

	$("#firstName").shuffleLetters({
		"step": rando( 1, 10 ),
		"fps": rando( 5, 15 )
	});

	$("#lastName").shuffleLetters({
		"step": rando( 1, 10 ),
		"fps": rando( 5, 15 ),
		"callback": animateName
	});

}


function animateNameColor () {
	var text = document.getElementById( 'changingText' );

	sweep( text, ['color'], 'hsl(0, 1, 0.5)', 'hsl(359, 1, 0.5)', {
		callback: animateNameColor,
		direction: 1,
		duration: 10000,
		space: 'HUSL'
	});
}


function onDocumentMouseMove( event ) {
	event.preventDefault();
	curMouse.x = event.clientX;
	curMouse.y = event.clientY;
	mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
	mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
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

	if (!projectInView && !isTweening && INTERSECTED) {
		raycaster.setFromCamera( mouse, camera );

		selectedProject    = curSphere;
		lastCameraPosition = camera.clone().position;
		projectInView      = true;
		$("#teaser").removeClass("active");

		zoomToSelection( selectedProject.position );

		$(".project-preview").addClass("hidden");
	}

}


/**
 * Brings the camera back to the main project view by removing the classes
 * that showed the project details and setting the necessary variables to 
 * zoom the camera to the original position.
 */
function backToProjectView() {
	$(".project-intro, .canvas").removeClass("active");
	zoomCameraOut();
	rotateCamera = false;
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
 * Iterate the rotation of the camera just a bit
 */
function spinCamera() {
	camera.rotation.x -= 0.001;
    camera.rotation.y -= 0.001;
}


function spinScene() {
	camera.rotation.x -= 0.003;
    camera.rotation.y -= 0.003;
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
 * @param      duration    :     Integer
 *
 */
function spheresToCurrent( current, duration ) {

	var numChildren = objects.length;

	// Tween all project spheres, starting at the second child, since the
	// first child in the scene is the light.
	for (var i = 0; i < numChildren; i++) {

		if (current != objects[i] && !isTweening) {

			new TWEEN.Tween(objects[i].position)
				.to({
					x: 0,
					y: 0,
					z: 0
				}, duration )
				.easing( TWEEN.Easing.Elastic.InOut )
				.onStart( function() {
					isTweening = true;
				})
			    .onUpdate( function() {

			    	// if the project is hovered off while the other spheres are 
			    	// moving towards it, reset all tweens and sphere positions.
			    	if ( !INTERSECTED ) {
			    		TWEEN.removeAll();
			    		isTweening = false;
			    		spheresToRandom( 1250 );
			    		shrinkSphere( curSphere );
			    	}

			    	renderer.render( scene, camera );

			    })
			    .onComplete( function() {
			    	
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
function spheresToRandom(duration) {
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
		    			rotateScene = true;
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
	var numChildren = scene.clone().children.length,
		scaleSize   = isMobile() ? 2 : 4,
		sphere      = object.children[ 0 ];

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

	    	console.log(pos);
	    	$("#addIcon")
	    		.css( { left: pos.x + "px", top: pos.y + "px"})
	    		.addClass( "visible" );
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
	var numChildren = objects.length;

	if ( curSphere ) {

		new TWEEN.Tween( object.scale )
			.to({
				x: 1,
				y: 1,
				z: 1
			}, 500 )
			.onStart( function() {
				$("#addIcon").removeClass( "visible" );
			})
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

	new TWEEN.Tween( camera.position )
		.to({
			x: target.x,
			y: target.y,
			z: target.z
		}, 3000)
		.easing( TWEEN.Easing.Linear.None )
		.onStart( function() {
			// As we zoom to the project, rotate the carousel so that
			// selected project is the current one.
			var index    = $.inArray( curSphere.name, names ),
			    rotation = carousel.rotation % 360,
            	theta    = carousel.theta,
            	destRotation = -1 * index * theta;

           	// get rid of the plus icon
           	$("#addIcon").removeClass( "visible" );
           	
            // raise the current project so nothing shows behind it.
           	$($(".carousel-stop").get(index)).addClass( "z1" );

	        carousel.rotation = destRotation;
	        carousel.transform();
		})
	    .onUpdate( function() {
	    	renderer.render(scene, camera);
	    })
	    .onComplete( function() {
	    	noRender = true;
			$(".project-intro, .canvas").addClass( "active" );
	    })
	    .start();
}


/**
 * Tweens the camera from its current, zoomed-in, position to the previously
 * stored camera position.
 */
function zoomCameraOut() {
	TWEEN.removeAll();
	hideText();

	new TWEEN.Tween(camera.position)
		.to({
			x: lastCameraPosition.x,
			y: lastCameraPosition.y,
			z: lastCameraPosition.z
		}, 3000)
		.easing( TWEEN.Easing.Linear.None )
		.onStart( function() {
			noRender = false;
		})
	    .onUpdate( function() {
	    	camera.lookAt( scene.position );
	    	renderer.render( scene, camera );
	    })
	    .onComplete( function() {
	    	selectedProject  = null;
			projectInView    = false;
			stopCamera       = false;
			intersectMutex   = true;
			spinTheta        = 0.005;
			TWEEN.removeAll();
			shrinkSphere( curSphere );
			spheresToRandom( 1250  );
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
 * Removes the supplied object from the scene.
 *
 * @param    name    :    string
 *
 */
function removeObject( name ) {
	var selectedObject = scene.getObjectByName( name );

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

		if ( intersectMutex ) {

			intersectMutex = false;
			rotateScene    = false;
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

	// If a different sphere has been clicked, shrink the old one.
	if ( curSphere && curSphere !== intersects[ 0 ].object ) {
		intersectMutex = true;
		shrinkSphere( curSphere );
	}

    curSphere = INTERSECTED = intersects[ 0 ].object;

	if ( !projectInView ) {
		stopCamera = true;
		unIntersectMutex = true;
	}

	// Only call this once, and if a click has been made.
	// Prevents it from being called initially.
	if ( intersectMutex ) {

		if ( !isMobile() ) {
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
function onNoIntersections(intersects) {
	
	// Don't do anything if there's a project in view.
	if ( !projectInView ){

		stopCamera     = false;
		intersectMutex = true;

		if ( unIntersectMutex ) {
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


function animate() {
	requestAnimationFrame( animate );
	runtime.updateShaders( clock.getElapsedTime() );
	TWEEN.update();

	// no need to render if there is a project in view
	if ( !noRender ) {
		render();
	}
}


/*
 * This function is called many times per second (~60) and is
 * used to update any animations or interactions.
 */
function render() {

	// iterate through the shader updates as long as there isn't a project
	// in view or one being hovered on.
	if ( !projectInView && !stopCamera ) {
		circleCamera();
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
