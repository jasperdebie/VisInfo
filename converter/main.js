/**
 * Created by mello on 3/19/14.
 */
var fs = require('fs');
//var request = require('request');
var json, file;
var size = 1000;

file = fs.readFileSync('geojson.json');
json = JSON.parse(file);

var convertToFloat = function(o) {
    var o2 = o.replace(/,/,'.');
    return parseFloat(o2);
}

function processSuccess(err, data, body) {
    console.log(body);
}

function strip(o,size) {
    var newarr = [];
    for (var i= 0; i < size; i++) {
        newarr.push(o[i]);
    }
    return newarr;
}


var objects = json.features;

var blank = function(string) {
    return /^\s*$/.test(string);
};

var isZero = function(str) {
    return parseInt(str) === 0;
}

var blankOrZero = function(str) {
    return blank(str) || isZero(str);
}

var outObjects = [];
var filtered = 0;

for (var i=0; i < objects.length; i++) {
    var o = objects[i];
    var reclat = o.properties.reclat;
    var reclong = o.properties.reclong;
    var newGeom = {
        "type": "Point",
        "coordinates": [convertToFloat(reclong),convertToFloat(reclat)]
    }
    o.geometry = newGeom;
    delete o.properties.reclat;
    delete o.properties.reclong;

    // Jochen -- delete some other properties to make the loading faster -- did not work that well ;-) still slow
    delete o.properties.nametype;
    delete o.properties.recclass;
    delete o.properties.mass;
    delete o.properties.fall;
    delete o.properties.id;

    if (!(blankOrZero(reclat) && blankOrZero(reclong))) {
        if(o.properties.year>2001&& o.properties.year<2007)  // only add spottings between 2003 and 2007 // better for performance
            outObjects.push(o);
    } else {
        filtered++;
    }
}
//json.features = strip(outObjects, size);
json.features = outObjects;

var outfile = "out.json";
var output = JSON.stringify(json, null, 2);


//var req = request.post('http://geojsonlint.com/validate', output , processSuccess);

fs.writeFileSync(outfile, output);

console.log("done");
console.log("filtered: "+ filtered);

