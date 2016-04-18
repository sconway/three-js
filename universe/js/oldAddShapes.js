function addShapes() {
	var numImages = images.length;


	for ( var i = 0; i < numShapes; i ++ ) {
		var size     = ((i + 2) * 10) - ((i + 1) * 5),
		    faceSize = rando(minFace, maxFace),
		    numFaces = Math.random(),
		    sphereGeometry = new THREE.SphereGeometry( size, 64, 64 ),
			// material = new THREE.MeshBasicMaterial( {  
			// 				map: loaders[Math.floor(Math.random() * numImages)], 
			// 				side: THREE.DoubleSide 
			// 			}),
			color   = new THREE.MeshLambertMaterial( { 
							color: 0xffffff
						}),
			object = new THREE.Mesh( sphereGeometry, color );



		// create custom material from the shader code above
		// that is within specially labeled script tags
		var customMaterial = new THREE.ShaderMaterial({
		    uniforms: { 
				"c":   { type: "f", value: 1.0 },
				"p":   { type: "f", value: 1.4 },
				glowColor: { type: "c", value: new THREE.Color(0xffff00) },
				viewVector: { type: "v3", value: camera.position }
			},
			vertexShader:   document.getElementById( 'vertexShader'   ).textContent,
			fragmentShader: document.getElementById( 'fragmentShader' ).textContent,
			side: THREE.FrontSide,
			blending: THREE.AdditiveBlending,
			transparent: true
		});
			
		object.position.x = Math.random() * 800 - 400;
		object.position.y = Math.random() * 800 - 400;
		object.position.z = Math.random() * 800 - 400;

		object.rotation.x = Math.random() * 2 * Math.PI;
		object.rotation.y = Math.random() * 2 * Math.PI;
		object.rotation.z = Math.random() * 2 * Math.PI;

		controls.push( new THREE.DeviceOrientationControls( object , true ) );

		scene.add( object );

		var moonGlow = new THREE.Mesh( sphereGeometry.clone(), customMaterial.clone() );
	    moonGlow.position = object.position;
		moonGlow.scale.multiplyScalar(1.2);
		scene.add( moonGlow );
	}
}