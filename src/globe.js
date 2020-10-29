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

var iss;
var xhr_iss = new XMLHttpRequest();
var issCrew;
var issCrewHTML = "";
var xhr_issCrew = new XMLHttpRequest();
var issMarker;
var numISS = document.getElementById("numISS")

var satellites;
var xhr_satellites = new XMLHttpRequest();
var satellitesView = 1
var numSatellites = document.getElementById("numSatellites")
var satellitesMarker = []

/* GLOBE ====================================================================== */

function initGlobe() {

    listenXMLhttpRequest();

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
    //getVessels()
    getISS()
    getSattellites(satellitesView)

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
    hasToRotate ? playButton.innerText = "pause_circle_outline" :  playButton.innerText = "play_circle_outline"
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

function drawISSCrew(){
    issCrewHTML += "<br><b>crew:</b> "+issCrew.people.length+"<br>"
    issCrew.people.forEach( p => {
        if(p.craft === "ISS"){
            issCrewHTML += p.name + "<br>"
        }
    })
    drawISS()
}

function drawISS(){
    if(issMarker){
        issMarker.removeFrom(map)
        issMarker = null
    }
    if(iss && numISS.checked){
        issMarker = WE.marker([iss.iss_position.latitude,iss.iss_position.longitude],'../assets/_iss.png', 32, 32).addTo(map);
        issMarker.bindPopup(
            "<b>satellite:</b> ISS<br>"+
            "<b>latitude:</b> "+iss.iss_position.latitude+"<br>"+
            "<b>longitude:</b> "+iss.iss_position.longitude+"<br>"+
            "<b>speed:</b> 28000km/h<br>"+
            "<b>baro altitude:</b> 325km<br>"+
            issCrewHTML
            ,{maxWidth: 150})
    }
}

function drawSatellites(){
    satellitesMarker.forEach(m => m.removeFrom(map))
    if(numSatellites.value < 0)
        numSatellites.value = 0
    if(numSatellites.value > 10)
        numSatellites.value = 10
    let i = 0
    satellites.above.forEach( satellite => {
        if(numSatellites.value != 0 && i%(11-numSatellites.value)==0){
            let m = WE.marker([satellite.satlat, satellite.satlng],'../assets/_satellite.png', 32, 32).addTo(map);
            m.bindPopup(
                "<b>satellite id:</b> "+satellite.satid+"<br>"+
                "<b>satellite name:</b> "+satellite.satname+"<br>"+
                "<b>int designator:</b> "+satellite.intDesignator+"<br>"+
                "<b>launchDate:</b> "+satellite.launchDate+"<br>"+
                "<b>latitude:</b> "+satellite.satlat+"<br>"+
                "<b>longitude:</b> "+satellite.satlng+"<br>"+
                "<b>altitude:</b> "+satellite.satalt+"<br>"
                ,{maxWidth: 150})
            satellitesMarker.push(m)
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

function getISS(){
    if(!issCrew){
        xhr_issCrew.open('GET','http://api.open-notify.org/astros.json')
        xhr_issCrew.send()
    }
    xhr_iss.open('GET','http://api.open-notify.org/iss-now.json')
    xhr_iss.send()
}

function getSattellites(view){
    switch (view) {
        case 1:
            //NewYork
            xhr_satellites.open('GET','https://cors-anywhere.herokuapp.com/https://api.n2yo.com/rest/v1/satellite/above/40.712/-74.006/0/90/0/&apiKey=GVV2RA-H4Z2WA-YL7F7J-4L10')
            xhr_satellites.send()
            break;
        case 2:
            //Taiwan
            xhr_satellites.open('GET','https://cors-anywhere.herokuapp.com/https://api.n2yo.com/rest/v1/satellite/above/23.973/120.982/0/90/0/&apiKey=GVV2RA-H4Z2WA-YL7F7J-4L10')
            xhr_satellites.send()
            break;
        case 3:
            //Paris
            xhr_satellites.open('GET','https://cors-anywhere.herokuapp.com/https://api.n2yo.com/rest/v1/satellite/above/48.856/2.351/0/90/0/&apiKey=GVV2RA-H4Z2WA-YL7F7J-4L10')
            xhr_satellites.send()
            break;
    }  
}

function listenXMLhttpRequest(){

    xhr_planes.onreadystatechange=(e)=>{
        if (xhr_planes.readyState == 4 && xhr_planes.status == 200){
            planes =  JSON.parse(xhr_planes.responseText)
            drawPlanes()
            setTimeout(getPlanes,180000)
        }
    }

    xhr_vessels.onreadystatechange=(e)=>{
        if (xhr_vessels.readyState == 4 && xhr_vessels.status == 200){
            vessels =  JSON.parse(xhr_vessels.responseText)
            drawVessels()
        }
    }

    xhr_iss.onreadystatechange=(e)=>{
        if (xhr_iss.readyState == 4 && xhr_iss.status == 200){
            iss =  JSON.parse(xhr_iss.responseText)
            drawISS()
            setTimeout(getISS,10000)
        }
    }

    xhr_issCrew.onreadystatechange=(e)=>{
        if (xhr_issCrew.readyState == 4 && xhr_issCrew.status == 200){
            issCrew = JSON.parse(xhr_issCrew.responseText)
            drawISSCrew()
        }
    }

    xhr_satellites.onreadystatechange=(e)=>{
        if (xhr_satellites.readyState == 4 && xhr_satellites.status == 200){
            satellitesView+=1
            if(!satellites){
                satellites = JSON.parse(xhr_satellites.responseText)
            }else{
                satellites.above = satellites.above.concat(JSON.parse(xhr_satellites.responseText).above)
            }
            getSattellites(satellitesView)
            drawSatellites()
            if(satellitesView == 3){
                setTimeout(() => {
                    satellitesView = 1
                    getPlanes(satellitesView)
                },180000)
            }
        }
    }
}