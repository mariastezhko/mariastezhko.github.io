// Declare global variables.
var map;

// Foursquare
var clientID = 'IYUJHZXT1R3ATZJOWVZC5EFRXKW40XZSCUM0BYHDR25JNVOS';
var clientSecret = 'YN5ETU0EMHHUHWQLR4QRBCVOSMKBOLNX5UJW2PV2CI1EF3PW';

// Initialize Google Map.
function initMap() {
  map = new google.maps.Map(document.getElementById('map'), {
    center: {lat: 37.3998683, lng: -122.1105936},
    zoom: 13,
    //styles: styles,
    mapTypeControl: false
  });

  ko.applyBindings(new viewModel());

}

var Location = function(data) {
  var self = this;
  var defaultIcon = makeMarkerIcon('0091ff');
  var highlightedIcon = makeMarkerIcon('FFFF24');

  this.position = data.location;
  this.lat = data.location.lat;
  this.lng = data.location.lng;
  this.title = data.title;
  this.category = "";
  this.street = "";
  this.city = "";
  this.foursquareAlert = "";

  // All the location markers are initially visible.
  // Visibility is subject to change using a filter.
  this.visible = ko.observable(true);

  // Foursquare API request URL
  var fourSquareURL = 'https://api.foursquare.com/v2/venues/search' +
      '?ll=' + this.lat + ',' + this.lng +
      '&client_id=' + clientID + '&client_secret=' + clientSecret +
      '&query=' + this.title + '&v=20180104';

  // Get Foursquare API data
  $.getJSON(fourSquareURL).done(function(result) {
      self.category = result.response.venues[0].categories[0].name;
      self.street = result.response.venues[0].location.address;
      self.city = result.response.venues[0].location.formattedAddress[1];
      //console.log('result', result);
   }).fail(function(e){
          self.foursquareAlert = "Couldn't load Foursquare data. Please refresh your page to try again.";
     });

  // Create a marker for the location.
  this.marker = new google.maps.Marker({
      position: this.position,
      title: this.title,
      icon: defaultIcon,
      map: map,
      animation: google.maps.Animation.DROP,
   });

   // Show filtered markers (initially all the markers are shown).
   this.showMarker = ko.computed(function() {
      if (this.visible() === true) {
          this.marker.setMap(map);
      } else {
          this.marker.setMap(null);
      }
      return true;
   }, this);

   // When a marker is clicked, open the information window
   // and bounce a marker one time.
   // If there was an issue with loading Foursquare data,
   // display the alert window.
   this.marker.addListener('click', function() {
     console.log(self.foursquareAlert);
      if (self.foursquareAlert) {
        alert(self.foursquareAlert);
      }
      self.content = '<div class="info-window"><p class="title"><b>' + self.title + '</b></p>' +
           '<p>' + self.category + '</p>' + '<p>' + self.street + '</p>' + '<p>' + self.city + '</p></div>';
      console.log(self.content);
      infoWindow = new google.maps.InfoWindow({content: self.content});
      infoWindow.open(map, this);
      self.marker.setAnimation(google.maps.Animation.BOUNCE);
      setTimeout(function() {
          self.marker.setAnimation(null);
      }, 750);
   });

   this.marker.addListener('mouseover', function() {
     self.marker.setIcon(highlightedIcon);
   });
   this.marker.addListener('mouseout', function() {
     self.marker.setIcon(defaultIcon);
   });

   // When a location in the list view is clicked,
   // open the information window for the associated marker.
   this.listClicked = function() {
      google.maps.event.trigger(self.marker, 'click');
   };

};

var viewModel = function() {
    var self = this;

    this.listItems = ko.observableArray([]);
    this.searchInput = ko.observable('');

    // Populate the list view.
    locations.forEach(function(locationName) {
      self.listItems.push( new Location(locationName) );
    });

    this.filteredItems = ko.computed(function() {
      var searchString = self.searchInput().toLowerCase();
      if (searchString) {
        return ko.utils.arrayFilter(self.listItems(), function(locationName) {
            var match = locationName.title.toLowerCase().indexOf(searchString) >= 0;
            locationName.visible(match);
            console.log("***", locationName);
            return match;
        });
      } else {
          console.log(self.listItems());
          self.listItems().forEach(function(locationName) {
          locationName.visible(true);
        });
        return self.listItems();
      }
    }, self);

};

// Create a new marker of a specific color.
function makeMarkerIcon(markerColor) {
    var markerImage = new google.maps.MarkerImage(
        'http://chart.googleapis.com/chart?chst=d_map_spin&chld=1.15|0|' + markerColor +
        '|40|_|%E2%80%A2',
        new google.maps.Size(21, 34),
        new google.maps.Point(0, 0),
        new google.maps.Point(10, 34),
        new google.maps.Size(21, 34));
    return markerImage;
}

// Handle Google Map errors
function googleMapError() {
  alert("Couldn't load Google Maps.");
}

// Toggle sidebar
$(document).ready(function () {
    $('#sidebar-toggle').on('click', function () {
        $('#sidebar').toggleClass('sidebar-hide');
    });
});
