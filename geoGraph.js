/**
 * Created by Jasper on 13/03/14.
 */
//File has to be placed at the bottom of the html page because he has to know the full DOM tree (in particular
//the div geograph.


//width and height of our geograph element!
var width = 960,
    height = 960;

//how the worldmap has to be projected on the screen
var projection = d3.geo.mercator()
    .scale((width + 1) / 2 / Math.PI)// The size of the world map
    .translate([width / 2, height / 2])//positioning of the world map (which point in the center) in the svg
    .precision(.1); //adaptive resampling purposes (for example zooming)

var svg = d3.select("#geoGraph").append("svg") // select the div element and add an svg
    .attr("width", width)
    .attr("height", height);

var path = d3.geo.path() // formats the 2D geometry to visible stuff in your svg
    .projection(projection);

var g = svg.append("g"); //It is easier to manipulite DOM-tree elements when you place them in a group
//we place all the path's in this group element

// load and display the World
d3.json("datasets/world.json", function(error, topology) { //readout the world information/data
    g.append("path")
        .datum(topojson.feature(topology, topology.objects.countries))//take the countries and project them
        //topology.objects.land only shows the land, does not split into countries
        .attr("d", path) //attribute d requires a path, which contains instructions for visualizing the path.


});