const mymap = L.map('mapid').setView([38.837681531131196, -77.15426168296403], 11);

L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors',
    maxZoom: 18,
}).addTo(mymap);

const libraryURL = "http://localhost:8080/api/libraries";
const borderURL = "http://localhost:8080/api/borders";
const sitesURL = "http://localhost:8080/api/sites";

const borderStyle = {
    "color": "#000000",
    "opacity": 0.4
};

const addDataToMap = (data, map, datastyle) => {
    const location = L.geoJSON(data, {
        style: (feature) => {
            return datastyle;
        }, 
        onEachFeature: (feature, layer) => {
            layer.bindPopup(feature.properties.DESCRIPTION );
        }
    }).addTo(map);
};

//jQuery.getJSON(libraryURL, (data) => {addDataToMap(data, mymap)});
jQuery.getJSON("http://localhost:8080/radius", (data) => {addDataToMap(data, mymap)});

L.circle([38.86543182000657, -77.20176584039915], {color: 'red', radius: 8046.72}).addTo(mymap);

const origin = L.marker([38.86543182000657, -77.20176584039915])
    .bindPopup('<p>Thomas Jefferson Library</p>').addTo(mymap);
origin.openPopup();
    
jQuery.getJSON(borderURL, (data) => {addDataToMap(data, mymap, borderStyle)});
jQuery.getJSON(sitesURL, (data) => {addDataToMap(data, mymap)});






