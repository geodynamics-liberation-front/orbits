// HTML Variables
var c;
var ctx;
var canvasBuffer;
var buffer;

// Physics Variables
// Set GM so that the period of an object at 200 is 10 seconds
var twopi=2*Math.PI
var gravity=200
var GM=Math.pow(twopi/10,2)*Math.pow(gravity,3)

// State Variables
var t0
var l0
var satellites=[]
var draw_lines=true
var line_history=true
var line_history_fade=true
var max_lines=300
var lines=new Collection(max_lines)
var run=true

function setG()
{
	GM=Math.pow(twopi/10,2)*Math.pow(gravity,3)
	for( var i=0; i<satellites.length; i++ )
	{
		var s=satellites[i]
		s.omega=omega(s.r)
	}
}

function setRun()
{
	if( run )
	{
		t0=performance.now()
		l0=performance.now()
		window.requestAnimationFrame(paint)
	}
}

function setMaxLines()
{
	lines.max_items=max_lines
}

function Collection(max_items)
{
	this.max_items=max_items || 0
	this.items=[]
}

Object.defineProperty(Collection.prototype,'length',
	{enumerable: true, 
     get: function() { return this.items.length;}, 
	})

function push(o)
{
	this.items.push(o)
	if(this.max_items && this.items.length>this.max_items)
	{
		this.items.splice(0,this.items.length-this.max_items)
	}
}
Collection.prototype.push=push

function toHex(a)
{
	return a>15 ? a.toString(16) : "0"+a.toString(16);
}

function Satellite()
{
	this.a=5
	this._theta=0
	this._r=0
	this._omega=0
	this.theta0=0
	this.red=Math.floor(255*Math.random())
	this.green=Math.floor(255*Math.random())
	this.blue=Math.floor(255*Math.random())
	this.x=0
	this.y=0
	this.r=Math.floor(c.width/2*Math.random())
} 

Object.defineProperty(Satellite.prototype,'theta',
	{enumerable: true, 
     get: function() { return this._theta;}, 
     set: function(v) { this._theta=v; this._calcXY(); }
	})
Object.defineProperty(Satellite.prototype,'period',
    {enumerable: true, 
     get: function() { return twopi/this._omega;}, 
     set: function(T) { this._omega=twopi/T; this._r=radius(this._omega); }
    })
Object.defineProperty(Satellite.prototype,'omega',
    {enumerable: true, 
     get: function() { return this._omega;}, 
     set: function(v) { this._omega=v; this._r=radius(this._omega); }
    })
Object.defineProperty(Satellite.prototype,'r',
    {enumerable: true, 
     get: function() { return this._r;}, 
     set: function(r) { this._r=r; this._omega=omega(r); this._calcXY()}
    })
Object.defineProperty(Satellite.prototype,'color',
    {enumerable: true, 
     set: function(c) { 
		this.red  =parseInt(c[1]+c[2],16);
		this.green=parseInt(c[3]+c[4],16);
		this.blue =parseInt(c[5]+c[6],16);
		}
    })

function calcXY()
{
	this.x=Math.round(this._r*Math.cos(this._theta)) 
	this.y=Math.round(this._r*Math.sin(this._theta)) 
}
Satellite.prototype._calcXY=calcXY

function satelliteRGB()
{
	return "rgb("+this.red+","+this.green+","+this.blue+")"
}
Satellite.prototype.rgb=satelliteRGB

function satelliteRGBA(alpha)
{
	return "rgba("+this.red+","+this.green+","+this.blue+","+alpha+")"
}
Satellite.prototype.rgba=satelliteRGBA

function satelliteHEX()
{
	return "#"+toHex(this.red)+toHex(this.green)+toHex(this.blue)
}
Satellite.prototype.hex=satelliteHEX


function associate_input(name,variable,listener)
{
	var input=document.getElementById(name)

	if( input.type=='checkbox' )
	{
		var f=new Function(variable+"=this.checked"+(listener?"; "+listener+"()":""))
		input.addEventListener("change",f)
		input.checked=window[variable]
	}
	else if (input.type=='range')
	{
		var f=new Function(variable+"=this.value"+(listener?"; "+listener+"()":""))
		input.addEventListener("input",f)
		input.addEventListener("change",f)
		input.value=window[variable]
	}
	else if (input.type='text')
	{
		var f=new Function(variable+"=this.value"+(listener?"; "+listener+"()":""))
		input.addEventListener("change",f)
		input.value=window[variable]
	}
}

function new_satellite()
{
	var s=new Satellite()
	satellites.push(s)
	satellite_table()
	return false;
}

function remove_satellite(n)
{
	satellites.splice(n,1)
	satellite_table()
	return false;
}

function transform()
{
	ctx.save()
	ctx.translate(c.width/2,c.height/2)
	ctx.scale(1,-1) 
}

function v(r)
{
	return Math.sqrt(GM/r)
}

function omega(r)
{
	return Math.sqrt(GM/r)/r
}

