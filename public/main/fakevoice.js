var badLvlSpec = ['gen','pre','elm','mid','scl','all']
var badCurrentLvlSpec = 0;
var purpose = "";
var dest_point = {};


var badPaul = new Artyom();
badPaul.initialize({
    lang: initLanguagePaul(),
    continuous: false, // Listen forever
    soundex: true,// Use the soundex algorithm to increase accuracy
    debug: true, // Show messages in the console
    executionKeyword: "",//Esegui dopo questa spressione
    listen: false, // Start to listen commands !
    // If providen, you can only trigger a command if you say its name
    // e.g to trigger Good Morning, you need to say "Bad Paul Good Morning"
    name: "Bad Paul"
    });

function initLanguagePaul(){
    var userLang = navigator.language || navigator.userLanguage;
    return userLang;
}

//var tmpuser = {}
//tmpuser.latLng = {lat: '44.488998044', lng: '11.339498642'}

function badPaulWmi(){//wheremi

    if (L.userPosition){         
         purpose = "what";
         badCurrentLvlSpec = 0;
           wmi_search(1, L.userPosition.latLng, {purpose: purpose}, function(videos){
            if (videos[0] && videos[0].id){
                facade.getPointsOfInterest().setYTPoint(videos[0].id, videos[0].latLng);
                dest_point = facade.getPointsOfInterest().calculateClosestPoint();
                
                var tmp = []; tmp.push(L.userPosition.latLng); tmp.push(dest_point.data.latLng);
                facade.getItinerary().setWaypoints(tmp); // per wiki e point l'audio parte quando viene cambiato L.userPosition e diventa <20, guarda su l0controllocate (mi sembra)
                if (dest_point.type == "yt"){
                    badPaul.say('Playing a video to tell you where you are');
                    facade.getGraphics().loadVideoAndPlay(videos[0].id);
                    $("#buttonPause").on("click", () => {
                        $('.embed-responsive-item').each(function(){
                            this.contentWindow.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*');
                        });
                    });
                    $("#buttonCont").on("click", () => {
                        $('.embed-responsive-item').each(function(){
                            this.contentWindow.postMessage('{"event":"command","func":"playVideo","args":""}', '*');
                        });
                    });
                }
            }
            else {
                badPaul.say("Sorry, we couldn't find any videos");
            }
           });
    }
    else if (!L.userPosition) badPaul.say("You have to activate the geolocalisation");
}

function badPaulWhy(){
    if (L.userPosition){
        purpose = "why";
        badCurrentLvlSpec = 0;
        wmi_search(1, L.userPosition.latLng, {purpose: purpose, level: badLvlSpec[0]}, function(videos){
            console.log(videos);
            var url;
            if (videos.length > 0){
                if (videos[0].id){
                facade.getGraphics().loadVideoAndPlay(videos[0].id);
                badPaul.say("Playing a video to tell you why this place is interesting. Level "+ badLvlSpec[0])
            } else if (videos.id){ url = "https://www.youtube.com/embed/" + videos.id
                badPaul.say("Playing a video to tell you why this place is interesting. Level "+ badLvlSpec[0])
            }
        }
        else badPaul.say("We couldn't find the right video for the occasion");
      });
    }
    else badPaul.say("You have to activate the geolocalisation");
}

function badPaulMore(){
    var url;
    if (L.userPosition){
        wmi_search(1, L.userPosition.latLng, {purpose: purpose, level: badLvlSpec[++badCurrentLvlSpec]}, function(videos){
            console.log(videos);
            if (videos.length > 0 && badCurrentLvlSpec <= 5){
             if (videos[0].id){
                badPaul.say("Playing a video to tell you why this place is interesting. Level "+ badLvlSpec[badCurrentLvlSpec])
                facade.getGraphics().loadVideoAndPlay(videos[0].id);
             } else if (videos.id){
                url = "https://www.youtube.com/embed/" + videos.id //videos non dovrebbe essere sempre un vettore?? 
                facade.getGraphics().loadVideoAndPlay(videos.id);
                badPaul.say("Playing a video to tell you why this place is interesting. Level "+ badLvlSpec[badCurrentLvlSpec])
             }
            }
             else {
                 //badPaul.say("We couldn't find the right video for the occasion");
                 if (badCurrentLvlSpec > 5){
                     badPaul.say("Reached maximum detail level");
                     badCurrentLvlSpec = 0;
                 }
                 else badPaulMore();
             }
             //if (url){$("#video-frame").attr('src', url); $("#video-frame").play()}
          });
    }
    else badPaul.say("You have to activate the geolocalisation");

}

function badPaulHow(){
    if (L.userPosition){
        purpose = "how";
        badCurrentLvlSpec = 0;
    wmi_search(1, tmpuser.latLng, {purpose: purpose, level: badLvlSpec[0]}, function(videos){
        console.log(videos);
        var url;
        if (videos.length > 0){
         if (videos[0].id){
             badPaul.say("Playing a video to tell you how to visit this place.");
             facade.getGraphics().loadVideoAndPlay(videos[0].id);
         }/* else if (videos.id){ url = "https://www.youtube.com/embed/" + videos.id +"?autoplay=1"
           badPaul.say("Playing a video to tell you how to visit this place.");
         }*/
        }
         else badPaul.say("We couldn't find the right video for the occasion");    
      });
    }
    else badPaul.say("You have to activate the geolocalisation");
}

function badPaulNext(){

}

function badPaulPrev(){

}

/*function badPaulPause(){
    //stoppa la riproduzione del video corrente
    //$("#video-frame").pause();
    badPaul.say("Current video paused");

}

function badPaulContinue(){
    //continua la riproduzione del video corrente
    badPaul.say("Resuming play");
    //$("#video-frame").play()
}*/