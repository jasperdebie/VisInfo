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
    year = strToDate(dateField)
    if (year) {
        good++;
        item.properties.year = year;
    }
    else {
        delete file.features[i];
    }
}

fs.writeFileSync("bigfootfiltered.geojson", JSON.stringify(file, undefined, 2));


