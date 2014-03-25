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
    .translate([width / 2,
        height / 2])//positioning of the world map (which point in the center) in the svg
    .precision(.1); //adaptive resampling purposes (for example zooming)
//world map
var svg = d3.select("#geoGraph").append("svg") // select the div element and add an svg
    .attr("width", width)
    .attr("height", height);

var path = d3.geo.path() // formats the 2D geometry to visible stuff in your svg
    .projection(projection);

var g = svg.append("g"); //It is easier to manipulite DOM-tree elements when you place them in a group
//we place all the path's in this group element
var g2 = svg.append("g");
var ufo;

// load and display the World
d3.json("datasets/world.json", function(error, topology) { //readout the world information/data
    g.append("path")
        .attr("class","wordline")
        .datum(topojson.feature(topology, topology.objects.countries))//take the countries and project them
        //topology.objects.land only shows the land, does not split into countries
        .attr("d", path) //attribute d requires a path, which contains instructions for visualizing the path.
        .attr("fill","green")
        .attr("stroke","white")
        .attr("stroke-width",0.25)

    //load and display the ufo spottings
    d3.json("datasets/UfoGeojson.json", function(error, data){
        //on worldmap
        ufo = g2.append("g")
        ufo.selectAll("path")
            .data(data.features)
            .enter().append("path")
            .attr("d", path)
            .style("fill", "red");

        //on bar
        var
            margin = {top: 30, right: 10, bottom: 20, left: 40},
            width = 960 - margin.left - margin.right,
            height = 100 - margin.top - margin.bottom;

        var parseDate = d3.time.format("%Y").parse;


        var x = d3.time.scale().range([0, width]),
            y = d3.scale.linear().range([height, 0]);

        var xAxis = d3.svg.axis().scale(x).orient("bottom"),
            yAxis = d3.svg.axis().scale(y).orient("left");

        var brush = d3.svg.brush()
            .x(x)
            .on("brushend", brushed);

        var area2 = d3.svg.area()
            .interpolate("monotone")
            .x(function(d) { return x(parseDate(d.year)); })
            .y0(height)
            .y1(function(d) { return y(d.amount); });

        var svg = d3.select("#yearFilter").append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom);

        svg.append("defs").append("clipPath")
            .attr("id", "clip")
            .append("rect")
            .attr("width", width)
            .attr("height", height);

        var context = svg.append("g")
            .attr("class", "context")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        d3.json("datasets/brushData.json",  function(error, brushdata) {
            x.domain(d3.extent(brushdata.map(function(d) { return parseDate(d.year); })));
            y.domain([0, d3.max(brushdata.map(function(d) { return d.amount; }))]);

            context.append("path")
                .datum(brushdata)
                .attr("class", "area")
                .attr("d", area2);

            context.append("g")
                .attr("class", "x axis")
                .attr("transform", "translate(0," + height + ")")
                .call(xAxis);

            context.append("g")
                .attr("class", "x brush")
                .call(brush)
                .selectAll("rect")
                .attr("y", -6)
                .attr("height", height + 7);
        });

        function brushed() {
            var begindatum =parseInt(new Date( brush.extent()[0]).getFullYear());
            var einddatum = parseInt(new Date( brush.extent()[1]).getFullYear());


           ufo.selectAll("path").remove();
            ufo.selectAll("path")
                .data(data.features.filter(function(d,i){
                    if ( begindatum <=  parseInt(d.properties.year) && parseInt(d.properties.year) <= einddatum){
                       // console.log("begin" + begindatum + " " + d.properties.year + " " + einddatum)
                        return d;
                    }
                }))
                .enter().append("path")
                .style("fill", "blue")

                console.log(new Date( brush.extent()[0]).getFullYear())
                console.log(new Date( brush.extent()[1]).getFullYear())

           // ufo.selectAll("path").style("fill", "blue")
          //  x.domain(brush.empty() ? x2.domain() : brush.extent());
          //  focus.select(".area").attr("d", area);
          //  focus.select(".x.axis").call(xAxis);
        }


    })

});



//.......
//Zooming
//.......
var zoom = d3.behavior.zoom()
    .on("zoom",function() { // because we added all the paths to a group, we can use the group element to adapt the svg
        g.attr("transform","translate("+
            d3.event.translate.join(",")+")scale("+d3.event.scale+")"); //retrieve the zooming and positing and move the group position
        g.selectAll("path")
            .attr("d", path.projection(projection)); //change projection of paths after zooming

        g2.attr("transform","translate("+
            d3.event.translate.join(",")+")scale("+d3.event.scale+")").attr("r",0.5 / d3.event.scale +"px").redraw;
        g2.selectAll("path")
            .attr("d", path.projection(projection));

       });

svg.call(zoom) //activate the zoomfunction