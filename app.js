//Neu

//lade havarieseite finde den neusten h1 titel

//lade zdf.de/nachrichten und suche den h1 titel



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
const sophora_url = "https://www.zdf.de/nachrichten/";
const havarie_url = "https://havarielive.zdf.de/interim/ZDFheute/";

process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';

const https = require('https');
const jsdom = require("jsdom");
const { JSDOM } = jsdom;



async function main(){
	
	const titel   = loadhtml();
	const heutede = loadSophora();

	Promise.all([titel,heutede]).then(values=>{
		//find titel in heutede
		let titel = values[0];
		let heutede = values[1];

		const result = heutede.indexOf(titel+1);

		if (result == -1){
			//outdated
			sendOutdateError(2);
		} else {
			//found
			sendOutdateError(0);
		}

		console.log("Done");
	}).catch(err=>{
		console.log("error",err);
	})
		
}
main();


//havarie
function loadhtml(){

	console.log("loadhtml");

	return new Promise( (resolve, reject)=>{

		const t1 = setTimeout(reject,5000);

		https.get(havarie_url, function(res) {
			// save the data

			var html = '';
			res.on('data', function(chunk) {
			  	html += chunk;
			});
	  
			res.on('end', function() {
			  // parse html
			  const titel = parseHTML(html);
			  clearTimeout(t1);
			  resolve(titel);
			});
		}).on('error', function(err) {
			// debug error
			clearTimeout(t1);
			reject(err);
		});
	})


}




function parseHTML(html)
{
	console.log("parseHTML");

	const dom = new JSDOM(html);

	//getHeadlines
	const h1 = dom.window.document.querySelector(".article.kurznachricht > h1");

	return titel = h1.innerHTML;

}

function sendOutdateError(level)
{
	console.log("sendOutdateError");

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
	/* if(age >= 1200 && level == 1)
	{
		fs.writeFileSync("lasterror.txt","Autoimport läuft nicht.");
		var fd = fs.openSync("lasterror.txt","rs+");
		fs.futimesSync(fd, ctime, mtime);
		nagios2 = 1;
		console.log("gelb");

	} else  */
	if(age >=1200 && level == 2){
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
	fs.writeFileSync('web/nagios.txt',errorlevel);
	


	if (nagios1 >0 && nagios2 == 0)
	{
		fs.writeFileSync("errormessage.txt","Lastsicherheit gefährdet.");
		fs.writeFileSync("web/errormessage.txt","Lastsicherheit gefährdet.");
	} else if (nagios2 >0 && nagios1 == 0)
	{
		fs.writeFileSync("errormessage.txt","Havariesystem ist veraltet.");
		fs.writeFileSync("web/errormessage.txt","Havariesystem ist veraltet.");
	} else if (nagios1 >0 && nagios1 > 0)
	{
		fs.writeFileSync("errormessage.txt","Havariesystem ist veraltet und nicht lastsicher.");
		fs.writeFileSync("web/errormessage.txt","Havariesystem ist veraltet und nicht lastsicher.");
	} else {
		fs.writeFileSync("errormessage.txt","Es liegt keine Fehlermeldung vor.");
		fs.writeFileSync("web/errormessage.txt","Es liegt keine Fehlermeldung vor.");
	}	
	
	//console.log("Age: %s Sek", age);

	console.log("Done");
	//process.exit(0);
}





//sophora
function loadSophora()
{
	console.log("loadSophora");

	return new Promise( (resolve,reject)=>{
		const t1 = setTimeout(reject,5000);

		https.get(sophora_url, function(res) {
			// save the data
			var html = '';
			res.on('data', function(chunk) {
				html += chunk;
			});
	
			res.on('end', function() {
				// parse html
				clearTimeout(t1);
				resolve(html);
			});
		}).on('error', function(err) {
			// debug error
			clearTimeout(t1);
			reject(err);
		});

	})

}



