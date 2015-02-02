//lade xml

//lade havarie index

//vergleiche
//ermittle versatz //finde pos von havarie_artikel_1 ind live_Artikel_liste

//regeln
//wenn versatz und versatz älter als 1 cron intervall dann fehler gelb
// wenn versatz größer 1 und älter als 2 cron intervalle dann rot

//kombiniere mit linkScript und speichere höheren der beiden werte in nagios datei. speichere eine status/fehlermeldung in nagios datei

process.on('uncaughtException', function(err) {
  console.log(err);
  process.exit(1);
});


//heute.de kurznachrichten als xml
//var p12_url = "http://www.zdf.de/ZDF/zdfportal/xml/object/6019522";
var p12_url = "http://www.zdf.de/ZDF/zdfportal/api/v1/content/p12:6019522";
var havarie_url = "https://havarie.zdf.de/interim/ZDFheute/";


var http = require('http');
var https = require('https');

process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';


var xpath = require('xpath');
var dom = require('xmldom').DOMParser;
var jsdom = require("jsdom");

// sendOutdateError(0); return;

//havarie
function loadhtml(xmlnodes,xmltitel){

	//console.log("loadhtml");

	var req = https.get(havarie_url, function(res) {
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
	//console.log("parseHTML");

	jsdom.env(
		html,
		["http://code.jquery.com/jquery.js"],
		function (errors, window)
		{
			var headlines = window.$(".article.kurznachricht > h1");

			if (headlines.length == 0){
				sendOutdateError(2); //2=höchste stufe
			} 

			var headline1 = headlines[0];
			var hheadline = window.$(headline1).text();

			console.log("Havarie:  ", hheadline);

			for(var i=0, len=xmltitel.length;i<len;i++)
			{
				var xheadline = xmltitel[i].firstChild.nodeValue;
				console.log("heute.de: ", xheadline);

				if (hheadline.toUpperCase() === xheadline.toUpperCase())
				{
					//position von havarie headline in heute headlines gefunden
					break;
				}
			}

			//positionen vergleichen
			if (i === 0)
			{
				//ok raus
				sendOutdateError(0);
			} else {
				sendOutdateError(i);
			}
			////return;

			//console.log("Havarie:  ", window.$(headlines[i]).text());
			//console.log("heute.de: ",x);
			// var t=getTitles(xmlnodes);
			//finde position in xml
			// for (var i = xmltitel.length - 1; i >= 0; i--) {
			// 	var x = xmltitel[i];
			// 	console.log(x.firstChild.nodeValue);
			// };
		}
	);
}

function sendOutdateError(level)
{
	//console.log("sendOutdateError");

	//lasterror file einlesen
	var fs = require('fs');
	var nagios1 = 0;
	var nagios2 = 0;
	var mtime = new Date();
	var ctime = new Date();
	var age = 0;

	try{
		nagios1 = fs.readFileSync("../listReqURLs/nagios.txt");
	} catch (e)
	{
		console.log("error at readFileSync(\"../listReqURLs/nagios.txt\"");
	}

	try{
		mtime = fs.statSync("lasterror.txt").mtime;
		ctime = fs.statSync("lasterror.txt").ctime;
		age = parseInt((new Date() - mtime)/1000);
	} catch (e)
	{
		console.log("error at lasterror.txt");
	}

	console.log("Age: " + age + " level: " + level);

	//stufe 1
	if(age >= 1200 && level == 1)
	{
		fs.writeFileSync("lasterror.txt","Autoimport läuft nicht.");
		var fd = fs.openSync("lasterror.txt","rs+");
		fs.futimesSync(fd, ctime, mtime);
		nagios2 = 1;
		console.log("gelb");

	} else if(age >=1200 && level >= 2){
		fs.writeFileSync("lasterror.txt","Autoimport läuft schon länger nicht.");
		var fd = fs.openSync("lasterror.txt","rs+");
		fs.futimesSync(fd, ctime, mtime);
		nagios2 = 2;
		console.log("rot");
	} else {
		fs.writeFileSync("lasterror.txt",new Date());
		nagios2 = 0;
		console.log("grün");
	}


	var errorlevel = Math.max(nagios1,nagios2);
	fs.writeFileSync("nagios.txt",errorlevel);

	if (nagios1 >0 && nagios2 == 0)
	{
		fs.writeFileSync("errormessage.txt","Lastsicherheit gefährdet.");
	} else if (nagios2 >0 && nagios1 == 0)
	{
		fs.writeFileSync("errormessage.txt","Havariesystem ist veraltet.");
	} else if (nagios1 >0 && nagios1 > 0)
	{
		fs.writeFileSync("errormessage.txt","Havariesystem ist veraltet und nicht lastsicher.");
	} else {
		fs.writeFileSync("errormessage.txt","Es liegt keine Fehlermeldung vor.");
	}	


	//cp für web
	fs.createReadStream('errormessage.txt').pipe(fs.createWriteStream('web/errormessage.txt'));
	fs.createReadStream('nagios.txt').pipe(fs.createWriteStream('web/nagios.txt'));
	//console.log("Age: %s Sek", age);

	console.log("Done");
	process.exit(0);

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
    var fs = require('fs');
    fs.writeFileSync("p12.xml",xml);
    
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



