// HTML Variables
var c;
var ctx;
var canvasBuffer;
var buffer;
var settings;
var settings_table;
var btn;
var layer;

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
var line_frequency=10
var line_history_fade=true
var max_lines=300
var lines=new Collection(max_lines)
var run=true
var max_radius=250
var show_settings=false;

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

function Satellite(r,g,b)
{
	this.a=5
	this._theta=0
	this._r=0
	this._omega=0
	this.theta0=0
	this.red=r||Math.floor(255*Math.random())
	this.green=g||Math.floor(255*Math.random())
	this.blue=b||Math.floor(255*Math.random())
	this.x=0
	this.y=0
	this.r=Math.floor(max_radius*(.8*Math.random()+.1))
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

function new_satellite(r,g,b)
{
	var s=new Satellite(r,g,b)
	satellites.push(s)
	satellite_table()
	return s;
}

function remove_satellite(n)
{
	var s=satellites[n]
	satellites.splice(n,1)
	satellite_table()
	return s;
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
	var record_line=((t-l0)/1000>(1/line_frequency))
	var line,satStart,satEnd,grad,i,j,s
	if(record_line) l0=t
	t0=t

	buffer.clearRect(-c.width/2,-c.height/2,c.width,c.height)	
	if( draw_lines && line_history )
	{
		for( i=0; i<lines.length; i++ ) 
		{
			alpha = line_history_fade ? i/lines.length : 1.0
			if(alpha>0.01)
			{
				line=lines.items[i];
				satStart=line[1]
				satEnd=line[2]
				line=line[0]
				grad=buffer.createLinearGradient(line[0],line[1],line[2],line[3])
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

	for( i=0; i<satellites.length; i++ )
	{
		s=satellites[i]
		s.theta=s.theta+s.omega*deltaT
	}
	for( i=0; i<satellites.length; i++ )
	{
		s=satellites[i]
		for( j=0; j<satellites.length; j++)
		{
			line=[satellites[i].x,satellites[i].y,satellites[j].x,satellites[j].y]
			if(draw_lines)
			{
				grad=buffer.createLinearGradient(satellites[i].x,satellites[i].y,satellites[j].x,satellites[j].y);
				grad.addColorStop(0,satellites[i].rgb())
				grad.addColorStop(1,satellites[j].rgb())
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
	var i,s,r,tdLabel,a,tdValue,input,cp
	t.innerHTML=''
	for(  i=0; i<satellites.length; i++ )
	{
		s=satellites[i]

		r=document.createElement('tr')
		r.className='satellite_label'
		t.appendChild(r)
		tdLabel=document.createElement('td')
		tdLabel.innerHTML="Satellite #"+i+" "
		a=document.createElement('a')
		a.innerHTML="[ - ]"
		a.href="#"
		a.addEventListener("click",new Function(['e'],"remove_satellite("+i+"); e.preventDefault(); return false;"))
		tdLabel.appendChild(a)
		
		tdValue=document.createElement('td')
		input=document.createElement('input')
		input.type='color'
		input.value=s.hex()
		tdValue.appendChild(input)
		cp=new ColorPicker(input,50,10)
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
		input.max=max_radius
		input.value=s.r
		input.addEventListener("change",updateSatelliteRadius)
		input.addEventListener("input",updateSatelliteRadius)
		tdValue.appendChild(input)
		r.appendChild(tdLabel)
		r.appendChild(tdValue)
	}
}

function resize_canvas()
{
	c.width=window.innerWidth
	c.height=window.innerHeight
	canvasBuffer.width=window.innerWidth
	canvasBuffer.height=window.innerHeight

	buffer.restore()
	buffer.save()
	buffer.translate(c.width/2,c.height/2)
	buffer.scale(1,-1) 

	if(!run) window.requestAnimationFrame(paint)

	max_radius=Math.min(c.width,c.height)/2
	satellite_table()
}

function toggle_settings(e)
{
	show_settings=!show_settings	
	if( show_settings )
	{
		settings.style.height="auto"
		setTimeout(function() { settings.style.overflow="visible" },550 )
	}
	else
	{
		for( var i=0; i<satellites.length; i++ )
		{
			satellites[i].color_input.revert_color()
		}
		settings.style.overflow="hidden"
		
		setTimeout(function() { settings.style.height="0" },550 )
	}
	settings_table.style.transform=show_settings?"translate(0,0)":"translate(0,-100%)"
	var fill=show_settings?"rgb(120,120,120)":"rgb(50,50,50)"
	var elem=layer.firstElementChild
	while(elem!=null)
	{
		elem.style.fill=fill
		elem=elem.nextElementSibling
	}
}


function init(sats)
{
	btn=document.getElementById('setting_btn')
	btn=btn.contentDocument
	layer=btn.getElementById("layer1")
	btn.addEventListener("click",toggle_settings)
	settings=document.getElementById('settings')
	settings_table=document.getElementById('settings_table')

	document.getElementById('add_satellite').addEventListener('click',function(e) {new_satellite(); e.preventDefault(); return false;})

	c=document.getElementById('paper')
	ctx=c.getContext('2d')

	canvasBuffer=document.createElement('canvas')
	canvasBuffer.width=c.width
	canvasBuffer.height=c.height
	buffer=canvasBuffer.getContext('2d')
	buffer.save()
	buffer.translate(c.width/2,c.height/2)
	buffer.scale(1,-1) 

	var H=360*Math.random()
	var S=.25*Math.random()+.75
	var V=.25*Math.random()+.75
	var rgb
	
	sats=sats||3

	for(var i=0; i<sats; i++)
	{	
		rgb=hsv2rgb(H,S,V) 
		new_satellite(Math.round(255*rgb[0]),Math.round(255*rgb[1]),Math.round(255*rgb[2]))
		H=(H+360/sats)%360
	}
	
	satellite_table()

	associate_input('G','gravity','setG')
	associate_input('Run','run','setRun')
	associate_input('Lines','max_lines','setMaxLines')
	associate_input('LineHistory','line_history')
	associate_input('LineFrequency','line_frequency')
	associate_input('LineHistoryFade','line_history_fade')
	associate_input('DrawLines','draw_lines')

	window.addEventListener('resize',resize_canvas)

	t0=performance.now()
	l0=performance.now()
	resize_canvas()
	window.requestAnimationFrame(paint)
}
