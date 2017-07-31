var map;
var markers;
var facilities = [];

$(document).ready(function()
{
	$(".main").click(function (){
		var id = this.id;
		var sub = "sub";
		sub = sub.concat(id.substr(4));
		$('#main-menu').toggle();
		$('#'+sub).toggle();
	});
	
	$(".sub").click(function (){
		var id = this.id;
		var item = id.replace("-","-item");
		$('#'+item).toggle();
	});
	
	$(".back").click(function (){
		var parent = this.parentElement.id;
		$('#'+parent).toggle();
		$('#main-menu').toggle();
	});
});

function initAutocomplete() {
		var styles = {
			default:[
			  {
				"featureType": "poi",
				"stylers": [
				  {
					"visibility": "off"
				  }
				]
			  },
			]
		};

        map = new google.maps.Map(document.getElementById('map'), {
			center: {lat: -34.4054, lng: 150.8784},
			zoom: 16,
			mapTypeId: 'roadmap',
			mapTypeControlOptions: 
			{
				style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
				position: google.maps.ControlPosition.LEFT_BOTTOM
			},
        });
		
		 map.setOptions({styles: styles['default']});

        var input = document.getElementById('pac-input');
        var searchBox = new google.maps.places.SearchBox(input);
        map.controls[google.maps.ControlPosition.LEFT_TOP].push(input);

        map.addListener('bounds_changed', function() {
          searchBox.setBounds(map.getBounds());
        });

        markers = [];
        searchBox.addListener('places_changed', function() {
          var places = searchBox.getPlaces();

          if (places.length == 0) {
            return;
          }

          markers.forEach(function(marker) {
            marker.setMap(null);
          });
          markers = [];

          var bounds = new google.maps.LatLngBounds();
          places.forEach(function(place) {
            if (!place.geometry) {
              console.log("Returned place contains no geometry");
              return;
            }
            var icon = {
              url: place.icon,
              size: new google.maps.Size(71, 71),
              origin: new google.maps.Point(0, 0),
              anchor: new google.maps.Point(17, 34),
              scaledSize: new google.maps.Size(25, 25)
            };

            markers.push(new google.maps.Marker({
              map: map,
              icon: icon,
              title: place.name,
              position: place.geometry.location
            }));

            if (place.geometry.viewport) {
              bounds.union(place.geometry.viewport);
            } else {
              bounds.extend(place.geometry.location);
            }
          });
          map.fitBounds(bounds);
        });
}
	  
function specifiedMarker()
{
	console.log(map.getCenter());
	var longitude = parseFloat(document.forms["sub1-item1"]["long"].value);
	var latitude = parseFloat(document.forms["sub1-item1"]["lat"].value);

	if(longitude < -180 || longitude > 180 || latitude < -90 || latitude > 90)
	{
		alert("Invalid coordinates. Latitude must be in the range [-90, 90]. Longitude must be in the range [-180, 180].");
	}

	else
	{
		marker = new google.maps.Marker({
			map: map,
			draggable: true,
			animation: google.maps.Animation.DROP,
			position: {lat: latitude, lng: longitude},
		});
		
		markers.push(marker);
	}
}

function centerMarker()
{
	marker = new google.maps.Marker({
		map: map,
		draggable: true,
		animation: google.maps.Animation.DROP,
		position: map.getCenter(),
	});
	
	markers.push(marker);
}

function searchFacilities()
{
	for(var i=0; i < markers.length; i++)
	{
		var cityCircle = new google.maps.Circle({
            strokeColor: '#606ff7',
            strokeOpacity: 0.8,
            strokeWeight: 2,
            fillColor: '#606ff7',
            fillOpacity: 0.15,
            map: map,
            center: markers[i].position,
            radius: 2500
          });

		var data = "lat="+markers[i].position.lat()+"&lng="+markers[i].position.lng()+"&radius=2500";

		var xhr = new XMLHttpRequest();
		xhr.withCredentials = true;

		xhr.addEventListener("readystatechange", function () {
		  if (this.readyState === 4) {
			var rtval = JSON.parse(this.responseText);
	 		AddLocations(rtval);
		  }
		});

		xhr.open("POST", "http://localhost:8081/Simulate");
		xhr.setRequestHeader("content-type", "application/x-www-form-urlencoded");
		xhr.send(data);

	}
}

function AddLocations(results) {

    for (var i = 0; i < results.length; i++) {
		  marker = new google.maps.Marker({
			map: map,
			draggable: false,
			animation: google.maps.Animation.DROP,
			position: results[i].location,
			icon: results[i].icon,
			});
		
			facilities.push(marker);

    }
}
