/**
 * Created by mello on 4/9/14.
 */
var parser = require('xml2json');
var fs = require('fs');

var file = fs.readFileSync("bigfoot.geojson", "utf8");
file = JSON.parse(file);

var strToDate = function(str) {
    var datepart = str.split(" ");
    var parts = datepart[0].split("-");
    var year;
    year = parseInt(parts[0]);
    if (year < 1000) {
        return false;
    }
    return year;
};

var dateField, item, good, bad, year;
good = 0;
bad = 0;

for (var i = 0; i < file.features.length; i ++) {
    item = file.features[i];
    dateField = item.properties.Name;
    year = strToDate(dateField);
    if (year && year >= 1950) {
        good++;
        item.properties.year = year;
    }
    else {
        delete file.features[i];
    }
}

file.features = file.features.filter(function(e) { return e;});


var max = Number.MIN_VALUE;
var min = Number.MAX_VALUE;
for (var j = 0; j < file.features.length; j ++) {
    item = file.features[j];
    year = parseInt(item.properties.year);

    if (year < min) {
        min = year;
    }
    if (year > max) {
        max = year;
    }
}

var amounts = {};
for (j= min; j < max + 1; j ++) {
    amounts[j] = 0;
}

for (j = 0; j < file.features.length; j++) {
    item = file.features[j];
    year = item.properties.year;
    amounts[year] = amounts[year] + 1;
}

var a;
var result = [];
for (j= min; j < max + 1; j ++) {
    a = amounts[j];
    result.push({"year": j, "amount": a});
}

fs.writeFileSync("bigfootbrush.json", JSON.stringify(result, undefined, 2));
fs.writeFileSync("bigfootfiltered.geojson", JSON.stringify(file, undefined, 2));


