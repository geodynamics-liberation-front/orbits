COS30=Math.cos(30*Math.PI/180)
SIN30=Math.sin(30*Math.PI/180)

function event_xy(e,elem)
{
	var cr=elem.getBoundingClientRect()
	return {
		x: e.clientX-cr.left,
		y: e.clientY-cr.top
	}
}

function is_in(e,elem)
{
	var cr=elem.getBoundingClientRect()
	return e.clientY<cr.bottom && e.clientY>cr.top && e.clientX>cr.left && e.clientX<cr.right
}

function hex2hsv(hex)
{
	return rgb2hsv( parseInt(hex.slice(1,3),16), parseInt(hex.slice(3,5),16), parseInt(hex.slice(5,7),16) )
}

function rgb2hex(rgb)
{
	r=Math.round(rgb[0]*255),g=Math.round(rgb[1]*255),b=Math.round(rgb[2]*255)
	return "#"+ (r<16 ? '0':'')+r.toString(16) + (g<16 ? '0':'')+g.toString(16) + (b<16 ? '0':'')+b.toString(16)
}

function hsv2rgb(H,S,V) 
{
	H=H%360
	if(H<0) H=H+360
	var C=V*S
	var Hp=H/60
	var X=C*(1-Math.abs(Hp%2-1))
	if(Hp<1)       rgb=[C,X,0]
	else if(Hp<2)  rgb=[X,C,0]
	else if(Hp<3)  rgb=[0,C,X]
	else if(Hp<4)  rgb=[0,X,C]
	else if(Hp<5)  rgb=[X,0,C]
	else if(Hp<6)  rgb=[C,0,X]
	var m=V-C
	return [rgb[0]+m,rgb[1]+m,rgb[2]+m]
}

function rgb2hsv(r,g,b) 
{
	var computedH = 0;
	var computedS = 0;
	var computedV = 0;

	r=r/255; g=g/255; b=b/255;
	var minRGB = Math.min(r,Math.min(g,b));
	var maxRGB = Math.max(r,Math.max(g,b));

	// Black-gray-white
	if (minRGB==maxRGB) 
	{
		computedV = minRGB;
		return [0,0,computedV];
	}

	 // Colors other than black-gray-white:
	 var d = (r==minRGB) ? g-b : ((b==minRGB) ? r-g : b-r);
	 var h = (r==minRGB) ? 3 : ((b==minRGB) ? 1 : 5);
	 computedH = 60*(h - d/(maxRGB - minRGB));
	 computedS = (maxRGB - minRGB)/maxRGB;
	 computedV = maxRGB;
	 return [computedH,computedS,computedV];
}

function line_function(x1,y1,x2,y2)
{
	var m=(y1-y2)/(x1-x2)
	var b=y1-x1*m
	return function(x) { return m*x+b; }
}

function addCanvas(w,h,elem,events)
{
	var o=new Object()
	o.canvas=document.createElement('canvas')
	o.canvas.className='color_picker'
	o.canvas.style.position="absolute"
	o.canvas.width=w
	o.canvas.height=h
	o.ctx=o.canvas.getContext('2d')
	o.id=o.ctx.createImageData(w,h)
	o.data=o.id.data

	if(events)
	{
		for( e in events )
		{
			document.addEventListener(e,events[e],true)
		}
	}
	if(elem)
	{
		elem.appendChild(o.canvas)
	}
	return o
}

