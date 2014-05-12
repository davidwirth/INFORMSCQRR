//globals
var fields = {'event': [ 'item_id', 'description' ], 'entitlement': ['item_id', 'cust_id'] };
var active_item = '';
var db = openDatabase( 'event_entitlement', '', 'Event Item Entitlement Database', 2 * 1024 * 1024 );
var popupTimer = null;

// create the database tables if they do not already exist
db.transaction(function ( tx ) {
  tx.executeSql('CREATE TABLE IF NOT EXISTS event( item_id, description )');
  tx.executeSql('CREATE TABLE IF NOT EXISTS entitlement( item_id, cust_id )');
  tx.executeSql('DELETE FROM entitlement'); // for testing purposes, clearing the table each page load   
 // alert( 'database initialization complete' );  
  fullDownload();     
});
// check if there is data
/* db.transaction(function( tx ) {
  tx.executeSql('SELECT * FROM event', [], function( tx, result ) {
    //if (result.rows.length == 0) fullDownload();
  },
  function( tx, err ) {
    alert( 'data check failed' + err );
  });
});*/
function fullDownload() {
  $.getJSON( "https://rest.informs.org/event_entitlement_json.php?callback=", function( json ) {
    localStorage.stamp = json.stamp;
    db.transaction( function(tx) {
      $.each( json.tx_data, function( i ) {
        switch( json.tx_data[i][0] ) {
          case '1':
            var sql = "INSERT INTO " + json.tx_data[i][1] + " VALUES ( '" + json.tx_data[i][2][0] + "','" + json.tx_data[i][2][1] + "' );";
            break;
          case '2':
            var sql = "DELETE FROM " + json.tx_data[i][1] + " WHERE " + fields[json.tx_data[i][1]][0] + "='" + json.tx_data[i][2][0] + "' AND ";
            sql += fields[json.tx_data[i][1]][1] + "='" + json.tx_data[i][2][1] + "';";
        }
        tx.executeSql( sql );
      });
    });
  });
  //alert("download complete");
}

function scan() {
  var scanner = cordova.require("cordova/plugin/BarcodeScanner");
  scanner.scan(
    function (result) {
      var id = result.text;
      var event_item = 'NETWORK_LUNCHEON';
      db.transaction(function( tx ) {
        var sql = "SELECT cust_id FROM entitlement WHERE item_id='"+event_item+"' AND cust_id='"+id+"'";
        tx.executeSql(sql,[],function(tx, results) {
          if (results.rows.length > 0) alert('yes');
          else alert('no');
        },null);
      });
    }, 
    function (error) {
      alert("Scanning failed: " + error);
    }
  );
}

function playAudio(src) {
  if (device.platform == 'Android') {
    src = '/android_asset/www/' + src;
  }
  var media = new Media(src, mediaSuccess, mediaError);
  media.play();
}

function mediaError( e ) { alert(e.message); }

function mediaSuccess() {}
 

$(document).ready( function() {
  $('.item_menu').click( function() {
    active_item = $(this).attr( 'id' );
    $.mobile.pageContainer.pagecontainer("change", "#scanner_page");
  });
  $('#scan_button').click( function() {
    $('#popupYes').popup("open");
    //audio = document.getElementById("ding");
   // audio.play();
    playAudio('ding.mp3');
    popupTimer = window.setTimeout(function(){$('#popupYes').popup("close");}, 3000);
  });
  $('.popup').click( function() {
    clearTimeout(popupTimer);
    $(this).popup("close");
  });
  $('#back_button').click( function() {
    window.history.back();
  });
});