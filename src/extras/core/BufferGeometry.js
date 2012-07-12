/**
 * @author alteredq / http://alteredqualia.com/
 */

THREE.BufferGeometry = function () {

	this.id = THREE.GeometryCount ++;

	// attributes

	this.attributes = {};

	// attributes typed arrays are kept only if dynamic flag is set

	this.dynamic = false;

	// boundings

	this.boundingBox = null;
	this.boundingSphere = null;

	// for compatibility

	this.morphTargets = [];
	this.morphNormals = [];

};

THREE.BufferGeometry.prototype = {

	constructor : THREE.BufferGeometry,

	applyMatrix: function ( matrix ) {

		var positionArray;
		var normalArray;

		if ( this.attributes[ "position" ] ) positionArray = this.attributes[ "position" ].array;
		if ( this.attributes[ "normal" ] ) normalArray = this.attributes[ "normal" ].array;

		if ( positionArray !== undefined ) {

			matrix.multiplyVector3Array( positionArray );
			this.verticesNeedUpdate = true;

		}

		if ( normalArray !== undefined ) {

			var matrixRotation = new THREE.Matrix4();
			matrixRotation.extractRotation( matrix );

			matrixRotation.multiplyVector3Array( normalArray );
			this.normalsNeedUpdate = true;

		}

	},

	computeBoundingBox: function () {

		if ( ! this.boundingBox ) {

			this.boundingBox = {

				min: new THREE.Vector3( Infinity, Infinity, Infinity ),
				max: new THREE.Vector3( -Infinity, -Infinity, -Infinity )

			};

		}

		var positions = this.attributes[ "position" ].array;

		if ( positions ) {

			var bb = this.boundingBox;
			var x, y, z;

			for ( var i = 0, il = positions.length; i < il; i += 3 ) {

				x = positions[ i ];
				y = positions[ i + 1 ];
				z = positions[ i + 2 ];

				// bounding box

				if ( x < bb.min.x ) {

					bb.min.x = x;

				} else if ( x > bb.max.x ) {

					bb.max.x = x;

				}

				if ( y < bb.min.y ) {

					bb.min.y = y;

				} else if ( y > bb.max.y ) {

					bb.max.y = y;

				}

				if ( z < bb.min.z ) {

					bb.min.z = z;

				} else if ( z > bb.max.z ) {

					bb.max.z = z;

				}

			}

		}

		if ( positions === undefined || positions.length === 0 ) {

			this.boundingBox.min.set( 0, 0, 0 );
			this.boundingBox.max.set( 0, 0, 0 );

		}

	},

	computeBoundingSphere: function () {

		if ( ! this.boundingSphere ) this.boundingSphere = { radius: 0 };

		var positions = this.attributes[ "position" ].array;

		if ( positions ) {

			var radius, maxRadius = 0;
			var x, y, z;

			for ( var i = 0, il = positions.length; i < il; i += 3 ) {

				x = positions[ i ];
				y = positions[ i + 1 ];
				z = positions[ i + 2 ];

				radius = Math.sqrt( x * x + y * y + z * z );
				if ( radius > maxRadius ) maxRadius = radius;

			}

			this.boundingSphere.radius = maxRadius;

		}

	},

	computeVertexNormals: function () {

		if ( this.attributes[ "position" ] && this.attributes[ "index" ] ) {

			var i, il;
			var j, jl;

			var nVertices = this.attributes[ "position" ].array.length;

			if ( this.attributes[ "normal" ] === undefined ) {

				this.attributes[ "normal" ] = {

					itemSize: 3,
					array: new Float32Array( nVertices ),
					numItems: nVertices * 3

				};

			} else {

				// reset existing normals to zero

				for ( i = 0, il = this.attributes[ "normal" ].array.length; i < il; i ++ ) {

					this.attributes[ "normal" ].array[ i ] = 0;

				}

			}

			var offsets = this.offsets;

			var indices = this.attributes[ "index" ].array;
			var positions = this.attributes[ "position" ].array;
			var normals = this.attributes[ "normal" ].array;

			var vA, vB, vC, x, y, z,

			pA = new THREE.Vector3(),
			pB = new THREE.Vector3(),
			pC = new THREE.Vector3(),

			cb = new THREE.Vector3(),
			ab = new THREE.Vector3();

			for ( j = 0, jl = offsets.length; j < jl; ++ j ) {

				var start = offsets[ j ].start;
				var count = offsets[ j ].count;
				var index = offsets[ j ].index;

				for ( i = start, il = start + count; i < il; i += 3 ) {

					vA = index + indices[ i ];
					vB = index + indices[ i + 1 ];
					vC = index + indices[ i + 2 ];

					x = positions[ vA * 3 ];
					y = positions[ vA * 3 + 1 ];
					z = positions[ vA * 3 + 2 ];
					pA.set( x, y, z );

					x = positions[ vB * 3 ];
					y = positions[ vB * 3 + 1 ];
					z = positions[ vB * 3 + 2 ];
					pB.set( x, y, z );

					x = positions[ vC * 3 ];
					y = positions[ vC * 3 + 1 ];
					z = positions[ vC * 3 + 2 ];
					pC.set( x, y, z );

					cb.sub( pC, pB );
					ab.sub( pA, pB );
					cb.crossSelf( ab );

					normals[ vA * 3 ] 	  += cb.x;
					normals[ vA * 3 + 1 ] += cb.y;
					normals[ vA * 3 + 2 ] += cb.z;

					normals[ vB * 3 ] 	  += cb.x;
					normals[ vB * 3 + 1 ] += cb.y;
					normals[ vB * 3 + 2 ] += cb.z;

					normals[ vC * 3 ] 	  += cb.x;
					normals[ vC * 3 + 1 ] += cb.y;
					normals[ vC * 3 + 2 ] += cb.z;

				}

			}

			// normalize normals

			for ( i = 0, il = normals.length; i < il; i += 3 ) {

				x = normals[ i ];
				y = normals[ i + 1 ];
				z = normals[ i + 2 ];

				var n = 1.0 / Math.sqrt( x * x + y * y + z * z );

				normals[ i ] 	 *= n;
				normals[ i + 1 ] *= n;
				normals[ i + 2 ] *= n;

			}

			this.normalsNeedUpdate = true;

		}

	}, 

	computeMorphNormals: function () {
		//Adapted from js-openctm

		for ( var m = 0, ml = this.morphTargets.length; m < ml; m++ ) {

			var stride = this.morphTargets[ m ].stride;
			var vertices = this.morphTargets[ m ].array;
			var indices = this.attributes.index.array;

			var smooth = new Float32Array(vertices.length / stride * 3),
				sidx, sidy, sidz,
				indx, indy, indz, nx, ny, nz,
				v1x, v1y, v1z, v2x, v2y, v2z, len,
				i, k;

			for (i = 0, k = indices.length; i < k;){
				indx = indices[i ++];
				indy = indices[i ++];
				indz = indices[i ++];
				sidx = indx * 3;
				sidy = indy * 3;
				sidz = indz * 3;
				indx *= stride;
				indy *= stride;
				indz *= stride;

				v1x = vertices[indy]     - vertices[indx];
				v2x = vertices[indz]     - vertices[indx];
				v1y = vertices[indy + 1] - vertices[indx + 1];
				v2y = vertices[indz + 1] - vertices[indx + 1];
				v1z = vertices[indy + 2] - vertices[indx + 2];
				v2z = vertices[indz + 2] - vertices[indx + 2];

				nx = v1y * v2z - v1z * v2y;
				ny = v1z * v2x - v1x * v2z;
				nz = v1x * v2y - v1y * v2x;

				len = Math.sqrt(nx * nx + ny * ny + nz * nz);
				if (len > 1e-10){
					nx /= len;
					ny /= len;
					nz /= len;
				}

				smooth[sidx]     += nx;
				smooth[sidx + 1] += ny;
				smooth[sidx + 2] += nz;
				smooth[sidy]     += nx;
				smooth[sidy + 1] += ny;
				smooth[sidy + 2] += nz;
				smooth[sidz]     += nx;
				smooth[sidz + 1] += ny;
				smooth[sidz + 2] += nz;
			}

			for (i = 0, k = smooth.length; i < k; i += 3){
				len = Math.sqrt(
					smooth[i] * smooth[i] + 
					smooth[i + 1] * smooth[i + 1] +	
					smooth[i + 2] * smooth[i + 2]);

				if(len > 1e-10){
					smooth[i]     /= len;
					smooth[i + 1] /= len;
					smooth[i + 2] /= len;
				}
			}
		
			this.morphNormals.push( smooth );

		}

	},

	reorderVertices: function () {

		var scope = this;

		var vertexIndexArray = this.attributes.index.array,
			vertexPositionArray = this.attributes.position.array,
			vertexNormalArray = this.attributes.normal.array,
			vertexUvArray = this.attributes.uv.array,
			vertexColorArray = this.attributes.color.array;

		var newFaces = new Uint32Array( vertexIndexArray.length ),
			newVertices = new Float32Array( vertexPositionArray.length );

		var newNormals, newUvs, newColors, newMorphTargets, morph, nmorph, vmorph, array;

		if ( vertexNormalArray ) newNormals = new Float32Array( vertexNormalArray.length );
		if ( vertexUvArray ) newUvs = new Float32Array( vertexUvArray.length );
		if ( vertexColorArray ) newColors = new Float32Array( vertexColorArray.length );

		for (var i = 0, il = this.morphTargets.length; i < il; i++) {

			morph = this.morphTargets[ i ];
			array = new Float32Array(morph.array.length / morph.stride * 3);

			newMorphTargets.push({array:array, stride:3});

		}

		var indexMap = {}, vertexCounter = 0;

		function handleVertex( v ) {

			if ( indexMap[ v ] === undefined ) {

				indexMap[ v ] = vertexCounter;

				var sx = v * 3,
					sy = v * 3 + 1,
					sz = v * 3 + 2,

					dx = vertexCounter * 3,
					dy = vertexCounter * 3 + 1,
					dz = vertexCounter * 3 + 2;

				newVertices[ dx ] = vertexPositionArray[ sx ];
				newVertices[ dy ] = vertexPositionArray[ sy ];
				newVertices[ dz ] = vertexPositionArray[ sz ];

				if ( vertexNormalArray ) {

					newNormals[ dx ] = vertexNormalArray[ sx ];
					newNormals[ dy ] = vertexNormalArray[ sy ];
					newNormals[ dz ] = vertexNormalArray[ sz ];

				}

				if ( vertexUvArray ) {

					newUvs[ vertexCounter * 2 ] 	= vertexUvArray[ v * 2 ];
					newUvs[ vertexCounter * 2 + 1 ] = vertexUvArray[ v * 2 + 1 ];

				}

				if ( vertexColorArray ) {

					newColors[ vertexCounter * 4 ] 	   = vertexColorArray[ v * 4 ];
					newColors[ vertexCounter * 4 + 1 ] = vertexColorArray[ v * 4 + 1 ];
					newColors[ vertexCounter * 4 + 2 ] = vertexColorArray[ v * 4 + 2 ];
					newColors[ vertexCounter * 4 + 3 ] = vertexColorArray[ v * 4 + 3 ];

				}

				if ( scope.morphTargets.length > 0 ) {

					for (var i = 0, il = scope.morphTargets.length; i < il; i++) {

						nmorph = newMorphTargets[i];
						vmorph = scope.morphTargets[i];

						nmorph.array[vertexCounter * nmorph.stride ]    = vmorph.array[ v*vmorph.stride ];
						nmorph.array[vertexCounter * nmorph.stride + 1] = vmorph.array[ v*vmorph.stride + 1];
						nmorph.array[vertexCounter * nmorph.stride + 2] = vmorph.array[ v*vmorph.stride + 2];

					}

				}

				vertexCounter += 1;

			}

		}

		var a, b, c;

		for ( var i = 0; i < vertexIndexArray.length; i += 3 ) {

			a = vertexIndexArray[ i ];
			b = vertexIndexArray[ i + 1 ];
			c = vertexIndexArray[ i + 2 ];

			handleVertex( a );
			handleVertex( b );
			handleVertex( c );

			newFaces[ i ] 	  = indexMap[ a ];
			newFaces[ i + 1 ] = indexMap[ b ];
			newFaces[ i + 2 ] = indexMap[ c ];

		}

		vertexIndexArray = newFaces;
		vertexPositionArray = newVertices;

		scope.attributes.index.array = newFaces;
		scope.attributes.position.array = newVertices;
		scope.morphTargets = newMorphTargets;

		if ( vertexNormalArray ) scope.attributes.normal.array = newNormals;
		if ( vertexUvArray ) scope.attributes.uv.array = newUvs;
		if ( vertexColorArray ) scope.attributes.color.array = newColors;

		// compute offsets

		scope.offsets = [];

		var indices = vertexIndexArray;

		var start = 0,
			min = vertexPositionArray.length,
			max = 0,
			minPrev = min;

		for ( var i = 0; i < indices.length; ) {

			for ( var j = 0; j < 3; ++ j ) {

				var idx = indices[ i ++ ];

				if ( idx < min ) min = idx;
				if ( idx > max ) max = idx;

			}

			if ( max - min > 65535 ) {

				i -= 3;

				for ( var k = start; k < i; ++ k ) {

					indices[ k ] -= minPrev;

				}

				scope.offsets.push( { start: start, count: i - start, index: minPrev } );

				start = i;
				min = vertexPositionArray.length;
				max = 0;

			}

			minPrev = min;

		}

		for ( var k = start; k < i; ++ k ) {

			indices[ k ] -= minPrev;

		}

		scope.offsets.push( { start: start, count: i - start, index: minPrev } );

	}

};

