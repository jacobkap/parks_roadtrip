var deciphered; // deciphered results from the mapzen weird route response
var geo_obj; // geoJson object to be added. Made here for easy removal
var cipher; // for deciphering and directions


$("#home2").click(function() {
  // zoom = map.getZoom();
  if(state.position.marker !== null) {
   map.setView(state.position.marker._latlng, 11);
 }
});

var line;
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
function get_ciphered_route(data) {

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
    nearestParks();


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
}

add_directions = function() {
  $('.direction').empty();// remove any previous directions
    $('.direction2').empty();// remove any previous directions
  $('.direction').append('<span class = directions><h5>From: ' +
   start_address + '<br>' +
   'To: ' +
   end_address +
    '</h5></span>');
    $('.direction').append('<span class = directions><p>Distance: ' +
    Math.round(cipher.trip.legs[0].summary.length) +
      ' Miles</p></span>');
      $('.direction').append('<span class = directions><p>Time: ' +
      Math.round(cipher.trip.legs[0].summary.time/ 60 / 60) +
        ' Hours</h6></span>');
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


var app = {
  apikey: "8bae1f5e5df3373711ef6aaea3867fc2f0920931",
  geojsonClient: new cartodb.SQL({ user: 'jacobkap', format: 'geojson' })
};

// SLider value change
 $("#slider").on("input", function(){
   $('#range_value').empty();
   $('#range_value').append("<span id = 'range_value'><h2>" +
     this.value +
     " Miles</h2></span>");
     nearestParks();
 });

// checkbox changes
var national_park_alllowed = "";
var national_forest_alllowed = "";
var national_monument_alllowed = "";
var state_park_alllowed = "";
$('input:checkbox').change(function() {
  if ($('#national_park').prop('checked')) {
    national_park_alllowed = "";
  } else {
    national_park_alllowed = " AND type <> 'national_park'";
  }

  if ($('#national_forest').prop('checked')) {
    national_forest_alllowed = "";
  } else {
    national_forest_alllowed = " AND type <> 'national_forest'";
  }

  if ($('#national_monument').prop('checked')) {
    national_monument_alllowed = "";
  } else {
    national_monument_alllowed = " AND type <> 'national_monument'";
  }

  if ($('#state_park').prop('checked')) {
    state_park_alllowed = "";
  } else {
    state_park_alllowed = " AND type <> 'state_park'";
  }
    nearestParks();

});

function nearestParks(){

    while (line.features[0].geometry.coordinates.length > 75) {
      _.filter(line.features[0].geometry.coordinates, function(item, index) {
        if(index % 10 === 0 &
           index > 10 &
           index < (line.features[0].geometry.coordinates.length-10)){
             line.features[0].geometry.coordinates.splice(index, 1);}
        });
    }


  coordsArray = '';
  _.each(line.features[0].geometry.coordinates,
     function(location) {coordsArray = coordsArray +
        'ST_MakePoint(' +
         location[0] +
         ',' +
          location[1] +
          '), ';
        });

    coordsArray = coordsArray.slice(0, -2);


  app.geojsonClient.execute("SELECT * FROM parks_finished_1 WHERE " +
                           'ST_DWithin(ST_MakeLine(ARRAY[' +
                            coordsArray +
                           '])::geography, the_geom::geography, ' + $("#slider").val() + '* 1609)' +
                            national_park_alllowed +
                            national_forest_alllowed +
                            national_monument_alllowed +
                            state_park_alllowed)
  .done(function(data) {
    console.log(data);

    var geojsonMarkerOptions = {
        radius: 8,
        fillColor: "#228b22",
        color: "#000",
        weight: 1,
        opacity: 1,
        fillOpacity: 0.8,
    };

    if (typeof tempParks !== 'undefined') {
      _.map(tempParks, function(park){park.removeFrom(map);});
    }

    tempParks = [];
    _.map(data.features, function(park) {
    tempParks.push(new L.Marker([park.geometry.coordinates[1],
        park.geometry.coordinates[0]], {icon: iconSelector(park.properties.type)}).bindPopup(
          park.properties.name + '<br>' +
          'Address: ' + park.properties.real_address + '<br>' +
          'Notes: ' + park.properties.notes));});
    _.map(tempParks, function(parks) {parks.addTo(map);});
  })
  .error(function(errors) {
  });
}
