YTSearcher = function (options){ //var yt=new YTSearcher({googlekey: "AIzaSyD3_AOCz72jah1UDnRW6Gga8n3T3TX9Rq0",yt_url: "https://www.googleapis.com/youtube/v3/", successCallback: function(res){console.log(res);}});

  parent = this;
  this._options={};

  function init(){
    for (var i in options){
      if (typeof(i) === 'object')
        parent._options[i].extend(options[i]);
      else
        parent._options[i]=options[i]
    }
        parent.items=[]
  }

  function cleanItems(){parent.items=[];}

  function yt_geovideo_search(_params){
    var params={
      part: "snippet",
      location: _params.coords.latitude+","+_params.coords.longitude,
      locationRadius: _params.radius*1000+"m",
      key: parent._options.googlekey,
      type: "video",
      videoEmbeddable: true
    }
    // TODO: aggiungere topicId

    if (_params.pageToken)
      params["pageToken"]=_params.pageToken;

    if (_params.topicId)
        params["topicId"]=_params.topicId;
    get_url=parse_params(parent._options.yt_url+"search", params);

    $.ajax({
      method: "GET",
      url: get_url,
      contentType: "application/json",
      format: "json",
      success: function(res){
        parent.items=parent.items.concat(res.items);
        if (res.nextPageToken && _params.results-res.items.length>0)
          yt_geovideo_search(Object.assign(_params, {pageToken: res.nextPageToken, results:_params.results-res.items.length}))
        else
        parent.get_yt_videos(parent.items);
      },
      error: function(a,b,c){
        console.log(a,b,c);
      }
    });
  }

  this.get_yt_videos = function (search_resource_array){
    var list="";
    if (search_resource_array.length)
      list+=search_resource_array[0].id.videoId;
    for (var i=1; i<search_resource_array.length; i++)
      list+=","+search_resource_array[i].id.videoId;

    var params={
      part: "snippet,recordingDetails",
      key: parent._options.googlekey,
      id: list
    };

    get_url=parse_params(parent._options.yt_url+"videos", params);

    $.ajax({
      method: "GET",
      url: get_url,
      contentType: "application/json",
      format: "json",
      success: function(res){cleanItems();parent._options.successCallback(res);},
      error: function(a,b,c){
        parent._options.errorCallback(a, b, c);
      }
    });
  }

  function parse_params(ext_url, params){
    var url=ext_url;
    Object.keys(params).forEach(function(key){url += "&" + key + "=" + params[key];});
    if (url.match(/&/).length){
      url=url.substr(0, url.search('&'))+'?'+url.substr(url.search('&')+1);
    }
    return url;
  }

  this.videoOnMap = function(map, params){
    radius=L.getRadius(map);
    center=map.getCenter();
    yt_geovideo_search({coords:{latitude: center.lat, longitude:center.lng}, radius:radius, results:params.results});
  }
  init();
}
