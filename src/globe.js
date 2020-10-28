var map;

var hasToRotate = false;
var playButton = document.getElementById("playButton")
var before = null;
var numSpeed = document.getElementById("numSpeed")
var speed = 31 - numSpeed.value

var planes;
var numPlanes = document.getElementById("numPlanes")
var planesMarker = []
var xhr_planes = new XMLHttpRequest();

var vessels;
var xhr_vessels = new XMLHttpRequest();

listenXMLhttpRequest();

/* GLOBE ====================================================================== */

function initGlobe() {
    map = WE.map('map', {
        center: [36.057944835, -112.18688965],
        zoom: 2,
        dragging: true,
        scrollWheelZoom: true
    });

    var baselayer = WE.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

   /* map.on('mousemove', function(e) {
        document.getElementById('coords').innerHTML = e.latlng.lat + ', ' + e.latlng.lng;
    });*/


    getPlanes()
    getVessels()

    rotate()
}

function rotate(){
    hasToRotate = !hasToRotate
    before = null
    requestAnimationFrame(function animate(now) {
        if(hasToRotate){
            var c = map.getPosition();
            var elapsed = before? now - before: 0;
            before = now;
            map.setCenter([c[0], c[1] + 0.1*(elapsed/speed)]);
            requestAnimationFrame(animate);
        }
    });
    hasToRotate ?  playButton.innerText = "pause_circle_outline" :  playButton.innerText = "play_circle_outline"
}

function setRotateSpeed(){
    if(numSpeed.value < 1)
        numSpeed.value = 1
    if(numSpeed.value > 30)
        numSpeed.value = 30
    speed = 31 - numSpeed.value
}

function drawPlanes(){
    planesMarker.forEach(m => m.removeFrom(map))
    if(numPlanes.value < 0)
        numPlanes.value = 0
    if(numPlanes.value > 10)
        numPlanes.value = 10
    let i = 0
    planes.states.forEach( plane => {
        if(numPlanes.value != 0 && i%(11-numPlanes.value)==0){
            let m = WE.marker([plane[6], plane[5]],'../assets/_plane.png', 32, 32).addTo(map);
            m.bindPopup(
                "<b>icao24:</b> "+plane[0]+"<br>"+
                "<b>callsign:</b> "+plane[1]+"<br>"+
                "<b>origin country:</b> "+plane[2]+"<br>"+
                "<b>longitude:</b> "+plane[5]+"<br>"+
                "<b>latitude:</b> "+plane[6]+"<br>"+
                "<b>baro altitude:</b> "+plane[7]+"<br>"
                ,{maxWidth: 150})
            planesMarker.push(m)
        }
        i++;
    });
}


function drawVessels(){
    /*planesMarker.forEach(m => m.removeFrom(map))
    if(numPlanes.value < 0)
        numPlanes.value = 0
    if(numPlanes.value > 10)
        numPlanes.value = 10*/
    let i = 0
    vessels.features.forEach( vessel => {
        if(i%10==0){
            let m = WE.marker([vessel.geometry.coordinates[1], vessel.geometry.coordinates[0]],'../assets/_boat.png', 32, 32).addTo(map);
            /*m.bindPopup(
                "<b>icao24:</b> "+plane[0]+"<br>"+
                "<b>callsign:</b> "+plane[1]+"<br>"+
                "<b>origin country:</b> "+plane[2]+"<br>"+
                "<b>longitude:</b> "+plane[5]+"<br>"+
                "<b>latitude:</b> "+plane[6]+"<br>"+
                "<b>baro altitude:</b> "+plane[7]+"<br>"
                ,{maxWidth: 150})
            planesMarker.push(m)*/
        }
        i++;
    });
}

/* HTTP ====================================================================== */

function getPlanes(){
    xhr_planes.open('GET','https://opensky-network.org/api/states/all')
    xhr_planes.send()
}

function getVessels(){
    xhr_vessels.open('GET','https://meri.digitraffic.fi/api/v1/locations/latest')
    xhr_vessels.send()
}

function listenXMLhttpRequest(){

    xhr_planes.onreadystatechange=(e)=>{
        if (xhr_planes.readyState == 4 && xhr_planes.status == 200){
            planes =  JSON.parse(xhr_planes.responseText)
            drawPlanes()
        }
    }

    xhr_vessels.onreadystatechange=(e)=>{
        if (xhr_vessels.readyState == 4 && xhr_vessels.status == 200){
            vessels =  JSON.parse(xhr_vessels.responseText)
            drawVessels()
        }
    }

}