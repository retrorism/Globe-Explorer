
var data_open = 0;

Number.prototype.map = function (in_min, in_max, out_min, out_max) {
  return (this - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
}

$('.country_wrap').on("mouseover",".positions",function(){
   var id = parseInt($(this).attr("id"));
   var targetx = parseInt(datasheet[id].lat);
   var targety = parseInt(datasheet[id].lon);
   globe.setTarget([targetx,targety]);
});


$('#data_wrap').on("mouseover",".data_block",function(){
   var id = $(this).attr("id");
   var cutid = id.substr(id.indexOf('block')+5);
   var targetx = parseInt(datasheet[cutid].lat);
   var targety = parseInt(datasheet[cutid].lon);
   globe.setTarget([targetx,targety]);
   hideMenu();
});

$('#data_block_1').on("click",".close_block",function(){
   hideMenu();
   var id = $(this).attr("id");
   var cutid = id.substr(id.indexOf('block')+6);
   var close_id= "data_block" + cutid;
   var positions_background_id= "#positions_background_" + cutid;
   $("#data_block_1").empty();
   $(positions_background_id).removeClass('positions_background_clicked');
   var idRemove = "#" + cutid;
   $(idRemove).removeClass('positions_clicked');
   data_open = data_open - 1;
   $('#data_wrap').removeClass("data_wrap_two");
   globe.erasePoint(datasheet[cutid].id);
});

$('#data_block_2').on("click",".close_block",function(){
   hideMenu();
   var id = $(this).attr("id");
   var cutid = id.substr(id.indexOf('block')+6);
   var close_id= "data_block" + cutid;
   var positions_background_id= "#positions_background_" + cutid;
   $("#data_block_2").empty();
   $(positions_background_id).removeClass('positions_background_clicked');
   var idRemove = "#" + cutid;
   $(idRemove).removeClass('positions_clicked');
   data_open = data_open - 1;
   $('#data_wrap').removeClass("data_wrap_two");
   globe.erasePoint(datasheet[cutid].id);
});

$('.country_wrap').on("click",".positions",function(){
  var id = parseInt($(this).attr("id"));
  var data_block= "data_" +id;
  hideMenu();
  var data_content_list = "";
  var data_content_block = '<div class="data_block" id="data_block'+id+'"><div class="close_block" id="close_block_'+id +'"></div><h1 class="data_block_title">'+datasheet[id].positions+'</h1><div class="data_block_list">';
     for (val in datasheet[id]){
       if(val != "lat" && val != "lon" && val != "id" && val != "positions"){
         var data_content= '<div class="data_block_elem"><p class="label_data">'+ val +'</p>'
                          +'<h3 class="data_values">'+ datasheet[id][val] +'</h3></div>';
          data_content_list += data_content;
       }
     }

  var targetx = parseInt(datasheet[id].lat);
  var targety = parseInt(datasheet[id].lon);
  globe.bigZoom([targetx,targety]);
  var positions_background_id= "#positions_background_" + id;

if($(this).hasClass('positions_clicked')){
  data_open = data_open - 1;
  $('#data_wrap').removeClass("data_wrap_two");
  $(this).removeClass('positions_clicked');
  var name_block = "#data_block"+ id;
  $(name_block).remove();
  globe.erasePoint(datasheet[id].id);
  $(positions_background_id).removeClass('positions_background_clicked');
}
else{
  if (data_open < 2){
    $(this).addClass('positions_clicked');
    $(positions_background_id).addClass('positions_background_clicked');
    function isEmpty( el ){
         return !$.trim(el.html())
     }
    var size_zoomed= parseInt(datasheet[id][scale_sheet]);
    if (data_open == 0){
      $('#data_block_1').prepend(data_content_block + data_content_list);
      data_open = data_open + 1;
      globe.zoomPoint(datasheet[id].lat,datasheet[id].lon,size_zoomed.map(minscale,maxscale,1,7.3),datasheet[id].id);
    }
    else if (data_open == 1){
      if (isEmpty($('#data_block_1'))) {
        $('#data_block_1').prepend(data_content_block + data_content_list+"</div>");
      }
      else{
        $('#data_block_2').prepend(data_content_block + data_content_list +"</div>");
      }
      $('#data_wrap').addClass("data_wrap_two");
      data_open = data_open + 1;
      globe.zoomPoint(datasheet[id].lat,datasheet[id].lon,size_zoomed.map(minscale,maxscale,1,7.3),datasheet[id].id);
    }
  }
}
});

var menu_open = 0;
var first_open=0;

function openMenu(){
  $('.bar').addClass('animate');
  $('nav').fadeIn(200,function(){
    $('nav').addClass("nav_opened");
  });
  menu_open=1;
}

function hideMenu(){
  $('.bar').removeClass('animate');
  $('nav').fadeOut(400);
  $('nav').removeClass("nav_opened");
  menu_open=0;
}

$('.page_background').click(function(){
  $('#about_page').fadeOut(200);
  $('#share_page').fadeOut(200);
  $('#accessShare_page').fadeOut(200);
})
