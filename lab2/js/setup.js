var deciphered; // deciphered results from the mapzen weird route response
var geo_obj; // geoJson object to be added. Made here for easy removal
var cipher; // for deciphering and directions

// Setting up our map
var map = L.map('map', {
  center: [38.553746, -97.009345],
  zoom: 4,
  zoomControl: false,
});

/*
var custom = L.tileLayer('https://api.mapbox.com/styles/v1/jkkaplan/cizutwown001d2ss1hcixcpj0/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1IjoiamtrYXBsYW4iLCJhIjoiY2lnOXAyaWZyMHNjZ3V5bHg4YTZieDczaSJ9.vSjaF4o2xaDFhNAv9Z2y7A', {
  subdomains: 'abcd',
  minZoom: 0,
  maxZoom: 20,
  ext: 'png'
});
*/

var googleStreets = L.tileLayer('http://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',{
    maxZoom: 20,
    subdomains:['mt0','mt1','mt2','mt3']
});

var nightsky = L.tileLayer('http://map1.vis.earthdata.nasa.gov/wmts-webmerc/VIIRS_CityLights_2012/default/{time}/{tilematrixset}{maxZoom}/{z}/{y}/{x}.{format}', {
	attribution: 'Imagery provided by services from the Global Imagery Browse Services (GIBS)',
	bounds: [[-85.0511287776, -179.999999975], [85.0511287776, 179.999999975]],
	minZoom: 1,
	maxZoom: 8,
	format: 'jpg',
	time: '',
	tilematrixset: 'GoogleMapsCompatible_Level'
});

var googleSat  = L.tileLayer('http://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',{
    maxZoom: 20,
    subdomains:['mt0','mt1','mt2','mt3']
});

var googleTerrain = L.tileLayer('http://{s}.google.com/vt/lyrs=p&x={x}&y={y}&z={z}',{
    maxZoom: 20,
    subdomains:['mt0','mt1','mt2','mt3']
});

var googleHybrid = L.tileLayer('http://{s}.google.com/vt/lyrs=s,h&x={x}&y={y}&z={z}',{
    maxZoom: 20,
    subdomains:['mt0','mt1','mt2','mt3']
});


current_basemap = googleTerrain;
current_basemap.addTo(map);

L.control.zoom({
     position:'bottomright'
}).addTo(map);



$(".material-icons").click(function() {
  current_basemap.removeFrom(map);
  if (this.id === "terrain") {
    current_basemap = googleTerrain;
  } else  if (this.id === "hybrid") {
      current_basemap = googleHybrid;
  } else  if (this.id === "road") {
      current_basemap = googleStreets;
  } else if (this.id === "satellite") {
    current_basemap = googleSat;
  } else if (this.id === "nightsky"){
    current_basemap = nightsky;
  }
  current_basemap.addTo(map);
});

$("#home2").click(function() {
  // zoom = map.getZoom();
  if(state.position.marker !== null) {
   map.setView(state.position.marker._latlng, 11);
 }
});




// Make the geoJson from the array of coordinate arrays
var make_route = function(deciphered) {
  // Using format from geojson.io
  route_geo = {  "type":"FeatureCollection",
  "features":[{
    "type":"Feature",
    "properties": {},
    "geometry":{
      "type":"LineString",
      "coordinates":[]
    }
  }]
};
_.each(deciphered, function(coords) {
  route_geo.features[0].geometry.coordinates.push([coords[1], coords[0]]);
});

return route_geo;

};

// Adds the routing line to the map
var line;
var add_line_to_map = function(route_geo) {

  if (typeof geo_obj !== 'undefined') {geo_obj.removeFrom(map);}

  geo_obj = L.geoJSON(route_geo, {
    "color": "#00b3fd",
    "weight": 3.5,
    "opacity": 1
  });
  line = route_geo;
  geo_obj.addTo(map);
};

// Gets the ciphered data from mapzen mobility
var get_ciphered_route = function(data) {

  // Trying to arrange it orderly with all the quotes. Still looks messy
  cipher_url = 'https://valhalla.mapzen.com/route?json={"locations":' +
  '[{"lat":' + state.position.marker._latlng.lat + ',' +
  '"lon":' + state.position.marker._latlng.lng + '},' +
  //'{"lat":42.34941019930749,"lon":-83.06144714355469,"type":"through"},' +
  '{"lat":' +  data.features[0].geometry.coordinates[1] + ',' +
  '"lon":' + data.features[0].geometry.coordinates[0] +
  '}],"costing":"auto","directions_options":{"units":"miles"}}&api_key=mapzen-3CzaEbE';


  $.ajax(cipher_url).done(function(data) {
    // Decodes the route response
    cipher = data;
    deciphered = decode(data.trip.legs[0].shape);
    route_geo = make_route(deciphered);


    add_line_to_map(route_geo);
    add_directions();



    proper_bound =  map.getBoundsZoom([
      [cipher.trip.locations[0].lat,
      cipher.trip.locations[0].lon],
      [cipher.trip.locations[1].lat,
      cipher.trip.locations[1].lon]
    ]);

    // Set bounds to fit both locations
    map.fitBounds([
      [cipher.trip.locations[0].lat,
      cipher.trip.locations[0].lon],
      [cipher.trip.locations[1].lat,
      cipher.trip.locations[1].lon],
      {maxZoom: 5}
    ]);



  });
};

add_directions = function() {
  $('.direction').empty();// remove any previous directions
    $('.direction2').empty();// remove any previous directions
  $('.direction').append('<span class = directions><h3>' + results.features[0].properties.name +
    '</h3></span>');
    $('.direction').append('<span class = directions><h5>Distance: ' + Math.round(cipher.trip.legs[0].summary.length) +
      ' Miles</h5></span>');
      $('.direction').append('<span class = directions><h5>Time: ' + Math.round(cipher.trip.legs[0].summary.time/ 60 / 60) +
        ' Hours</h5></span>');
  _.each(cipher.trip.legs[0].maneuvers, function(directions) {
    length = directions.verbal_post_transition_instruction;
    if (typeof length === "undefined") {
      length = "";
    }
    $('.direction').append('<div class = directions><p>' + directions.instruction + ' ' +
     length + '</p></div>');
  });
};


// Makes the sidebar
var sidebar = L.control.sidebar('sidebar').addTo(map);
sidebar.open('home');
