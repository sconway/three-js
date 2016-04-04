var container, 
	stats,
	camera, 
	scene, 
	raycaster, 
	renderer, 
	radius = 500, 
	theta = 0,
	frustumSize = 1000,
	mouse = new THREE.Vector2(), 
	INTERSECTED,
	aspect = window.innerWidth / window.innerHeight,
	images = [ "college-culture.png", "copyright.png", "father-peyton.png", 
			   "iha-today.png", "standish-home.png", "wolf-greenfield.png" ],
	loaders = [];


init();
animate();

function init() {
	container = document.getElementById("container");
	camera = new THREE.PerspectiveCamera( 45, aspect, 1, 10000 );
	scene = new THREE.Scene();

	addLight();

	var geometry = new THREE.BoxGeometry( 20, 20, 20 );

	for (var i = 0; i < images.length; i++) {
		var loader = new THREE.TextureLoader().load('images/projects/' + images[i]);
	    loader.wrapS = loader.wrapT = THREE.RepeatWrapping;
	    loaders.push(loader);
	}

	var numImages = images.length;
	for ( var i = 0; i < 1000; i ++ ) {
		var object = new THREE.Mesh( geometry, new THREE.MeshBasicMaterial( {  map: loaders[Math.floor(Math.random() * numImages)], side: THREE.DoubleSide} ) );
 
		object.position.x = Math.random() * 800 - 400;
		object.position.y = Math.random() * 800 - 400;
		object.position.z = Math.random() * 800 - 400;

		object.rotation.x = Math.random() * 2 * Math.PI;
		object.rotation.y = Math.random() * 2 * Math.PI;
		object.rotation.z = Math.random() * 2 * Math.PI;

		object.scale.x = Math.random() + 0.5;
		object.scale.y = Math.random() + 0.5;
		object.scale.z = Math.random() + 0.5;

		scene.add( object );
	}

	raycaster = new THREE.Raycaster();

	renderer = new THREE.WebGLRenderer();
	renderer.setClearColor( 0xf0f0f0 );
	renderer.setPixelRatio( window.devicePixelRatio );
	renderer.setSize( window.innerWidth, window.innerHeight );
	renderer.sortObjects = false;
	container.appendChild(renderer.domElement);

	stats = new Stats();
	stats.domElement.style.position = 'absolute';
	stats.domElement.style.top = '0px';
	container.appendChild( stats.domElement );

	document.addEventListener( 'mousemove', onDocumentMouseMove, false );

	window.addEventListener( 'resize', onWindowResize, false );
}


function addLight() {
	var light = new THREE.DirectionalLight( 0xffffff, 1 );
	light.position.set( 1, 1, 1 ).normalize();
	scene.add( light );
}


function onWindowResize() {
	var aspect = window.innerWidth / window.innerHeight;

	camera.left   = - frustumSize * aspect / 2;
	camera.right  =   frustumSize * aspect / 2;
	camera.top    =   frustumSize / 2;
	camera.bottom = - frustumSize / 2;

	camera.updateProjectionMatrix();

	renderer.setSize( window.innerWidth, window.innerHeight );
}

function onDocumentMouseMove( event ) {
	event.preventDefault();
	mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
	mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
}


function animate() {
	requestAnimationFrame( animate );
	render();
	stats.update();
}

function render() {
	theta += 0.1;

	camera.position.x = radius * Math.sin( THREE.Math.degToRad( theta ) );
	camera.position.y = radius * Math.sin( THREE.Math.degToRad( theta ) );
	camera.position.z = 1500;
	camera.lookAt( scene.position );
	camera.updateMatrixWorld();

	// find intersections
	raycaster.setFromCamera( mouse, camera );

	var intersects = raycaster.intersectObjects( scene.children );

	if ( intersects.length > 0 ) {
		if ( INTERSECTED != intersects[ 0 ].object ) {
			if ( INTERSECTED ) {
				// INTERSECTED.material.emissive.setHex( INTERSECTED.currentHex );
				console.log("intersected");
			}
			INTERSECTED = intersects[ 0 ].object;
			// INTERSECTED.currentHex = INTERSECTED.material.emissive.getHex();
			// INTERSECTED.material.emissive.setHex( 0xff0000 );
		}
	} else {
		if ( INTERSECTED ) {
			// INTERSECTED.material.emissive.setHex( INTERSECTED.currentHex );
		}
		INTERSECTED = null;
	}

	renderer.render( scene, camera );
}




