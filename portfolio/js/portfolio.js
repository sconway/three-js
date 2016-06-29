// (function() {

var container, 
	controls = [],
	camera, 
	scene, 
	raycaster, 
	renderer,
	selectedProject,
	lastCameraPosition,
	curSphere,
	font,
	sprite,
	carousel, spacesphere, 
	video, videoImage, videoImageContext, videoTexture,
	intersectMutex = true,
	unIntersectMutex = true,
	isTweening = false,
	moveCamera = false,
	clickedOnce = false,
	mouseDown = false,
	rotateSphere = false,
	rotateScene = false, 
	scaleToX = window.innerWidth/50,
	scaleToY = window.innerHeight/50,
	scaleDown = false,
	spheresMoving = false,
	rotateCamera = false,
	zoomOut = false,
	stopCamera = false,
	projectInView = false,
	radius = window.innerWidth/3, 
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
	images = [ "copyright.png", "father-peyton.png", 
			   "iha-today.png", "standish-home.png", "wolf-greenfield.png",
			   "zildjian.png", "enernoc.png" ],
	names  = [ "Wentworth", "Copyright Clearance", "Father Peyton",
			   "IHA Today", "Standish Mellon", "Wolf Greenfield", 
			   "Zildjian Cymbals", "Enernoc" ],
    descriptions = [ 
    "Wentworth Intstitute of Technology is a prestigeous technical university located in Boston, MA. This project involved re-designing and re-building their existing site in the Drupal content management system, while also adding additional features to create a new experience for prospective and current students.",
    "Copyright Description",
    "Father Peyton was a member of Holy Cross Family Ministries who had this site commissioned when he was nominated for sainthood. This site chronicles the life of Father Patrick Peyton, highlighting the moments in his life that made him such a venerable figure.", 
    "IHA Today Description",
    "Standish Mellon is a leading asset management firm located in downtown Boston. The re-design and content audit of their current site helps to showcase the experience and proven track record that makes Standish Mellon an industry leader, while also engaging the user in a clear and informative manner.",	
    "Wolf Greenfield is a law firm that has been specializing in intellectual property law for the last 90 years. The re-design and development of their new site uses the latest interactive web technologies to engage the user in an enjoyable experience, while presenting relevant information for potential clients.",
    "Zildjian is a world renowned cymbal maker, dating back to the 17th century. This project was a complete redesign of their pre-existing site, incorporating new web technologies to create a much more pleasant user experience, and a more profitable online store.",
    "Enernoc is a wordwide energy software company that helps organizations and intstitutions track and manage how they consume energy. This project highlighted the benefits of Enernoc's product through the usage of numerous statistics and case studies displayed in an elegant and informative manner."
    				],
	loaders = [],
	objects = [];



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
        $("#fpc_box").addClass("faded");

        this.element.style[ transformProp ] = 'translateZ(-' +this.radius+ 'px) ' +
                                               this.rotateFn + 
                                               '(' +this.rotation+ 'deg)';

        console.log("transform prop: ", this.element.style[ transformProp ]);

        // After the carousel transforms, zoom it back in and scroll the other
        // carousel stops up so they are at their top.
        setTimeout(function () {
            $(".carousel-wrapper").removeClass("zoomed");
            $("#fpc_box").removeClass("faded");
            $(".carousel-stop .scroll-container").stop().animate({scrollTop: 0}, 250);
        }, 1500);
    };

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
function handleSectionScroll(scrollPoint, duration) {
	console.log("called");
    $('html, body').stop().animate({scrollTop: scrollPoint}, duration, "linear");
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
	spheresToRandom(1250);
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

	scene = new THREE.Scene();
	raycaster = new THREE.Raycaster();

	renderScene();
	addBackground();
 
	document.addEventListener( 'mousemove', onDocumentMouseMove, false );
	// window.addEventListener("devicemotion", handleMotion, false);

	$(".canvas").click( function(event) { 
		if ( !isMobile() ) {
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

	// Click handlers for the back and scroll buttons inside the project view.
	$(".js-back-to-project").click(function() { backToProjectView(); });
	$(".js-scroll-down").click(function() { handleSectionScroll(window.innerHeight, 1000); });
	
	// var windowResize = new THREEx.WindowResize(renderer, camera);
}


/**
 * This function sets up the scene renderer and sets things like
 * the size color, ratio, etc.
 */
function renderScene() {
	renderer = new THREE.WebGLRenderer({alpha : true});
	renderer.setClearColor( 0x0e0e15, 1 );
	renderer.setPixelRatio( window.devicePixelRatio );
	renderer.setSize( window.innerWidth, window.innerHeight );
	renderer.sortObjects = false;
	container.appendChild(renderer.domElement);
	var windowResize = new THREEx.WindowResize(renderer, camera);
}


/**
 * This function adds the space background to the scene. It is 
 * implemented as a giant sphere with an image on both sides.
 * The main content is inside of it.
 */
function addBackground() {
	// Space background is a large sphere 
	var spacesphereGeo = new THREE.SphereGeometry(2000,64,64);

	var loader = new THREE.TextureLoader();

	loader.load('images/earth-moon.jpg', function(texture) {
		texture.wrapS = texture.wrapT = THREE.RepeatWrapping;

		var spacesphereMat = new THREE.MeshBasicMaterial({ 
			map: texture,
			side: THREE.DoubleSide
		});

		spacesphere = new THREE.Mesh(spacesphereGeo, spacesphereMat);
		spacesphere.rotation.x = -0.5;
		spacesphere.name = "space";
		scene.add(spacesphere);

		fadeLoader();
		addLight();
		initCarousel();
		// addImages();
		loadFont();
	});
}


/**
 * Adds lighting to the scene. Stays in a fixed position.
 */
function addLight() {
	var group  = new THREE.Object3D();
	group.add( new THREE.AmbientLight( 0x222222 ) );
	light = new THREE.HemisphereLight( 0x666666 , 0x000000 );
	light.position.set( 1, 1, 1 ).normalize();
	group.add( light );
	group.name = "project_light";
	scene.add( group );
}


/**
 * 	This function is responsible for adding the various shapes to the canvas
 *  and placing them in random locations in 3D space
 */
function addShapes() {
	var numChildren = names.length;

	for ( var i = 0; i < numChildren; i++ ) {
		var size     = ((i + 2) * 10) - ((i + 1) * 5),
			color    = isMobile() ? new THREE.MeshLambertMaterial({color: 0xffffff * Math.random() }) : createGlowMaterial() ,
			moonGlow = new THREE.Mesh( 
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

		objects.push( group );
		scene.add( group );
	}


	// since there won't be a current sphere on page load, set one initially,
	// and then move the spheres into a random location in the 3D space.
	curSphere = scene.clone().children[rando(3,7)].children[0];
	hideText();
	spheresToRandom(1250);
}


/**
 * Creates a THREE.js material with a video mapped to the surface.
 * The sphere name parameter is used to determine which video to apply.
 * The supplied sphere object 
 * 
 * @param      sphere     :     THREE.Mesh
 *
 */
function addVideo(sphere) {
	video = document.getElementById( sphere.name );
	video.load(); // must call after setting/changing source
	
	videoImage = document.createElement( 'canvas' );
	videoImage.width = 852;
	videoImage.height = 478;

	videoImageContext = videoImage.getContext( '2d' );
	videoImageContext.fillStyle = '#FFFFFF';
	videoImageContext.fillRect( 0, 0, videoImage.width, videoImage.height );

	videoTexture = new THREE.Texture( videoImage );
	videoTexture.minFilter = THREE.LinearFilter;
	videoTexture.magFilter = THREE.LinearFilter;

	// Wait until the video is fully loaded before changing the material.
	video.addEventListener('loadeddata', function(e) {
	    sphere.material = new THREE.MeshBasicMaterial( { 
							map: videoTexture, 
							transparent: true,
							opacity: 0.9,
							overdraw: true, 
							side:THREE.DoubleSide 
						}  );

	    video.play();
	});

}


/**
 * This function is called after the page loads and adds the classes
 * that fade the loading animation out. 
 */
function fadeLoader() {
	var body   = document.getElementById("body"),
		loader = document.getElementById("loader"),
		canvas = document.getElementById("container");

	console.log("Fading loader out");
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
			addShapes();
		} );
}


/**
 * Used to convert the object's position in 3D space to a
 * 2D vector. 
 *
 * Returns        2D Vector
 */
function get2DPosition(obj, camera) {
	var vector = new THREE.Vector3();

    var widthHalf = 0.5 * renderer.context.canvas.width;
    var heightHalf = 0.5 * renderer.context.canvas.height;

    obj.updateMatrixWorld();
    vector.setFromMatrixPosition(obj.matrixWorld);
    vector.project(camera);

    vector.x = ( vector.x * widthHalf ) + widthHalf;
    vector.y = - ( vector.y * heightHalf ) + heightHalf;

    return { 
        x: vector.x,
        y: vector.y
    };
}


/**
 * This function returns the visible height of an object in pixels.
 * It uses the supplied distance from the object to the camera, along
 * with some trig functions, to compute the fraction of the field of 
 * view that the object takes up. Multiplying this by the canvas height
 * gives us the height in pixels.
 *
 * @param      dist     :     Integer
 *
 * Returns     Integer
 *
 */
function getSize(dist) {
    // convert vertical fov to radians
	var vFOV = camera.fov * Math.PI / 180;       
	// visible height
	var height = 1.4 * Math.tan( vFOV / 2 ) * dist; 
	// fraction of the canvas height the object takes up.
	// radius is 40 and it is scaled by 8
	var fraction = 320 / height;  

	return $(container).height() * fraction;
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
	var distance = camera.position.distanceTo(current.position),
		position = get2DPosition(current, camera),
		size     = getSize(distance),
		curName  = current.children[0].name,
		index    = $.inArray(curName, names),
		descText = descriptions[index];

	// console.log("distance: ", distance);
	// console.log("size: ", size);
	// console.log("position: ", position);

	// make sure the mouse has been moved before dropping the
	// teaser down. Prevents it from showing on load.
	if ( (x > 0 && y > 0) || mouseDown ) {

		// set the text of the teaser block
		$("#teaserName").html(curName);
		$("#teaserDescription").html(descText);

		if ( !isMobile() ) {
			if ( position.x > window.innerWidth/2 ) {
				var xFactor = $("#teaser").width() + size;

				// mouse on right bottom of screen (Q4)
				if ( position.y > window.innerHeight/2 ) {
					revealTeaser(position.x - xFactor, position.y - 275);
				} 
				// mouse on right top of screen (Q2)
				else {
			    	revealTeaser(position.x - xFactor, position.y - 60);
				}
			} else {
				// mouse on the bottom left of screen (Q3)
				if ( curMouse.y > window.innerHeight/2 ) {
					revealTeaser(position.x + size, position.y - 275);
				} 
				// mouse on the top left of screen (Q4)
				else {
					revealTeaser(position.x + size, position.y - 60);
				}
			}
		} else {
			// just place the teaser in the bottom center when we are on mobile
			revealTeaser(30, 200);
		}
	}
}


// function addImages() {
// 	for (var i = 0; i < images.length; i++) {
// 		var loader = new THREE.TextureLoader().load('images/projects/' + images[i]);
// 	    loader.wrapS = loader.wrapT = THREE.RepeatWrapping;
// 	    loaders.push(loader);
// 	}
// }


/**
 * Creates and returns a material with a glowing effect.
 */
function createGlowMaterial() {
	return new THREE.ShaderMaterial( {
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
        	// color:  0xf8f8f8
        	color: 0xffffff
    	}),
    	textGeom = new THREE.TextGeometry( text , 
    	{
    		font: font,
    		size: !isMobile() ? 18.0 : 22.0,
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
				left: !isMobile() ? (x + "px") : "50%",
				top:  !isMobile() ? (y + "px") : "50%"
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


// function handleMotion(event) {
//   // absolute = event.absolute;
//   alpha    = event.rotationRate.alpha;
//   beta     = event.rotationRate.beta;
//   gamma    = event.rotationRate.gamma;

//   // Do stuff with the new orientation data
//   console.log(gamma);
// }


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
	if (!projectInView && !isTweening && INTERSECTED) {
		raycaster.setFromCamera( mouse, camera );

		selectedProject = curSphere;
		// console.log(selectedProject);
		lastCameraPosition = camera.clone().position;
		projectInView = true;
		rotateSphere = false;
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
	// no need to move the camera if we are on a mobile device
	if ( !isMobile() ) {
		theta += 0.2;
		camera.position.x = radius * Math.sin( THREE.Math.degToRad( theta ) );
		camera.position.y = radius * Math.sin( THREE.Math.degToRad( theta ) );
		camera.lookAt( scene.position );
		camera.updateMatrixWorld();
	}
	
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
 *
 */
function spheresToCurrent(current) {
	// clone the scene so the number of children doesn't change when we remove
	var numChildren = objects.length;

	// Tween all project spheres, starting at the second child, since the
	// first child in the scene is the light.
	for (var i = 0; i < numChildren; i++) {
		if (current != objects[i] && !isTweening) {
			new TWEEN.Tween(objects[i].position)
				.to({
					x: !isMobile() ? current.position.x : 0,
					y: !isMobile() ? current.position.y : 350,
					z: !isMobile() ? current.position.z : 0
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
			    		spheresToRandom(1250);
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
function spheresToRandom(duration) {
	var numChildren = objects.length;

	// Tween all project spheres, starting at the second child, since the
	// first child in the scene is the light.
	for ( var i = 0; i < numChildren; i++ ) {
		var posX = !isMobile() ? (-650 + ((i+1) * 150)) * (i % 2 === 0 ? 1 : 1) : -100,
			posY = !isMobile() ? (500 - ((i+1) * 90)) * (i % 2 === 0 ? -1 : 1) : (-450 + ((i+1) * 100)),
			posZ = !isMobile() ? rando(-400, 300) : 300,
			vector = new THREE.Vector3(posX, posY, posZ);

		// For this one example, move it out of the way so nothing overlaps.
		if (i === 4 && !isMobile()) {
			posX = -500;
			vector = new THREE.Vector3(posX, posY, posZ);
		}

		// Make sure we don't tween the current sphere and make sure that the
		// spheres are not currently being tweened.
		if ( !isTweening ) {

			new TWEEN.Tween(objects[i].position)
				.to({
					x: posX,
					y: posY,
					z: posZ
				}, duration)
				.easing( TWEEN.Easing.Elastic.InOut )
				.onStart( function() {
					isTweening = true;
					curSphere.material = isMobile() ? new THREE.MeshLambertMaterial({color: 0xffffff * Math.random() }) : createGlowMaterial();
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
			    		// Wave effect on mobile devices and a 
			    		// random motion effect on larger screens.
			    		if ( isMobile() ) {
			    			waveSpheres();
			    		} else {
			    			rotateScene = true;
			    		}
			    	}
			    	
			    })
			    .start();
		}
	}
		
}


/**
 * Moves all spheres on the scene to a random location.
 */
function spheresToRandom2(duration) {
	var numChildren = objects.length;

	// Tween all project spheres, starting at the second child, since the(i * 65 - (i * 4)) 
	// first child in the scene is the light.
	for ( var i = 0; i < numChildren; i++ ) {
		var posX = !isMobile() ? (-600 + ((i+1) * 100)) * (i % 2 === 0 ? 1 : -1) : -100,
			posY = !isMobile() ? ((i + 1) * 60 * (i % 2 === 0 ? 1 : -1)) : (-450 + ((i+1) * 100)),
			posZ = !isMobile() ? (Math.random() * 700 - 300) : 300,
			vector = new THREE.Vector3(posX, posY, posZ);

		// Make sure we don't tween the current sphere and make sure that the
		// spheres are not currently being tweened.
		// if ( !isTweening && curSphere && objects[i].name !== "project_name" ) {

			var tween = new TWEEN.Tween(objects[i].position)
				.to({
					x: posX,
					y: posY,
					z: posZ
				}, duration)
				.easing( TWEEN.Easing.Elastic.InOut )
				.onStart( function() {
					// isTweening = true;
				})
				.onUpdate( function() {
			    	renderer.render(scene, camera);
			    })
				.start();

			tween.chain(tween);
	}
}


function waveSpheres() {
	var numChildren = objects.length;

	// Tween all project spheres
	for ( var i = 0; i < numChildren; i++ ) {
		var tweenTo = new TWEEN.Tween(objects[i].position)
			.to({
				z: 400
			}, 2000)
			.delay( (i*400) )
			.easing( TWEEN.Easing.Quadratic.InOut )
			.onStart( function() {})
			.onUpdate( function() {
		    	renderer.render(scene, camera);
		    })
		    .onComplete( function() {});

		var tweenBack = new TWEEN.Tween(objects[i].position)
			.to({
				z: 300
			}, 2000)
			.delay(0)
			.easing( TWEEN.Easing.Quadratic.InOut )
			.onStart( function() {})
			.onUpdate( function() {
		    	renderer.render(scene, camera);
		    })
		    .onComplete( function() {});

		tweenTo.chain(tweenBack);
		tweenBack.chain(tweenTo);
		tweenTo.start();
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
		scaleSize   = !isMobile() ? 8 : 4,
		sphere      = object.children[0];

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
			// sphere.material = addVideo(sphere.name);
			addVideo(sphere);
    		rotateSphere = true;
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
		.onStart(function() {
			// As we zoom to the project, rotate the carousel so that
			// selected project is the current one.
			var index    = $.inArray(curSphere.name, names),
			    rotation = carousel.rotation % 360,
            	theta    = carousel.theta,
            	destRotation = -1 * index * theta;

            // raise the current project so nothing shows behind it.
           	$($(".carousel-stop").get(index)).addClass("z1");

	        carousel.rotation = destRotation;
	        carousel.transform();
		})
	    .onUpdate( function() {
	    	renderer.render(scene, camera);
	    })
	    .onComplete( function() {
	    	// When we're done zooming in, stop the current video and sphere
	    	// rotateion, and display the current project.
	    	document.getElementById(curSphere.name).pause();
	    	rotateSphere = false;
			$(".project-intro, .canvas").addClass("active");
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
			shrinkSphere();
			spheresToRandom(1250);
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
 		 intersects[0].object.name != "space" &&
 		 curMouse.x !== 0 && curMouse.y !== 0 ) {

		$("html").css({cursor: 'pointer'});
		curSphere = INTERSECTED = intersects[0].object;

		if ( !projectInView ) {
			stopCamera = true;
			unIntersectMutex = true;
		}

		if ( intersectMutex ) {
			intersectMutex = false;
			rotateScene = false;
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

	// Only call this once, and if a click has been made.
	// Prevents it from being called initially.
	if ( intersectMutex ) {
		TWEEN.removeAll();
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
			console.log("no mobile intersection. Fired once");
			// prevent extra tweens on objects
			TWEEN.removeAll(); 
			spheresToRandom(1250);
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
			spheresToRandom(1250);
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
	if ( !isMobile() ) {
		if ( intersects.length > 0 ) {
			if ( intersects[0].object.name === "space" ){
				onNoIntersections();
			} else {
				onIntersection(intersects);
			}
		} else {
			onNoIntersections();
		}
	}

	renderer.render( scene, camera );
}

	



// })();