function ColorPicker(input,w,h)
{
	var hsv=hex2hsv(input.value)
	this._H0=hsv[0]
	this._S0=hsv[1]
	this._V0=hsv[2]
	this._H=hsv[0]
	this._S=hsv[1]
	this._V=hsv[2]
	this._listeners=new Object()

	var color_picker=this


	this.input=input
	var input_box=input.getBoundingClientRect()
	input.addEventListener('change',function(e) {color_picker.value=input.value})
	input.style.display="none"

	this.elem=document.createElement('div')
	this.elem.className="color_picker"
	this.elem.style.display="inline-block"
	this.input.parentNode.insertBefore(this.elem,input)

	this.swatch=new Object()
	this.swatch.canvas=canvas=document.createElement('canvas')
	this.swatch.canvas.addEventListener('click',function(e) {color_picker.swatch_click(e)},true)
	this.swatch.canvas.style.verticalAlign="middle"
	this.swatch.canvas.width=w||input_box.width
	this.swatch.canvas.height=h||input_box.height
	this.swatch.ctx=this.swatch.canvas.getContext('2d')
	this.elem.appendChild(this.swatch.canvas)

	this.selector_elem=document.createElement('div')
	this.selector_elem.style.display="none"
	this.elem.appendChild(this.selector_elem)

	this.outer_radius=100
	this.inner_radius=80
	this.delta_radius=this.outer_radius-this.inner_radius
	this.triangle_height=this.inner_radius*(1+SIN30)
	this.triangle_base=2*this.inner_radius*COS30

	this.selecting_hue=false;
	this.selecting_saturation_value=false;
	
	this.svCanvas=addCanvas(2*this.outer_radius,2*this.outer_radius,this.selector_elem)
	this.svCanvas.canvas.style.backgroundColor="rgba(0,0,0,.7)"
	this.svBuffer=addCanvas(2*this.outer_radius,2*this.outer_radius)
	this.hCanvas=addCanvas(2*this.outer_radius,2*this.outer_radius,this.selector_elem)
	this.canvas=addCanvas(2*this.outer_radius,2*this.outer_radius,this.selector_elem,{
		mousedown: function(e) {color_picker.mousedown(e); return false},
		mouseup:   function(e) {color_picker.mouseup(e); return false},
		mousemove: function(e) {color_picker.mousemove(e); return false},
		click: function(e) {color_picker.mousemove(e); return false}
	})

	document.addEventListener('keyup',function(e) {color_picker.keyup(e)})

	this.line_a=line_function(this.outer_radius,this.outer_radius-this.inner_radius,this.outer_radius-this.inner_radius*COS30,this.outer_radius+this.inner_radius*SIN30)
	this.line_b=line_function(this.outer_radius,this.outer_radius-this.inner_radius,this.outer_radius+this.inner_radius*COS30,this.outer_radius+this.inner_radius*SIN30)
	this.draw_hue()
	this.draw_saturation_value()
	this.draw_selectors()
	this.draw_swatch()
}

Object.defineProperty(ColorPicker.prototype,'h',
	{enumerable: true, 
     get: function() { return this._H;}, 
     set: function(H) { H=H%360; if(H<0) H=H+360; this._H=H; this.draw_saturation_value();this.draw_selectors();this.draw_swatch();} 
	})
Object.defineProperty(ColorPicker.prototype,'s',
	{enumerable: true, 
     get: function() { return this._S;}, 
     set: function(S) { this._S=S; this.draw_selectors(),this.draw_swatch()} 
	})
Object.defineProperty(ColorPicker.prototype,'v',
	{enumerable: true, 
     get: function() { return this._V;}, 
     set: function(V) { this._V=V; this.draw_selectors(),this.draw_swatch()} 
	})
Object.defineProperty(ColorPicker.prototype,'value',
	{enumerable: true, 
     get: function() { return rgb2hex(hsv2rgb(this._H0,this._S0,this._V0));}, 
     set: function(rgb) { var hsv=hex2hsv(rgb);
		this._H0=hsv[0];
		this._S0=hsv[1];
		this._V0=hsv[2]; 
		this._H=hsv[0];
		this._S=hsv[1];
		this._V=hsv[2]; 
		this.input.value=rgb2hex(hsv2rgb(this._H0,this._S0,this._V0))
		this.draw_selectors();
		this.draw_swatch()} 
	})

function ael(e,f)
{
	if( !(e in this._listeners ))
	{
		this._listeners[e]=[]
	}
	this._listeners[e].push(f)
}
ColorPicker.prototype.addEventListener=ael

function broadcastEvent(e)
{
	if( e.name in this._listeners )
	{
		var listeners=this._listeners[e.name]
		for( var i=0; i<listeners.length; i++ )
		{
			listeners[i].apply(this,[e])
		}
	}
}
ColorPicker.prototype.broadcastEvent=broadcastEvent


function swatch_click(e)
{
	if( this.selector_elem.style.display=="none" )
	{
		this.show_selector()
	}
	else
	{
		var xy=event_xy(e,this.swatch.canvas)
		if(xy.x>this.swatch.canvas.width/2)
		{
			this.set_color()
		}
		else
		{
			this.revert_color()
		}
	}
	e.preventDefault()
}
ColorPicker.prototype.swatch_click=swatch_click

function mouseup(e)
{
	if(this.selecting_hue)
	{
		this.selecting_hue=false
	}
	else if(this.selecting_saturation_value)
	{
		this.selecting_saturation_value=false
	}
}
ColorPicker.prototype.mouseup=mouseup

