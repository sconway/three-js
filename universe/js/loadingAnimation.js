/*
  A big thanks to Gabi at http://codepen.io/enxaneta/pen/yeaBKY for the bulk of this code.
*/

var s = document.createElement('style');
document.head.appendChild(s);

var cx = window.innerWidth / 2;
var cy = window.innerHeight / 2;
var rad = Math.PI / 180;

var R = 150,
  r = R / 16,
  kx = 5,
  ky = 6,
  phi = Math.PI / 2,
  x, y, t,
  loaded = false,
  timedOut = false;


setTimeout(checkLoader, 5000);

window.addEventListener('load', function () {
  loaded = true;

  // only fade the loader out if the load time has 
  // taken longer than the pre-defined delay.
  if (timedOut)
    fadeLoaderOut();

}, false);

function checkLoader() {
  timedOut = true;

  // only fade out the loader after the pre defined delay
  // if the page had loaded before the delay. 
  if (loaded)
    fadeLoaderOut();
}

function fadeLoaderOut() {
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

function pointOnLemniscate() {
  console.log("pointOnLemniscate called");
  x = (R * Math.cos(t) / (1 + (Math.sin(t) * Math.sin(t)))).toFixed(5),
    y = (R * Math.sin(t) * Math.cos(t) / (1 + (Math.sin(t) * Math.sin(t)))).toFixed(5);
  return o = {
    x: x,
    y: y
  }
}

function pointOnLissajous() {
  console.log("pointOnLissajous called");
  x = (R * Math.sin(kx * t + phi)).toFixed(5);
  y = (R * Math.sin(ky * t)).toFixed(5);
  return o = {
    x: x,
    y: y
  }
}

function pointOnHeart() {
  console.log("pointOnHeart called");
  x = (16 * r * (Math.sin(t) * Math.sin(t) * Math.sin(t))).toFixed(5);
  y = (-13 * r * Math.cos(t) +
    5 * r * Math.cos(2 * t) +
    2 * r * Math.cos(3 * t) +
    r * Math.cos(4 * t)).toFixed(5);
  return o = {
    x: x,
    y: y
  }
}

function getShadow(pointOnCurve) {
  console.log("getShadow called");
  var boxShadowRy = [];
  for (var a = 0; a < 360; a += .5) {
    t = a * rad;
    var o = pointOnCurve();
    boxShadowRy.push(o.x + "px" + " " + o.y + "px" + " 0px 1px hsl(" + a + ",100%,50%)");
  }
  var boxShadowStr = boxShadowRy.join();
  return boxShadowStr;
}

s.textContent = 'body::before{';
s.textContent += 'left:' + cx + 'px;';
s.textContent += 'top:' + cy + 'px;';
s.textContent += 'box-shadow:' + getShadow(pointOnLissajous);
s.textContent += '}';

var vendors = [ /*'-ms-', '-moz-',*/ '-webkit-', /*'-o-',*/  ''];
for (var i = 0; i < vendors.length; i++) {
  s.textContent += '@' + vendors[i] + 'keyframes testAnimacion {';
  s.textContent += '50% {' + vendors[i] + 'box-shadow:' + getShadow(pointOnLemniscate) + ';background-color:hsl(90,100%,50%);}';
  s.textContent += '55% {background-color:transparent;}';
  s.textContent += '100% {' + vendors[i] + 'box-shadow:' + getShadow(pointOnHeart) + ';background-color:transparent;}';
  s.textContent += '}';
}