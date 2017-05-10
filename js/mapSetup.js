
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


// Different icons
var iconSelector = function(park) {
  icon = new L.Icon({
       iconSize: [27, 27],
       iconAnchor: [13, 27],
       popupAnchor:  [1, -24],
       iconURL: ''
   });


  if (park == 'state_park') {
    icon.options.iconUrl = 'data/favicon.png';
  } else if (park == 'national_park') {
    icon.options.iconUrl = 'data/national_park_service.png';
  } else if (park == 'national_forest') {
    icon.options.iconUrl = 'data/forest_service.png';
  } else if (park == 'national_monument') {
    icon.options.iconUrl = 'data/liberty_bell.png';
  }

  return(icon);
};