function mousedown(e)
{
	if( this.selector_elem.style.display=="block" )
	{
		var xy=event_xy(e,this.canvas.canvas)
		var rtheta=this.xy2rtheta(xy.x,xy.y)
		if(this.selecting_hue=(rtheta.r<this.outer_radius && rtheta.r>this.inner_radius))
		{
			this.h=rtheta.theta
			e.preventDefault()
		}
		else if(this.selecting_saturation_value=(xy.y<this.outer_radius+this.inner_radius*SIN30 && xy.y>this.line_a(xy.x) && xy.y>this.line_b(xy.x)) )
		{
			this.select_saturation_value(xy)
			e.preventDefault()
		}
		else if( !(is_in(e,this.swatch.canvas)) )
		{
			this.revert_color()
		}
	}
}
ColorPicker.prototype.mousedown=mousedown

function mousemove(e)
{
	if( this.selecting_hue)
	{
		var xy=event_xy(e,this.canvas.canvas)
		this.h=this.xy2rtheta(xy.x,xy.y).theta
		e.preventDefault()
	}
	else if( this.selecting_saturation_value)
	{
		var xy=event_xy(e,this.canvas.canvas)
		this.select_saturation_value(xy)
		e.preventDefault()
	}
	
}
ColorPicker.prototype.mousemove=mousemove

function keyup(e)
{
	if( this.selector_elem.style.display=="block" )
	{
		if(e.keyCode==27)
		{
			this.revert_color()
		}
		else if(e.keyCode=13)
		{
			this.set_color()
		}
	}
	
}
ColorPicker.prototype.keyup=keyup

function show_selector()
{
	this.selector_elem.style.display="block"
	this.draw_saturation_value()
	this.draw_selectors()
}
ColorPicker.prototype.show_selector=show_selector

function hide_selector()
{
	this.selector_elem.style.display="none"
}
ColorPicker.prototype.hide_selector=hide_selector

function select_saturation_value(xy)
{
	xy=this.rotate(xy,-(this._H+30)*Math.PI/180)
	if(xy.y>this.delta_radius+this.triangle_height) { xy.y=this.delta_radius+this.triangle_height }

	xy=this.rotate(xy,120*Math.PI/180)
	if(xy.y>this.delta_radius+this.triangle_height) { xy.y=this.delta_radius+this.triangle_height }

	xy=this.rotate(xy,120*Math.PI/180)
	if(xy.y>this.delta_radius+this.triangle_height) { xy.y=this.delta_radius+this.triangle_height }
	if(xy.y<this.delta_radius) { xy.y=this.delta_radius; xy.x=this.outer_radius}
	if(xy.x>this.outer_radius+this.inner_radius*COS30) { xy.y=this.outer_radius+this.inner_radius*SIN30; xy.x=this.outer_radius+this.inner_radius*COS30 }
	if(xy.x<this.outer_radius-this.inner_radius*COS30) { xy.y=this.outer_radius+this.inner_radius*SIN30; xy.x=this.outer_radius-this.inner_radius*COS30 }

	xy=this.rotate(xy,120*Math.PI/180)

	this._V=(xy.y-this.delta_radius)/this.triangle_height
	this._S=(xy.x-this.outer_radius+this.inner_radius*COS30)/this.triangle_base

	this.draw_selectors()
	this.draw_swatch()
}
ColorPicker.prototype.select_saturation_value=select_saturation_value

function rotate(p,theta)
{
		// rotate anti-clockwise 
	p={x:p.x-this.outer_radius,y:this.outer_radius-p.y}
	p={x: p.x*Math.cos(theta)-p.y*Math.sin(theta), y: p.x*Math.sin(theta)+p.y*Math.cos(theta)}
	return {x:p.x+this.outer_radius,y:this.outer_radius-p.y}
}
ColorPicker.prototype.rotate=rotate

function draw_swatch()
{
	var w=this.swatch.canvas.width
	var h=this.swatch.canvas.height
	var c=this.swatch.ctx
	c.fillStyle=rgb2hex(hsv2rgb(this._H0,this._S0,this._V0))
	c.fillRect(0,0,w/2,h)
	c.fillStyle=rgb2hex(hsv2rgb(this._H,this._S,this._V))
	c.fillRect(w/2,0,w/2,h)
}
ColorPicker.prototype.draw_swatch=draw_swatch


function revert_color()
{
	this._H=this._H0
	this._S=this._S0
	this._V=this._V0
	this.input.value=rgb2hex(hsv2rgb(this._H0,this._S0,this._V0))
	this.draw_swatch()
	this.hide_selector()
}
ColorPicker.prototype.revert_color=revert_color

function set_color()
{
	
	var e={name:'change',old_value: rgb2hex(hsv2rgb(this._H0,this._S0,this._V0)), value: rgb2hex(hsv2rgb(this._H,this._S,this._V)), target: this}
	this._H0=this._H
	this._S0=this._S
	this._V0=this._V
	this.input.value=e.value
	this.draw_swatch()
	this.hide_selector()
	this.broadcastEvent(e)
}
ColorPicker.prototype.set_color=set_color

