//lade xml

//lade havarie index

//vergleiche
//ermittle versatz //finde pos von havarie_artikel_1 ind live_Artikel_liste

//regeln
//wenn versatz und versatz älter als 1 cron intervall dann fehler gelb
// wenn versatz größer 1 und älter als 2 cron intervalle dann rot

//kombiniere mit linkScript und speichere höheren der beiden werte in nagios datei. speichere eine status/fehlermeldung in nagios datei


//heute.de kurznachrichten als xml
//var p12_url = "http://www.zdf.de/ZDF/zdfportal/xml/object/6019522";
var p12_url = "http://www.zdf.de/ZDF/zdfportal/api/v1/content/p12:6019522";
var havarie_url = "http://havarie.zdf.de/interim/ZDFheute/";


var http = require('http');
var xpath = require('xpath');
var dom = require('xmldom').DOMParser;
var jsdom = require("jsdom");

//havarie
function loadhtml(xmlnodes,xmltitel){

	var req = http.get(havarie_url, function(res) {
	  // save the data
	  var xml = '';
	  res.on('data', function(chunk) {
	    xml += chunk;
	  });

	  res.on('end', function() {
	    // parse xml
	    parseHTML(xml,xmlnodes,xmltitel);
	  });
	});
}

function parseHTML(html,xmlnodes,xmltitel)
{
	jsdom.env(
	  html,
	  ["http://code.jquery.com/jquery.js"],
	  function (errors, window) {
	  	var headlines = window.$(".article.kurznachricht > h1");
	  	var headline1 = headlines[0];
	  	var h1txt = window.$(headline1).text();
	    
	    // var t=getTitles(xmlnodes);
	    //finde position in xml
	    for (var i = xmltitel.length - 1; i >= 0; i--) {
	    	var x = xmltitel[i];
	    	console.log(x.firstChild.nodeValue);
	    	

	    };
	  }
	);	
}


// function getTitles(nodes)
// {
// 	var select = xpath.useNamespaces({"zdf": "http://www.zdf.de/api/contentservice/v1"});
// 	var nodes2 = xpath.query('zdf:titel', nodes);
// 	console.log(nodes2);

// }


//p12
var req = http.get(p12_url, function(res) {
  // save the data
  var xml = '';
  res.on('data', function(chunk) {
    xml += chunk;
  });

  res.on('end', function() {
    // parse xml
    parseXML(xml);
  });
});

req.on('error', function(err) {
  // debug error
});

function parseXML(xml){
	
	var doc = new dom().parseFromString(xml);
	var select = xpath.useNamespaces({"zdf": "http://www.zdf.de/api/contentservice/v1"});

	var nodes = select('//zdf:Rubrik/zdf:id[text()="newsflash:Nachrichten"]/../zdf:kurzmeldungen/zdf:Kurzmeldung', doc);
	var title = select('//zdf:Rubrik/zdf:id[text()="newsflash:Nachrichten"]/../zdf:kurzmeldungen/zdf:Kurzmeldung/zdf:titel', doc);
	
	loadhtml(nodes,title);
	//console.log(nodes[0].localName + ": " + nodes[0].firstChild.data)
	//console.log("node: " + nodes[0].toString())

}



