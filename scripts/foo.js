/**
 * Created by Jasper on 19/03/14.
 */
var fs = require('fs');

var file = fs.readFileSync('../datasets/UfoGeojson.json');
var data = JSON.parse(file);



var arr = [];
var output = [];
var min = 0,
    max = 0;
data.features.forEach(function(entry) {

    if (typeof arr[entry.properties.year] === 'undefined') {
        arr[entry.properties.year] = 1;
    } else {
        arr[entry.properties.year] = arr[entry.properties.year] + 1
    }
    //arr[entry.properties.year] = arr[entry.properties.year] + 1 || 1;
    if(max < parseInt(entry.properties.year)){
        max = entry.properties.year;
    }
    if(min == 0 || min > entry.properties.year ) {
        min = entry.properties.year;
    }
});


var ar = Object.keys(arr);

for (var i=0; i < ar.length; i++) {
    var key = ar[i];
    var newval = {
        "year": key,
        "amount": arr[key]
    };
    output.push(newval);
}

var output = JSON.stringify(output);
fs.writeFileSync("filename.json",output);

console.log("done");