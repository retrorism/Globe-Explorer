/**
 * dat.globe Javascript WebGL Globe Toolkit
 * http://dataarts.github.com/dat.globe
 *
 * Copyright 2011 Data Arts Team, Google Creative Lab
 *
 * Licensed under the Apache License, Version 2.0 (the 'License');
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 */

var DAT = DAT || {};
var projector,INTERSECTED;

// custom global variables
var targetList = [];

var raycaster = new THREE.Raycaster();

DAT.Globe = function(container, opts) {
	opts = opts || {};

	var colorFn = opts.colorFn || function(x) {
	var c = new THREE.Color();
	c.setRGB(1,1,1);
	return c;
	};


	var imgDir = opts.imgDir || 'img/';

	var Shaders = {
	'earth' : {
		uniforms: {
		'texture': { type: 't', value: null }
		},
		vertexShader: [
		'varying vec3 vNormal;',
		'varying vec2 vUv;',
		'void main() {',
			'gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );',
			'vNormal = normalize( normalMatrix * normal );',
			'vUv = uv;',
		'}'
		].join('\n'),
		fragmentShader: [
		'uniform sampler2D texture;',
		'varying vec3 vNormal;',
		'varying vec2 vUv;',
		'void main() {',
			'vec3 diffuse = texture2D( texture, vUv ).xyz;',
			'float intensity = 1.05 - dot( vNormal, vec3( 0.0, 0.0, 1.0 ) );',
			'vec3 atmosphere = vec3( 0, 0, 0 ) * pow( intensity, 3.0 );',//color of atomosphere
			'gl_FragColor = vec4( diffuse + atmosphere, 1.0 );',
		'}'
		].join('\n')
	},
	'atmosphere' : {
		uniforms: {},
		vertexShader: [
		'varying vec3 vNormal;',
		'void main() {',
			'vNormal = normalize( normalMatrix * normal );',
			'gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );',
		'}'
		].join('\n'),
		fragmentShader: [
		'varying vec3 vNormal;',
		'void main() {',
			'float intensity = pow( 0.8 - dot( vNormal, vec3( 0, 0, 1.0 ) ), 12.0 );',
			'gl_FragColor = vec4( 0, 0, 0, 0 ) * intensity;', // color around globe
		'}'
		].join('\n')
	}



	};

	var camera, scene, renderer, w, h;
	var mesh, atmosphere, point;

	var overRenderer;

	var curZoomSpeed = 0;
	var zoomSpeed = 50;

	var mouse = { x: 0, y: 0 }, mouseOnDown = { x: 0, y: 0 };
	var mouse2 = new THREE.Vector2(), INTERSECTED;

	var rotation = { x:39.659797980385109 , y: 0.55612037755986923 }, /*Change first location*/
		target = { x: 42.1, y: 0},
		targetOnDown = { x: 0, y: 0 };

	var distance = 100000, distanceTarget = 100000;
	var padding = 40;
	var PI_HALF = Math.PI / 2;

	function init() {
		var shader, uniforms, material;
		w = container.offsetWidth || window.innerWidth;
		h = container.offsetHeight || window.innerHeight;


		camera = new THREE.PerspectiveCamera(30, w / h, 1, 10000);
		camera.position.z = distance;

		scene = new THREE.Scene();

		var geometry = new THREE.SphereGeometry(200, 40, 30);

		shader = Shaders['earth'];
		uniforms = THREE.UniformsUtils.clone(shader.uniforms);

		uniforms['texture'].value = THREE.ImageUtils.loadTexture(imgDir+'world03.jpg');

		material = new THREE.ShaderMaterial({
				uniforms: uniforms,
				vertexShader: shader.vertexShader,
				fragmentShader: shader.fragmentShader
			});

		mesh = new THREE.Mesh(geometry, material);
		mesh.rotation.y = Math.PI;
		scene.add(mesh);

		// shader = Shaders['atmosphere'];
		// uniforms = THREE.UniformsUtils.clone(shader.uniforms);
		//
		// material = new THREE.ShaderMaterial({
		// 		uniforms: uniforms,
		// 		vertexShader: shader.vertexShader,
		// 		fragmentShader: shader.fragmentShader,
		// 		side: THREE.BackSide,
		// 		blending: THREE.AdditiveBlending,
		// 		transparent: true
		// 	});
		//
		// mesh = new THREE.Mesh(geometry, material);
		// mesh.scale.set( 1.1, 1.1, 1.1 );
		// scene.add(mesh);

		geometry = new THREE.CylinderGeometry( 0.4, 0.4, 20, 32 );
		geometry.applyMatrix(new THREE.Matrix4().makeTranslation(0,0,-0.5));


		point = new THREE.Mesh(geometry);

		renderer = new THREE.WebGLRenderer({antialias: true,alpha: true });
		renderer.setSize(w, h);
		renderer.domElement.style.position = 'absolute';

		container.appendChild(renderer.domElement);

		container.addEventListener('mousedown', onMouseDown, false);

		container.addEventListener('mousewheel', onMouseWheel, false);

		document.addEventListener('keydown', onDocumentKeyDown, false);

		window.addEventListener('resize', onWindowResize, false);

		//document.addEventListener( 'mousemove', onDocumentMouseMove, false );

		container.addEventListener('mouseover', function() {
			overRenderer = true;
		}, false);

		container.addEventListener('mouseout', function() {
			overRenderer = false;
		}, false);
		}

		/*function onDocumentMouseMove( event ) {
						//event.preventDefault();
						mouse2.x = ( event.clientX / window.innerWidth ) * 2 - 1;
						mouse2.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
		}*/


		function addData(data, opts) {
			console.log( 'addData called with');
		console.log( data );

		var lat, lng, color, i, step, colorFnWrapper,name2;

		Number.prototype.map = function (in_min, in_max, out_min, out_max) {
			return (this - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
		}


		opts.animated = opts.animated || false;
		this.is_animated = opts.animated;
		opts.format = opts.format || 'magnitude'; // other option is 'legend'
		if (opts.animated) {
			if (this._baseGeometry === undefined) {
				this._baseGeometry=new THREE.Geometry();
				for (val in data){
					 name2 = data[val].id;
					 lat = data[val].lat;
					 lng = data[val].lon;
					//  size = parseInt(data[val][scale_sheet]);
					//  size = size.map(minscale,maxscale,1,7);
					//  color = colorFn(size);
					// addPoint(lat, lng, size, color, this._baseGeometry, name2);
					// addPoint(lat, lng, color, this._baseGeometry, name2);
				}
			}
			if(this._morphTargetId === undefined) {
				this._morphTargetId = 0;
			} else {
				this._morphTargetId += 1;
			}
			opts.name = opts.name || 'morphTarget'+this._morphTargetId;
		}
		var subgeo = new THREE.Geometry();

		 for (val in data){
			lat = data[val].lat;
			lng = data[val].lon;
			name2 =data[val].id;
			// size = parseInt(data[val][scale_sheet]);
			// size = size.map(minscale,maxscale,2,7) * 200;
			// color = colorFn(size);
			name = data[val].lat;
			//console.log( subgeo );
			addPoint(lat, lng, color, subgeo, name2);
		}
		if (opts.animated) {
			this._baseGeometry.morphTargets.push({'name':"tic"+name2, vertices: subgeo.vertices});
		} else {
			this._baseGeometry = subgeo;
		}

		};

		function createPoints(callback) {
		if (this._baseGeometry !== undefined) {
			if (this.is_animated === false) {
			this.points = new THREE.Mesh(this._baseGeometry, new THREE.MeshBasicMaterial({
					color: 0xffffff,
					vertexColors: THREE.FaceColors,
					morphTargets: false
				}));
			} else {
			if (this._baseGeometry.morphTargets.length < 8) {
				//console.log('t l',this._baseGeometry.morphTargets.length);
				var padding = 8-this._baseGeometry.morphTargets.length;
				 //console.log('padding', padding);
				for(var i=0; i<=padding; i++) {
				//console.log('padding',i);
				 this._baseGeometry.morphTargets.push({'name': 'morphPadding'+i, vertices: this._baseGeometry.vertices});
				}
			}
			this.points = new THREE.Mesh(this._baseGeometry, new THREE.MeshBasicMaterial({
					color: 0xffffff,
					vertexColors: THREE.FaceColors,
					morphTargets: true
				}));
			}
			scene.add(this.points);
		}
		callback();
		}

		this.zoomPoint = function(lat,lng,size,name){
			var color2 = new THREE.Color();
			color2.setRGB(0,0.6,0.188);
			var material2 = new THREE.MeshBasicMaterial({
					color: 0xffffff,
					vertexColors: THREE.FaceColors,
				});
			var newObject;
			var geometry2 = new THREE.CylinderGeometry( 1, 1, 20, 32 );
			var mesh2 = new THREE.Mesh(geometry2,material2);

			var phi = (90 - lat) * Math.PI / 180;
			var theta = (180 - lng) * Math.PI / 180;

			mesh2.position.x = 200 * Math.sin(phi) * Math.cos(theta);
			mesh2.position.y = 200 * Math.cos(phi);
			mesh2.position.z = 200 * Math.sin(phi) * Math.sin(theta);

			mesh2.lookAt(mesh.position);
			mesh2.rotateX(Math.PI / 2 );

			mesh2.scale.y = Math.max(size, 0.1 );
			for (var i = 0; i < mesh2.geometry.faces.length; i++) {
				mesh2.geometry.faces[i].color = color2;
			}
			mesh2.name = name;
			scene.add(mesh2);
		}

		this.erasePoint = function(objectname){
		var selectedObject = scene.getObjectByName(objectname);
		scene.remove(selectedObject);
		}


		//================== ADDING A POINT ======================/

		function addPlane( lat, lng, subgeo, name) {
			var texture = THREE.ImageUtils.loadTexture( imgDir + "sheets_logo.png");
			var geometry = new THREE.CubeGeometry( 10,10,10 );
			var material = new THREE.MeshBasicMaterial( { map: texture } );
			var plane = new THREE.Mesh( geometry, material );
			texture.repeat.set( 2, 2 );
			plane.material.side = THREE.DoubleSide;
			var phi = (90 - lat) * Math.PI / 180;
			var theta = (180 - lng) * Math.PI / 180;
			plane.name = name;
			plane.position.x = 200 * Math.sin(phi) * Math.cos(theta);
			cube.position.y = 207 * Math.cos(phi);
			cube.position.z = 200 * Math.sin(phi) * Math.sin(theta);
			cube.lookAt(mesh.position);
			cube.rotateX(Math.PI / 2 );
			cube.scale.y = 1
			cube.scale.x = 1;
			subgeo.merge(cube.geometry, cube.matrix);
			cube.geometry.computeFaceNormals();
			targetList.push(cube);
			scene.add( plane );
		}

		function addLogo( lat, lng, subgeo, name) {
			var sprite;
			var tl = new THREE.TextureLoader();
			var logo = tl.load( imgDir + "sheets_logo.png", function( texture ) {
				var material = new THREE.SpriteMaterial( { map: texture, color: 0xffffff, fog: true } );
				sprite = new THREE.Sprite( material );
				var phi = (90 - lat) * Math.PI / 180;
				var theta = (180 - lng) * Math.PI / 180;
				sprite.name = name;
				sprite.position.x = 200 * Math.sin(phi) * Math.cos(theta);
				sprite.position.y = 207 * Math.cos(phi);
				sprite.position.z = 200 * Math.sin(phi) * Math.sin(theta);
				sprite.lookAt(mesh.position);
				sprite.rotateX(Math.PI / 2 );
				sprite.scale.y = 10
				sprite.scale.x = 10;
				subgeo.merge(sprite.geometry, sprite.matrix);
				targetList.push(sprite);
				scene.add( sprite );
			});
		}

		function addPoint(lat, lng, color, subgeo, name) {
			//addLogo( lat, lng, subgeo, name );
			addPlane( lat, lng, subgeo, name );

			// var phi = (90 - lat) * Math.PI / 180;
			// var theta = (180 - lng) * Math.PI / 180;
			// point.name= name;
			// point.position.x = 200 * Math.sin(phi) * Math.cos(theta);
			// point.position.y = 200 * Math.cos(phi);
			// point.position.z = 200 * Math.sin(phi) * Math.sin(theta);
			//
			// point.lookAt(mesh.position);
			// point.rotateX(Math.PI / 2 );
			// point.scale.y = 1;
			// // for (var i = 0; i < point.geometry.faces.length; i++) {
			// // 	point.geometry.faces[i].color = color;
			// // }
			// point.updateMatrix();
			// subgeo.merge(point.geometry, point.matrix);
		}

		//================== MOUSIES ======================/

		function onMouseDown(event) {
			event.preventDefault();
			container.addEventListener('mousemove', onMouseMove, false);
			container.addEventListener('mouseup', onMouseUp, false);
			container.addEventListener('mouseout', onMouseOut, false);

			mouseOnDown.x = - event.clientX;
			mouseOnDown.y = event.clientY;

			/* ---------------- */
			// the following line would stop any other event handler from firing
			// (such as the mouse's TrackballControls)
			// event.preventDefault();

			console.log("Click x: " + mouseOnDown.x + " y: " + mouseOnDown.y);

			// find intersections

			// create a Ray with origin at the mouse position
			//   and direction into the scene (camera direction)
			var vector = new THREE.Vector3( mouseOnDown.x, mouseOnDown.y, 1 );
			//console.log( projector );
			//projector.unprojectVector( vector, camera );
			var ray = new THREE.Raycaster( camera.position, vector.sub( camera.position ).normalize() );
			var mouse = new THREE.Vector2();

			// create an array containing all objects in the scene with which the ray intersects
			var intersects = ray.intersectObjects( scene.children, false );
			console.log( scene.children );
			console.log( intersects );

			// if there is one (or more) intersections
			if ( intersects.length > 0 )
			{
				console.log("Hit @ " + toString( intersects[0].object.name ) );
				// change the color of the closest face.
				intersects[ 0 ].face.color.setRGB( 0.8 * Math.random() + 0.2, 0, 0 );
				intersects[ 0 ].object.geometry.colorsNeedUpdate = true;
			}

			/* ---------------- */

			targetOnDown.x = target.x;
			targetOnDown.y = target.y;

			container.style.cursor = 'move';
			}

			function onMouseMove(event) {
			mouse.x = - event.clientX;
			mouse.y = event.clientY;

			var zoomDamp = distance/1000;

			target.x = targetOnDown.x + (mouse.x - mouseOnDown.x) * 0.005 * zoomDamp;
			target.y = targetOnDown.y + (mouse.y - mouseOnDown.y) * 0.005 * zoomDamp;

			target.y = target.y > PI_HALF ? PI_HALF : target.y;
			target.y = target.y < - PI_HALF ? - PI_HALF : target.y;
		}

		function onMouseUp(event) {
			container.removeEventListener('mousemove', onMouseMove, false);
			container.removeEventListener('mouseup', onMouseUp, false);
			container.removeEventListener('mouseout', onMouseOut, false);
			container.style.cursor = 'auto';
		}

		function onMouseOut(event) {
			container.removeEventListener('mousemove', onMouseMove, false);
			container.removeEventListener('mouseup', onMouseUp, false);
			container.removeEventListener('mouseout', onMouseOut, false);
		}

		function onMouseWheel(event) {
			event.preventDefault();
			 if (overRenderer) {
				zoom(event.wheelDeltaY * 0.3);
			}
			return false;
		}

		function onDocumentKeyDown(event) {
			switch (event.keyCode) {
				case 38:
				zoom(100);
				event.preventDefault();
				break;
				case 40:
				zoom(-100);
				event.preventDefault();
				break;
			}
		}

		function onWindowResize( event ) {
			/*camera.aspect = container.offsetWidth / container.offsetHeight;
			camera.updateProjectionMatrix();
			renderer.setSize(container.offsetWidth, container.offsetHeight );*/
		}

		//==================== ZOOM ======================/
		function zoom(delta) {
			distanceTarget -= delta;
			distanceTarget = distanceTarget > 900 ? 900 : distanceTarget;
			distanceTarget = distanceTarget < 600 ? 600 : distanceTarget;
			if(distanceTarget <= 680){
				if (opened_menu ==0){
					hideMenu();
					opened_menu=1;
				}
				$('#data_container').addClass("zoomed");
				$('#data_wrap').addClass("data_wrap_zoomed");
			}
			else{
				opened_menu=0;
				$('#data_container').removeClass("zoomed");
				$('#data_wrap').removeClass("data_wrap_zoomed");
			}
		}

		//==================== ANIMATE ======================/
		function animate() {
			requestAnimationFrame(animate);
			render();
		}



		function render() {

		var color3 = new THREE.Color();
		color3.setRGB(0,0.6,0.188);

		zoom(curZoomSpeed);
		if(distanceTarget >= 780){
			target.x +=0.0001;
		}
		rotation.x += (target.x - rotation.x) * 0.02;
		rotation.y += (target.y - rotation.y) * 0.02;
		distance += (distanceTarget - distance) * 0.2;
		camera.position.x = distance * Math.sin(rotation.x) * Math.cos(rotation.y);
		camera.position.y = distance * Math.sin(rotation.y);
		camera.position.z = distance * Math.cos(rotation.x) * Math.cos(rotation.y);
		camera.lookAt(mesh.position);
		camera.updateMatrixWorld();

		//console.log(scene.children);
		/*	raycaster.setFromCamera( mouse2, camera );
						var intersects = raycaster.intersectObjects( scene.children);
				for ( var i = 0; i < intersects.length; i++ ) {
					for (var i = 0; i < point.geometry.faces.length; i++) {
						point.geometry.faces[i].color = color3;
					}
					}*/
		renderer.render(scene, camera);
	}



	init();
	this.animate = animate;

this.setTarget = function(rot) {
	Number.prototype.map = function (in_min, in_max, out_min, out_max) {
		return (this - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
	}
		if(rot[0]>0){
		destx= rot[0].map(0,75,0,1);
		}
		else if (rot[0]<=0) {
		destx= rot[0].map(-75,0,-1,0);
		}
		if (rot[1]>=0) {
		desty= rot[1].map(0,180,42.5,45.5);
		}
		else if (rot[1]<0) {
		desty= rot[1].map(-180,0,39,42.5);
		}
		target = {x:desty,y:destx};
	}
	this.bigZoom = function(rot) {
		Number.prototype.map = function (in_min, in_max, out_min, out_max) {
		return (this - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
		}
		if(rot[0]>0){
			destx= rot[0].map(0,70,0,1);
		}
		else if (rot[0]<=0) {
			destx= rot[0].map(-70,0,-1,0);
		}
		if (rot[1]>=0) {
			desty= rot[1].map(0,180,42.5,45.5);
		}
		else if (rot[1]<0) {
			desty= rot[1].map(-180,0,39,42.5);
		}
		distanceTarget = 750;
		target = {x:desty,y:destx};
	}

	this.__defineGetter__('time', function() {
	return this._time || 0;
	});

	this.__defineSetter__('time', function(t) {
	var validMorphs = [];
	var morphDict = this.points.morphTargetDictionary;
	for(var k in morphDict) {
		if(k.indexOf('morphPadding') < 0) {
		validMorphs.push(morphDict[k]);
		}
	}
	validMorphs.sort();
	var l = validMorphs.length-1;
	var scaledt = t*l+1;
	var index = Math.floor(scaledt);
	for (i=0;i<validMorphs.length;i++) {
		this.points.morphTargetInfluences[validMorphs[i]] = 0;
	}
	var lastIndex = index - 1;
	var leftover = scaledt - index;
	if (lastIndex >= 0) {
		this.points.morphTargetInfluences[lastIndex] = 1 - leftover;
	}
	this.points.morphTargetInfluences[index] = leftover;
	this._time = t;
	});


function removeObject(scene, object ) {
		var o, ol, zobject;
		if ( object instanceof THREE.Mesh ) {
			for ( o = scene.__webglObjects.length - 1; o >= 0; o -- ) {
				zobject = scene.__webglObjects[ o ].object;
				if ( object == zobject ) {
					scene.__webglObjects.splice( o, 1 );
					return;
				}
			}
		}
	}

	this.resetData = function() {
	removeObject(this.points);
	delete this.points;
	delete this._morphTargetId;
	delete this._baseGeometry;
	this.is_animated = false;
	}

	this.addData = addData;
	this.createPoints = createPoints;
	this.renderer = renderer;
	this.scene = scene;

	return this;

};
