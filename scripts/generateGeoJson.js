const fs = require('fs');
const path = require('path');
const csv = require('csvtojson');

async function getDataFromCSV(filename) {
	return csv().fromFile(filename);
}
	
function generateGeoJson(results, geoJson) {
	const features = geoJson.features;
	
	var resultsGeoJson = {
		type: "FeatureCollection",
		properties: {
			name: "Volksbegehren \"Artenvielfalt & Naturschönheit in Bayern\"",
			logo: "vob_rettet_die_bienen.jpg",
			website: "https://volksbegehren-artenvielfalt.de/"
		},
		features: []
	};

	results.forEach((result) => {
		const key = result.geoName;

		var regions = features.filter(entry => {
			return entry.properties.NAME_3 == key || entry.properties.VARNAME_3 == key;
		});

		if (!regions || !regions.length) {
			console.warn(`No geoJson entry found for "${key}"`)
		} if (regions.length > 1) {
			console.warn(`Multible geoJson entries found for key "${key}": ${JSON.stringify(regions.map(r => r.properties))}`)
		}

		regions.forEach(region => {
			resultsGeoJson.features.push({
				type: "Feature",
				properties: {
					name: result.name,
					density: result.valid_percentage.replace(',','.')
				},
				geometry: region.geometry
			});
		});
	});

	fs.writeFileSync('docs/data.geo.json', JSON.stringify(resultsGeoJson, null, '\t'));
}

function addGeoNames(results, gemeinden) {
	results.map((result) => {

		/* 1. We know that for the following names no corresponding entry can be found in the geoJson.
		 * So we map some names here, that are definely false int the geoJson. */
		const nameFixes = {
			"München, Landeshauptstadt": "Munich Städte",
			"München, Krfr. St": "Munich Städte",
			"München": "Munich",
			"Landsberg am Lech": "Landsberg a.Lech",
			"Neustadt a.d.Waldnaab": "Neustadt a.d.Waldnaab|Waldnaab",
			"Neustadt a.d.Aisch-Bad Windsheim": "Neustadt-Bad Windsheim",
			"Kempten (Allgäu), krfr. St": "Kempten Städte",
			"Kempten (Allgäu), Krfr. St": "Kempten Städte",
			"Kempten (Allgäu), kreisfreie Stadt": "Kempten Städte",
			"Kempten (Allgäu)": "Kempten Städte",
			"Dillingen a.d.Donau": "Dillingen",
			"Weiden i.d.OPf., krfr. St": "Weiden Städte",
			"Weiden i.d.OPf., Krfr. St": "Weiden Städte",
			"Weiden i.d.OPf., kreisfreie Stadt": "Weiden Städte",
			"Nürnberg, krfr. St": "Nuremberg Städte",
			"Nürnberg, Krfr. St": "Nuremberg Städte",
			"Nürnberg, kreisfreie Stadt": "Nuremberg Städte",
			"Memmingen": "Memmingen Städte",
			"Ingolstadt": "Ingolstadt Städte",
			"Landsberg a.Lech": "Landsberg",
			"Straubing": "Straubing Städte",
			"Erlangen": "Erlangen Städte",
			"Schwabach": "Schwabach Städte",
			"Kaufbeuren": "Kaufbeuren Städte",
		};
		geoName = nameFixes[result.name];
		if (geoName) {
			result.geoName = geoName;
			return result;
		}

		/* 2. We know it could help replacing "krfr. St" with "Städte" */
		
		geoName = result.name.includes('Krfr. St') ? result.name.replace(', Krfr. St', ' Städte') : geoName;
		geoName = result.name.includes('krfr. St') ? result.name.replace(', krfr. St', ' Städte') : geoName;
		geoName = result.name.includes('kreisfreie Stadt') ? result.name.replace(', kreisfreie Stadt', ' Städte') : geoName;
		if (geoName) {
			result.geoName = geoName;
			return result;
		}

		/* 3. For all other names we get the name from a official list, and hove they mach */
		const Land = '09';
		const RB = result.key.substring(0,1);
		const Kreis = (result.key.length > 1) ? result.key.substring(1,3) : null;
		gemeinde = gemeinden.filter((g) => {
			if (Kreis) {
				return (g.Land === Land) && (g.RB === RB) && (g.Kreis === Kreis) && (g.VB === '');
			} else {
				return (g.name === result.name) && (g.Land === '09') && (g.VB === '');
			}
		});
		if (gemeinde.length < 1) {
			console.warn(`Could not found Gemeinde "${result.key || '?'}:${result.name}"`);
		} else if (gemeinde.length > 1) {
			console.warn(`Mehrere Gemeinden gefunden mit key "${result.key || '?'}:${result.name}" gefunden: ${JSON.stringify(gemeinde)}`);
		} else {
			result.geoName = gemeinde[0].name;
		}
		return result;
	});
	
	return results;
}



//const filename = path.resolve(__dirname, "../src/BY/studienbeitraege/vob_studienbeitraege_kr1-7.csv");
//const filename = path.resolve(__dirname, "../src/BY/g9-g8/vob_g9-g8_kr1-7.csv");
//const filename = path.resolve(__dirname, "../src/BY/kontrolle/ergebnis_kontrolle.csv");
//const filename = path.resolve(__dirname, "../src/BY/artenvielfalt/vob_rettet_die_bienen_vorl_14.02.2019_12:35.csv");
const filename = path.resolve(__dirname, "../src/BY/artenvielfalt/vob_rettet_die_bienen_14.03.2019.csv");

(async () => {
	var results = await getDataFromCSV(filename);
	var gemeinden = await getDataFromCSV(path.resolve(__dirname, '../src/gemeinden/20181231_Auszug_GV.csv'));
	const geoJson = require('../src/geoData/2_hoch.geo.json');
	
	results = addGeoNames(results, gemeinden);

	generateGeoJson(results, geoJson);
})()