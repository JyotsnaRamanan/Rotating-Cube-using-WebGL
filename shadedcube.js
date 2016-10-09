var canvas;
var gl;

var NumVertices  = 36;

var points = [];
var colors = [];
var normalsArray = [];
var pointsArray = [];
var quaternion = [ 0, 0, 0, 1 ];
var quaternionLoc;

//shading 
/*var lightPosition = vec4(1.0, 1.0, 1.0, 0.0 );
var lightAmbient = vec4(0.2, 0.2, 0.2, 1.0 );
var lightDiffuse = vec4( 1.0, 1.0, 1.0, 1.0 );
var lightSpecular = vec4( 1.0, 1.0, 1.0, 1.0 );

var materialAmbient = vec4( 1.0, 0.0, 1.0, 1.0 );
var materialDiffuse = vec4( 1.0, 0.8, 0.0, 1.0);
var materialSpecular = vec4( 1.0, 0.8, 0.0, 1.0 );
var materialShininess = 100.0;

var ctm;
var ambientColor, diffuseColor, specularColor;
var modelView, projection;
var viewerPos;*/
var program;

var g_mousedrag = false;
var mouseMove = false;


var cur_x;
var cur_y;
var start_x = 0;
var start_y = 0;

var angle = 0.0;
var axis = [0, 0, 0];

var lastPos = [0, 0, 0];

window.onload = function init()
{
    canvas = document.getElementById( "gl-canvas" );
    
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    colorCube();

    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 0.5, 0.5, 0.5, 1.0 );
    
    gl.enable(gl.DEPTH_TEST);

    //
    //  Load shaders and initialize attribute buffers
    //
    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );
    
    var cBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW );

    var vColor = gl.getAttribLocation( program, "vColor" );
    gl.vertexAttribPointer( vColor, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vColor );

    var vBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW );

    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 3, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );

    quaternionLoc = gl.getUniformLocation(program, "quaternion");
    
    //event listeners for mouse
    
	//MOUSE DOWN
    canvas.addEventListener('mousedown', function(e){
		var event = e || window.event;

		g_mousedrag = true;

		var client_x_r = event.clientX - this.offsetLeft;
		var client_y_r = event.clientY - this.offsetTop;
		var clip_x = -1 + 2 * client_x_r / this.width;
		var clip_y = -1 + 2 * (this.height - client_y_r) / this.height;

		start_x = clip_x;
		start_y = clip_y;
		cur_x = clip_x;
		cur_y = clip_y;
		mouseMove = true;

	}, false);

	//MOUSE MOVE
    canvas.addEventListener('mousemove', function(e){
		var event = e || window.event;
	
	var client_x_r = event.clientX - this.offsetLeft;
	var client_y_r = event.clientY - this.offsetTop;
	var clip_x = -1 + 2 * client_x_r / this.width;
	var clip_y = -1 + 2 * (this.height - client_y_r) / this.height;
	
	if(g_mousedrag) {

	cur_x = clip_x;
	cur_y = clip_y;

	var p1 = [start_x, start_y, Math.sqrt(1 - Math.pow(start_x,2.0) - Math.pow(start_y,2.0))];
	var p2 = [cur_x, cur_y, Math.sqrt(1 - Math.pow(cur_x,2.0) - Math.pow(cur_y,2.0))];

	if( length([p1[0],p1[1]]) > 1) {
		p1 = [p1[0] / length([p1[0],p1[1]]), p1[1] / length([p1[0],p1[1]]), 0];
	}
	if( length([p2[0],p2[1]]) > 1) {
		p2 = [p2[0] / length([p2[0],p2[1]]), p2[1] / length([p2[0],p2[1]]), 0];
	}
	if(length([p1[0],p1[1]]) == 0)
	{
		p1 = [p1[0]+0.00001, p1[1]+0.00001, p1[2]];
	}

	var n = cross(p1,p2);
	angle = dot(p1,p2) / (length(p1) * length(p2));
	angle = Math.acos(angle);

	var temp1 = Math.sin(angle/2,0) * n[0] / length(n);
	var temp2 = Math.sin(angle/2,0) * n[1] / length(n);
	var temp3 = Math.sin(angle/2,0) * n[2] / length(n);
	quaternion = [Math.cos(angle/2.0), temp1, temp2, temp3];

	}
	
	}, false);

	//MOUSE UP
    canvas.addEventListener('mouseup', function(e){
		var event = e || window.event;

		g_mousedrag = false;

		var client_x_r = event.clientX - this.offsetLeft;
		var client_y_r = event.clientY - this.offsetTop;
		var clip_x = -1 + 2 * client_x_r / this.width;
		var clip_y = -1 + 2 * (this.height - client_y_r) / this.height;

		angle = 0.0;
		mouseMove = false;

		lastPos = [cur_x, cur_y];
	}, false);
    
	 gl.uniform4fv(quaternionLoc, quaternion);
        
    render();
}

