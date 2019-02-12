const fs = require('fs');

const results = require('../src/BY/studienbeitraege/wahlergebnis_volksbegehren_Nein-zu-Studienbeitraegen-in-Bayern_20130220.json');

//const geoJson = require('../src/geoData/BY_gemeinden_simplify0.geo.json');
const geoJson = require('../src/geoData/2_hoch.geo.json');
const features = geoJson.features;

var resultsGeoJson = {
	type: "FeatureCollection",
	properties: {
		name: "Volksbegehren \"Nein zu Studienbeiträgen in Bayern\"",
	},
	features: []
};
	

results.forEach((result) => {
	const key = result.name_clean || result.name;

	var regions = features.filter(entry => {
		return entry.properties.NAME_3 == key || entry.properties.VARNAME_3 == key;
	});

	if (!regions || !regions.length) {
		console.warn(`No entry found for ${result.name}`)
	}

	regions.forEach(region => {
		resultsGeoJson.features.push({
			type: "Feature",
			properties: {
				name: result.name,
				density: result.valid_percentage
			},
			geometry: region.geometry
		});
	});


	fs.writeFileSync('docs/data.geo.json', JSON.stringify(resultsGeoJson, null, '\t'));
});