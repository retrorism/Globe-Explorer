// Array that holds the data
var datasheet = [];

//
var sheetscale = [];
var spreadsheetID = "185UpX6CL0ttnTHGAyoiLkKzmXhKajrQU-PCcVd1y-Qo";
var minscale;
var maxscale;
var sheets_titles;
var scale_sheet;
var globe;

var img = new Image();
img.onload = startGlobe();
img.src = "http://localhost/Globe-Explorer/img/world03.jpg";


function startGlobe() {

	if(!Detector.webgl){
		// If no WebGL, don't do anything.
		Detector.addGetWebGLMessage();
	} else {
		var container = document.getElementById('container');
		// Create globe, no options.
		globe = DAT.Globe(document.getElementById('container'), function() {} );
		globe.animate();
	}
	var x = location.search;
	if ( x ) {
		sharedLink(x.substr(1));
	}
	else {
		$('#init_page').fadeIn(200);
	}
	var url = "http://localhost/Globe-explorer/data/aslan.json";
	$.getJSON(url, function(data) {
		datasheet = data.data;
		//console.log( datasheet );
	}).done(function() {
		startdata();
	});

	function startdata(){
		$('#init_page').fadeOut(200);
		for (var i = 0; i<datasheet.length; i++){
			$('.country_wrap').append('<h2 class="positions"'+ 'id="'+datasheet[i].id+'">'+datasheet[i].positions+'<div class="positions_background" id="positions_background_'+datasheet[i].id+'"></div></h2>');
		}
		dataset(datasheet);
		function dataset(data){
			globe.addData(data, {format: 'magnitude', name : 'positions', animated: true});
			globe.createPoints(function(){
				globe.animate();
			});
		};
	};

}