function colorCube()
{
    quad( 1, 0, 3, 2 );
    quad( 2, 3, 7, 6 );
    quad( 3, 0, 4, 7 );
    quad( 6, 5, 1, 2 );
    quad( 4, 5, 6, 7 );
    quad( 5, 4, 0, 1 );
}

function quad(a, b, c, d) 
{
    var vertices = [
        vec3( -0.5, -0.5,  0.5 ),
        vec3( -0.5,  0.5,  0.5 ),
        vec3(  0.5,  0.5,  0.5 ),
        vec3(  0.5, -0.5,  0.5 ),
        vec3( -0.5, -0.5, -0.5 ),
        vec3( -0.5,  0.5, -0.5 ),
        vec3(  0.5,  0.5, -0.5 ),
        vec3(  0.5, -0.5, -0.5 )
    ]; //initial vertices

     /*var t1 = subtract(vertices[b], vertices[a]);
     var t2 = subtract(vertices[c], vertices[b]);
     var normal = cross(t1, t2);
     var normal = vec3(normal);
     normal = normalize(normal);

     pointsArray.push(vertices[a]); 
     normalsArray.push(normal); 
     pointsArray.push(vertices[b]); 
     normalsArray.push(normal); 
     pointsArray.push(vertices[c]); 
     normalsArray.push(normal);   
     pointsArray.push(vertices[a]);  
     normalsArray.push(normal); 
     pointsArray.push(vertices[c]); 
     normalsArray.push(normal); 
     pointsArray.push(vertices[d]); 
     normalsArray.push(normal);  */ 

    var vertexColors = [
        [ 0.0, 1.0, 1.0, 1.0 ]   // cyan
        [ 0.0, 0.0, 0.0, 1.0 ],  // black
        [ 1.0, 1.0, 0.0, 1.0 ],  // yellow
        [ 1.0, 1.0, 1.0, 1.0 ],  // white
        [ 0.0, 0.0, 1.0, 1.0 ],  // blue
        [ 0.0, 1.0, 0.0, 1.0 ],  // green
        [ 1.0, 0.0, 1.0, 1.0 ],  // magenta
        [ 1.0, 0.0, 0.0, 1.0 ],  // red 
    ]; 
    
    //vertex color assigned by the index of the vertex
    
    var indices = [ a, b, c, a, c, d ];

    for ( var i = 0; i < indices.length; ++i ) {
        points.push( vertices[indices[i]] );
    
        // for solid colored faces 
        colors.push(vertexColors[a]);
        
    }
}

function render()
{
	gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	if(mouseMove)
	{
		//quaternion = [angle, axis[0], axis[1], axis[2]];
		if(!(isNaN(quaternion[0]) || isNaN(quaternion[1]) || isNaN(quaternion[2]) || isNaN(quaternion[3])))
		{
			gl.uniform4fv(quaternionLoc, quaternion);
		}
	}

    gl.drawArrays( gl.TRIANGLES, 0, NumVertices );

    requestAnimFrame( render );
}

