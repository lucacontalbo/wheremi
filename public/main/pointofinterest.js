class PointOfInterest{
    constructor(itinerary, maxPoints){
        this.itineraryStartPoints = [];
        this.points = [];
        this.wikipediaPoints = [];
        this.yt_points = [];
        this.wikipediaMarkers = [];
        this.markers = [];
        this.itineraryStartMarkers = [];
        this.yt_markers = [];
        this.currentItinerary = itinerary;
        this.addedPointMarker = {};
        this.addedPoint = {};
        this.searchPoint = {};
        this.searchPointMarker = {};
        this.maxPoints = maxPoints;
        this.url = "http://localhost:3000";
    }

    getItinerary(){
        return this.currentItinerary;
    }

    loadPoints(){
        var bound = map.getBounds();
        var parentThis = this;
        //this.removeAllMarkers();
        $.ajax({
            url: parentThis.url+"/about?swlat="+bound._southWest.lat+"&swlng="+bound._southWest.lng+"&nelat="+bound._northEast.lat+"&nelng="+bound._northEast.lng+"&maxpoints="+parentThis.maxPoints,
            method: "GET",
            dataType: "json",
            async: true,
            success: (data) => {
                clearCards();
                parentThis.itineraryStartPoints = data.itineraryStartPoints;
                parentThis.points = data.points;
                while (parentThis.markers.length > 0) parentThis.removePointsMarker(0);
                while (parentThis.itineraryStartMarkers.length > 0) parentThis.removeItineraryMarker(0);
                for (var i in parentThis.itineraryStartPoints) {
                    parentThis.setItineraryMarker(parentThis.itineraryStartPoints[i].inputWaypoints[0].latLng);
                    parentThis.itineraryStartPoints[i].inputWaypoints[0].write_permit = false;
                }
                for (var i in parentThis.points) {
                    parentThis.setPointsMarker(parentThis.points[i].latLng);
                    parentThis.points[i].write_permit = false;
                }
                if (!parentThis.currentItinerary.getMode()) parentThis.itineraryStartPoints.forEach((obj, index) => {
                    parentThis.itineraryStartMarkers[index].on('click', () => {
                        parentThis.removeSearchMarker();
                        parentThis.currentItinerary.getRouteFromDB(parentThis.itineraryStartPoints[index]._id)
                            .then((data) => {
                                parentThis.currentItinerary.setRoute(data);
                                loadMenu(data.inputWaypoints, data.inputWaypoints.length-1, false);
                            })
                            .catch(() => {});
                    });
                    loadCard(parentThis.itineraryStartPoints[index], 0);
                });
                parentThis.points.forEach((obj,index) => {
                    if (parentThis.markers[index]) parentThis.markers[index].on('click', () => {
                        loadMenu(parentThis.points, index, false);
                    });
                    loadCard(parentThis.points, index);
                });

                this.wikipediaPoints = []; //with wikipedia stuff here, wikipedia links are loaded only if database responds successfully. Maybe it can be changed
                var options = {wiki_search_url: "https://en.wikipedia.org/w/api.php", introCallback: function(a){
                    console.log("yooooooooooooo");
                    if (a){
                        for (var i in a.query.pages)
                            parentThis.wikipediaPoints.push(a.query.pages[i]);
                        for (var i in a.query.pages)
                            parentThis.setWikipediaMarker(a.query.pages[i].latLng);
                }}};
                var wiki = new wikiSearcher(options);
                wiki.searchOnMap(map,10);
                while(parentThis.wikipediaMarkers.length > 0) parentThis.removeWikipediaMarker(0);

                //
                this.yt_points = [];
                var yt_options = {googlekey: "AIzaSyD3_AOCz72jah1UDnRW6Gga8n3T3TX9Rq0",yt_url: "https://www.googleapis.com/youtube/v3/", successCallback: function(res){
                    if (res)
                        for (var i in res.items){
                            res.items[i].recordingDetails.location.lat = res.items[i].recordingDetails.location.latitude;
                            res.items[i].recordingDetails.location.lng = res.items[i].recordingDetails.location.longitude;
                            parentThis.setYoutubeMarker(res.items[i].recordingDetails.location);
                            parentThis.yt_points.push(res.items[i]); // discarding etag, kind and pageInfo properties
                        }
                }};
                var yt = new YTSearcher(yt_options);
                yt.videoOnMap(map, {});
                while(parentThis.yt_markers.length > 0) parentThis.removeYtMarker(0);       

            },
            error: (data) => {
                console.log("getting points failed");
            }
        });
}

    setPointsMarker(latLng){
        var parentThis = this;
        var do_nothing;
        var len = this.markers.length;
        this.markers[len] = new L.Marker(
            latLng,
            {
                draggable: false
            }
        );
        /*this.markers[len].bindPopup(this.points[len].description.toString());
        this.markers[len].on('mouseover', () => {
            parentThis.markers[len].openPopup();
        });
        this.markers[len].on('mouseout', () => {
            parentThis.markers[len].closePopup();
        });*/
        this.markers[len].on('click', (e) => {
            var do_nothing;

            do_nothing = parentThis.check_in_waypoints(len);
            $("#inspect").text(parentThis.points[len].description);
            $("a[href='#feed']").removeClass("active");
            $("a[href='profile']").removeClass("active");
            $("a[href='#inspect']").addClass("active");
            $("#feed").removeClass("active show");
            $("#profile").removeClass("active show");
            $("#inspect").addClass("active show");
            if (!do_nothing) if (parentThis.currentItinerary.getMode()){
                parentThis.currentItinerary.pushWaypoints([e.latlng], parentThis.points[len]);
            }
        });
        do_nothing = this.check_in_waypoints(len);
        if (!do_nothing) this.markers[len].addTo(map);
    }

    check_in_waypoints(len, type = 0){
        var it_waypoints = this.currentItinerary.getWaypoints();
        for (var i in it_waypoints)
            if (type == 0){
                if (it_waypoints[i]._id && it_waypoints[i]._id == this.points[len]._id)
                    return true;
            }
            else if (type == 1){
                if (it_waypoints[i]._id && it_waypoints[i]._id == this.itineraryStartPoints[len].waypoints[0])
                    return true;
            }
        return false;
    }

    setItineraryMarker(latLng){
        var parentThis = this;
        var len = this.itineraryStartMarkers.length;
        var icon = L.icon({
            iconUrl: "./img/itmarker.png",
            iconSize: [40,40],
            iconAnchor: [20,40]
        });
        this.itineraryStartMarkers[len] = new L.Marker(
            latLng,
            {
                icon: icon
            },
            {
                draggable: false
            }
        );
        /*this.itineraryStartMarkers[len].bindPopup(this.itineraryStartPoints[len].label.toString());
        this.itineraryStartMarkers[len].on('mouseover', () => {
            parentThis.itineraryStartMarkers[len].openPopup();
        });
        this.itineraryStartMarkers[len].on('mouseout', () => {
            parentThis.itineraryStartMarkers[len].closePopup();
        });*/
        this.itineraryStartMarkers[len].off('click');

        this.itineraryStartMarkers[len].on('click', (e) => {
            var do_nothing;
            do_nothing = parentThis.check_in_waypoints(len,1);
            $("#inspect").text(parentThis.itineraryStartPoints[len].label);
            $("a[href='#feed']").removeClass("active");
            $("a[href='profile']").removeClass("active");
            $("a[href='#inspect']").addClass("active");
            $("#feed").removeClass("active show");
            $("#profile").removeClass("active show");
            $("#inspect").addClass("active show");
            if (!do_nothing && parentThis.currentItinerary.getMode()){
                parentThis.currentItinerary.pushWaypoints([e.latlng], parentThis.itineraryStartPoints[len].inputWaypoints[0]);
            }
        });
        var do_nothing = this.check_in_waypoints(len,1);
        if(!do_nothing) this.itineraryStartMarkers[len].addTo(map);
    }

    onclick_card(datakey){
        //var do_nothing;
        //do_nothing = parentThis.check_in_waypoints(len,1);
        var parentThis = this;
        $("#inspect").text(this.itineraryStartPoints[datakey].label);
        $("a[href='#feed']").removeClass("active");
        $("a[href='profile']").removeClass("active");
        $("a[href='#inspect']").addClass("active");
        $("#feed").removeClass("active show");
        $("#profile").removeClass("active show");
        $("#inspect").addClass("active show");
        this.removeSearchMarker();
        this.currentItinerary.getRouteFromDB(this.itineraryStartPoints[datakey]._id)
            .then((data) => {
                parentThis.currentItinerary.setRoute(data);
                loadMenu(data.inputWaypoints, data.inputWaypoints.length-1, false);
            })
            .catch(() => {});
    }

    setWikipediaMarker(latLng){
        var parentThis = this;
        var len = this.wikipediaMarkers.length;
        var icon = L.icon({
            iconUrl: "./img/wikipedia.svg"
        });
        this.wikipediaMarkers[len] = new L.Marker(
            latLng,
            {
                icon: icon
            },
            {
                draggable: false
            }
        );
        /*this.wikipediaMarkers[len].bindPopup(this.wikipediaPoints[len].title.toString());
        this.wikipediaMarkers[len].on('mouseover', () => {
            parentThis.wikipediaMarkers[len].openPopup();
        });
        this.wikipediaMarkers[len].on('mouseout', () => {
            parentThis.wikipediaMarkers[len].closePopup();
        });*/
        this.wikipediaMarkers[len].on('click', () => {
            $("#inspect").text(parentThis.wikipediaPoints[len].title.toString());
            $("a[href='#feed']").removeClass("active");
            $("a[href='profile']").removeClass("active");
            $("a[href='#inspect']").addClass("active");
            $("#feed").removeClass("active show");
            $("#profile").removeClass("active show");
            $("#inspect").addClass("active show");
            if (parentThis.currentItinerary.getMode()){
                parentThis.currentItinerary.pushWaypoints([e.latlng], parentThis.wikipediaPoints[len]);
            }
        });
        this.wikipediaMarkers[len].addTo(map);
    }

    setSearchMarker(point){
        var parentThis = this;
        this.searchPoint = point;
        this.searchPointMarker = new L.Marker(
            point.latLng,
            {
                draggable: false
            }
        );
        this.searchPointMarker.bindPopup(this.searchPoint.description.toString());
        this.searchPointMarker.on('mouseover', () => {
            parentThis.searchPointMarker.openPopup();
        });
        this.searchPointMarker.on('mouseout', () => {
            parentThis.searchPointMarker.closePopup();
        });
        this.searchPointMarker.addTo(map);
        return this.searchPointMarker;
    }

    setYoutubeMarker(latLng){
        var parentThis = this;
        var len = this.yt_markers.length;
        var icon = L.icon({
            iconUrl: "./img/32x32.png"
        });
        this.yt_markers[len] = new L.Marker(
            latLng,
            {
                icon: icon
            },
            {
                draggable: false
            }
        );

        this.yt_markers[len].on('click', () => {
            $("#inspect").text(parentThis.yt_points[len].snippet.title.toString());
            $("a[href='#feed']").removeClass("active");
            $("a[href='profile']").removeClass("active");
            $("a[href='#inspect']").addClass("active");
            $("#feed").removeClass("active show");
            $("#profile").removeClass("active show");
            $("#inspect").addClass("active show");
            if (parentThis.currentItinerary.getMode()){
                parentThis.currentItinerary.pushWaypoints([e.latlng], parentThis.wikipediaPoints[len]);
            }
        });
        this.yt_markers[len].addTo(map);
    }

    removePointsMarker(position){
        map.removeLayer(this.markers[position]);
        this.markers.splice(position,1);
    }

    removeItineraryMarker(position){
        map.removeLayer(this.itineraryStartMarkers[position]);
        this.itineraryStartMarkers.splice(position,1);
    }

    removeWikipediaMarker(position){
        map.removeLayer(this.wikipediaMarkers[position]);
        this.wikipediaMarkers.splice(position,1);
    }

    removeSearchMarker(){
        map.removeLayer(this.searchPointMarker);
    }

    removeAddedPointMarker(){
        map.removeLayer(this.addedPointMarker);
    }

    removeYtMarker(position){
        map.removeLayer(this.yt_markers[position]);
        this.yt_markers.splice(position,1);
    }

    removeAllMarkers(){
        while (this.markers.length > 0){
            map.removeLayer(this.markers[0]);
            this.markers.splice(0,1);
        }
        while (this.itineraryStartMarkers.length > 0){
            map.removeLayer(this.itineraryStartMarkers[0]);
            this.itineraryStartMarkers.splice(0,1);
        }
        while (this.wikipediaMarkers.length > 0){
            map.removeLayer(this.wikipediaMarkers[0]);
            this.wikipediaMarkers.splice(0,1);
        }
        while(this.yt_markers.length > 0){
            map.removeLayer(this.yt_markers[0]);
            this.yt_markers.splice(0,1);
        }
        if (this.searchPointMarker) map.removeLayer(this.searchPointMarker);
        if (this.addedPointMarker) map.removeLayer(this.addedPointMarker);
    }

    addPoint(latLng){
        var popup = "<input id='popupInput' type='text'><button onclick='apply()'>Apply</button>";
        var customOptions =
        {
            'maxWidth': '500',
        };
        if (this.addedPointMarker) this.removeAddedPointMarker();
        this.addedPointMarker = new L.Marker(
            latLng,
            {
                draggable: true
            }
        ).bindPopup(popup, customOptions).addTo(map);
        this.addedPoint = {
            "options": { "allowUTurn" : false },
            "latLng" : latLng,
            "_initHooksCalled": true,
            "startItinerary": false,
            "description": ""
        }
    }
}
