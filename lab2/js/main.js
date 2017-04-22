
// Current location
var state = {
  position: {
    marker: null,
    updated: null
  }
};


/* We'll use underscore's `once` function to make sure this only happens
*  one time even if we update the position later
*/
var goToOrigin = _.once(function(lat, lng) {
  map.setView([lat, lng], 11);
});




// This is the autocomplete search bar.
// Tutorial here https://github.com/mapzen/leaflet-geocoder
function geocoder_options(placeholder, expanded){
  this.panToPoint = false;
  this.polygonIcon = false;
  this['boundary.country'] = 'USA';
  this.position = 'topright';
  this.placeholder = placeholder;
  this.markers = false;
  this.expanded = expanded;
  this.focus = true;
}
geocoder1 = new geocoder_options("Destination", true);
geocoder2 = new geocoder_options("Start Place", false);

var end_geocoder = L.Mapzen.geocoder('mapzen-3CzaEbE', geocoder1).addTo(map);

var start_geocoder = L.Mapzen.geocoder('mapzen-3CzaEbE', geocoder2).addTo(map);
//end_geocoder.expand();


/* Given a lat and a long, we should create a marker, store it
*  somewhere, and add it to the map
*/
var updatePosition = function(lat, lng) {
  if (state.position.marker) { map.removeLayer(state.position.marker); }
  state.position.marker = L.circleMarker([lat, lng], {color: "blue"});
  state.position.marker.addTo(map);
  map.setView([lat, lng], 11);
};

$(document).ready(function() {
  /* This 'if' check allows us to safely ask for the user's current position */
  if ("geolocation" in navigator) {
    navigator.geolocation.getCurrentPosition(function(position) {
      updatePosition(position.coords.latitude, position.coords.longitude, position.timestamp);
    });
  } else {
    alert("Unable to access geolocation API!");
  }
});


  /* Every time a key is lifted while typing in the #dest input, disable
  * the #calculate button if no text is in the input
  */
  $('#dest').keyup(function(e) {
    if ($('#dest').val().length === 0) {
      $('#calculate').attr('disabled', true);
    } else {
      $('#calculate').attr('disabled', false);
    }
  });

  // click handler for the "calculate" button (probably you want to do something with this)
  end_geocoder.on('select', function (e) {
    end_geocoder_func();
  });

  make_address = function(address) {
    address_string = "https://search.mapzen.com/v1/search?&api_key=mapzen-3CzaEbE&text=" +
    address +
    "&size=1";

    if (state.position.marker) {
      address_string = address_string +
      "&focus.point.lat=" + state.position.marker._latlng.lat +
      "&focus.point.lon=" + state.position.marker._latlng.lng;
    }
    return(address_string);
  };

  end_geocoder_func = function() {

    address = $('.leaflet-pelias-input').first().val();
    mapzen_url = make_address(address);

    if (state.position.marker) {
      sidebar.open('home');
      main_function();
    }
  };


  start_geocoder.on('select', function (e) {
    address = $('.leaflet-pelias-input').last().val();
    start_mapzen_url = make_address(address);

    sidebar.open('home');
    start_function();

    
    end_geocoder_func();
  });

  start_function = function() {
    $.ajax(start_mapzen_url).then(function(data) {

      updatePosition(data.features[0].geometry.coordinates[1], data.features[0].geometry.coordinates[0]);
      });
    };

    // Closes other geocoder search bar when opening one
    start_geocoder.on('expand', function (e) {
      end_geocoder.collapse();
    });
    end_geocoder.on('expand', function (e) {
      start_geocoder.collapse();
    });


    var results;
    var endPoint;
    main_function = function() {
      $.ajax(mapzen_url).then(function(data) {
        results = data;

        if (typeof endPoint !== 'undefined') { map.removeLayer(endPoint); }
        endPoint = L.circleMarker([results.features[0].geometry.coordinates[1],
          results.features[0].geometry.coordinates[0]], {color: "red"});
          endPoint.addTo(map);

          get_ciphered_route(data); // basically does everything.
        });
      };