function draw_hue()
{
	this.hCanvas.ctx.clearRect(0,0,2*this.outer_radius,2*this.outer_radius)
	for(var y=0; y<2*this.outer_radius; y++)
	{
		for(var x=0; x<2*this.outer_radius; x++)
		{
			var rtheta=this.xy2rtheta(x,y)
			if(rtheta.r<this.outer_radius && rtheta.r>this.inner_radius)
			{
				var rgb=hsv2rgb(rtheta.theta,1,1)
				var offset=(y*2*this.outer_radius+x)*4
				this.hCanvas.data[offset  ]=rgb[0]*255
				this.hCanvas.data[offset+1]=rgb[1]*255
				this.hCanvas.data[offset+2]=rgb[2]*255
				this.hCanvas.data[offset+3]=255
			}
		}
	}
	this.hCanvas.ctx.putImageData(this.hCanvas.id,0,0)
}
ColorPicker.prototype.draw_hue=draw_hue


function draw_saturation_value()
{
	this.svBuffer.ctx.clearRect(0,0,2*this.outer_radius,2*this.outer_radius)
	for(var y=0; y<2*this.outer_radius; y++)
	{
		for(var x=0; x<2*this.outer_radius; x++)
		{
			if( y<this.outer_radius+this.inner_radius*SIN30 && y>this.line_a(x) && y>this.line_b(x) )
			{
				var V=y/(this.outer_radius*(1+SIN30))
				var S=(x-this.outer_radius*(1-COS30))/(2*this.outer_radius*COS30)
				var rgb=hsv2rgb(this._H,S,V)
				var offset=(y*2*this.outer_radius+x)*4
				this.svBuffer.data[offset  ]=rgb[0]*255
				this.svBuffer.data[offset+1]=rgb[1]*255
				this.svBuffer.data[offset+2]=rgb[2]*255
				this.svBuffer.data[offset+3]=255
			}
		}
	}
	this.svBuffer.ctx.putImageData(this.svBuffer.id,0,0)
	this.svCanvas.ctx.clearRect(0,0,2*this.outer_radius,2*this.outer_radius)
	this.svCanvas.ctx.save()
	this.svCanvas.ctx.translate(this.outer_radius,this.outer_radius)
	this.svCanvas.ctx.rotate((330-this._H)*Math.PI/180)
	this.svCanvas.ctx.translate(-this.outer_radius,-this.outer_radius)
	this.svCanvas.ctx.drawImage(this.svBuffer.canvas,0,0)
	this.svCanvas.ctx.restore()
}
ColorPicker.prototype.draw_saturation_value=draw_saturation_value

function draw_selectors()
{
	// Draw the hue
	this.canvas.ctx.clearRect(0,0,2*this.outer_radius,2*this.outer_radius)
	var xp=this.outer_radius+Math.cos(this._H*Math.PI/180)*(this.inner_radius+this.outer_radius)/2
	var yp=(this.outer_radius-Math.sin(this._H*Math.PI/180)*(this.inner_radius+this.outer_radius)/2)
	var c=this.canvas.ctx
	c.beginPath()
	c.arc(xp,yp,6,0,2*Math.PI)
	c.lineWidth=2
	c.strokeStyle="#000000"
	c.stroke()
	c.beginPath()
	c.arc(xp,yp,7,0,2*Math.PI)
	c.lineWidth=2
	c.strokeStyle="#ffffff"
	c.stroke()

	var p={x:this._S*this.triangle_base+this.outer_radius-this.inner_radius*COS30,y:this._V*this.triangle_height+this.delta_radius}
	p=this.rotate(p,(this._H+30)*Math.PI/180)
	c.save()
	c.beginPath()
	c.arc(p.x,p.y,6,0,2*Math.PI)
	c.lineWidth=2
	c.strokeStyle="#000000"
	c.stroke()
	c.beginPath()
	c.arc(p.x,p.y,7,0,2*Math.PI)
	c.lineWidth=2
	c.strokeStyle="#ffffff"
	c.stroke()
	c.restore()
}
ColorPicker.prototype.draw_selectors=draw_selectors

function xy2rtheta(x,y)
{
	x=x-this.outer_radius
	y=this.outer_radius-y
	return {
	theta: 180*Math.atan2(y,x)/Math.PI,
	r: Math.sqrt(x*x+y*y) }
}
ColorPicker.prototype.xy2rtheta=xy2rtheta
