/**
 * Created by Jasper on 13/03/14.
 */
var width = 960,
    height = 960;

var projection = d3.geo.mercator()
    .scale((width + 1) / 2 / Math.PI)
    .translate([width / 2, height / 2])
    .precision(.1);

var svg = d3.select("body").append("svg")
    .attr("width", width)
    .attr("height", height);

var path = d3.geo.path()
    .projection(projection);

var g = svg.append("g");

// load and display the World
d3.json("datasets/world.json", function(error, topology) {
    g.append("path")
        .datum(topojson.feature(topology, topology.objects.countries))
        .attr("d", path)


});