function radius(omega)
{
	return Math.pow(GM/omega/omega,1/3)
}

function updateSatelliteRadius()
{
	var s=this.satellite
	s.r=parseFloat(this.value)
}

function paint(t)
{
	var deltaT=(t-t0)/1000	
	var record_line=((t-l0)/1000>.1)
	if(record_line) l0=t
	t0=t

	buffer.clearRect(-c.width/2,-c.height/2,c.width,c.height)	
	if( draw_lines && line_history )
	{
		for( var i=0; i<lines.length; i++ ) 
		{
			alpha = line_history_fade ? i/lines.length : 1.0
			if(alpha>0.01)
			{
				var line=lines.items[i];
				var satStart=line[1]
				var satEnd=line[2]
				line=line[0]
				var grad=buffer.createLinearGradient(line[0],line[1],line[2],line[3])
				grad.addColorStop(0,satStart.rgba(alpha))
				grad.addColorStop(1,satEnd.rgba(alpha))
				buffer.beginPath()
				buffer.moveTo(line[0],line[1])
				buffer.lineTo(line[2],line[3])
				buffer.strokeStyle=grad
				buffer.stroke()
			}
		}
	}

	for( var i=0; i<satellites.length; i++ )
	{
		var s=satellites[i]
		s.theta=s.theta+s.omega*deltaT
		for( var j=0; j<satellites.length; j++)
		{
			var line=[satellites[i].x,satellites[i].y,satellites[j].x,satellites[j].y]
			var grad=buffer.createLinearGradient(satellites[i].x,satellites[i].y,satellites[j].x,satellites[j].y);
			grad.addColorStop(0,satellites[i].rgb())
			grad.addColorStop(1,satellites[j].rgb())

			if(draw_lines)
			{
				buffer.beginPath()
				buffer.moveTo(satellites[i].x,satellites[i].y)
				buffer.lineTo(satellites[j].x,satellites[j].y)
				buffer.strokeStyle=grad
				buffer.stroke()
			}
			if(record_line)
			{
				lines.push([line,satellites[i],satellites[j]])
			} 
		}

		var s=satellites[i]
		buffer.beginPath()
		buffer.arc(s.x,s.y,s.a,0,twopi)
		buffer.fillStyle=s.rgb()
		buffer.strokeStyle="#000000"
		buffer.fill()
		buffer.stroke()
	}
	ctx.clearRect(0,0,c.width,c.height)	
	ctx.drawImage(canvasBuffer,0,0)

	if(run) window.requestAnimationFrame(paint)
}

function satellite_table()
{
	var t=document.getElementById("satellite_table")
	t.innerHTML=''
	for( var i=0; i<satellites.length; i++ )
	{
		var s=satellites[i]

		var r=document.createElement('tr')
		r.className='satellite_label'
		t.appendChild(r)
		var tdLabel=document.createElement('td')
		tdLabel.innerHTML="Satellite #"+i+" "
		var a=document.createElement('a')
		a.innerHTML="[ - ]"
		a.href="#"
		a.addEventListener("click",new Function("remove_satellite("+i+"); return false;"))
		tdLabel.appendChild(a)
		
		var tdValue=document.createElement('td')
		var input=document.createElement('input')
		input.type='color'
		input.value=s.hex()
		tdValue.appendChild(input)
		var cp=new ColorPicker(input,50,10)
		cp.addEventListener("change",function() { this.satellite.color=this.value })
		s.color_input=cp
		cp.satellite=s
		r.appendChild(tdLabel)
		r.appendChild(tdValue)

		r=document.createElement('tr')
		t.appendChild(r)
		tdLabel=document.createElement('td')
		tdLabel.innerHTML="radius"
		tdValue=document.createElement('td')
		input=document.createElement('input')
		input.satellite=s
		s.radius_input=input
		input.type='range'
		input.min='10'
		input.max='250'
		input.value=s.r
		input.addEventListener("change",updateSatelliteRadius)
		input.addEventListener("input",updateSatelliteRadius)
		tdValue.appendChild(input)
		r.appendChild(tdLabel)
		r.appendChild(tdValue)
	}
}


function init()
{
	c=document.getElementById('paper')
	ctx=c.getContext('2d')

	canvasBuffer=document.createElement('canvas')
	canvasBuffer.width=c.width
	canvasBuffer.height=c.height
	buffer=canvasBuffer.getContext('2d')
	buffer.translate(c.width/2,c.height/2)
	buffer.scale(1,-1) 

	new_satellite()
	new_satellite()
	new_satellite()

	associate_input('G','gravity','setG')
	associate_input('Run','run','setRun')
	associate_input('Lines','max_lines','setMaxLines')
	associate_input('LineHistory','line_history')
	associate_input('LineHistoryFade','line_history_fade')
	associate_input('DrawLines','draw_lines')

	satellite_table()

	t0=performance.now()
	l0=performance.now()
	window.requestAnimationFrame(paint);
}
