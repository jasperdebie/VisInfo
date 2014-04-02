/**
 * Created by Jasper on 13/03/14.
 *
 * File has to be placed at the bottom of the html page because he has to know the full DOM tree (in particular
 * the div's.
 */
(function () {

    /* width and height of our geograph element! */
    var width = 960,
        height = 960;

    /* initial radius of a circle */
    var scaleFactor = 1.5;
    /* Variable we set whenever we recalculate the scale of circles */
    var prevScale;

    /*
     * This function calculates the size of the circle based
     * on the current scale factor found in d3.event.scale.
     * If a calculated "s" is greater than the standard scale factor,
     * then we prefer the original scaling factor.
     */
    var calcScale = function () {
        var scale, s;
        scale = d3.event.scale;
        if (typeof scale !== 'undefined') {
            prevScale = scale;
        } else if (typeof prevScale !== 'undefined') {
            scale = prevScale;
        } else {
            return scaleFactor;
        }
        s = scaleFactor / (scale / 5);
        return s >= scaleFactor ? scaleFactor : s;
    }

    /*
     * how the worldmap has to be projected on the screen;
     * scale: The size of the world map
     * translate: positioning of the world map (which point in the center) in the svg
     * precision: adaptive resampling purposes (for example zooming)
     */
    var projection = d3.geo.mercator()
        .scale((width + 1) / 2 / Math.PI)
        .translate([width / 2,
                    height / 2])
        .precision(.1);
    /*
     * World map;
     * first, select the div and append a svg element
     * then set it's height and width properties
     */
    var svg = d3.select("#geoGraph").append("svg")
        .attr("width", width)
        .attr("height", height);

    /*
     * formats the 2D geometry to visible stuff in your SVG
     */
    var path = d3.geo.path()
        .projection(projection);

    /*
     * We append a "g" element;
     * this means we add a group. This allows us to nest SVG elements inside it.
     * Later, we append the circles to this group.
     */
    var g = svg.append("g");
    var ufo;


    /*
     * Load and displays the world.
     *
     * First we read out the data from json
     * datum actually take the country data and project them.
     * topojson.feature will get the correct collections for d3
     * the "d" attribute is the actual information for visualising the path
     */
    d3.json("datasets/world.json", function (error, topology) {
        g.append("path")
            .attr("class", "wordline")
            .datum(topojson.feature(topology, topology.objects.countries))
            .attr("d", path)
            .attr("fill", "green")
            .attr("stroke", "white")
            .attr("stroke-width", 0.25);

        /*
         * Load and display UFO spottings on the world map
         *
         */
        d3.json("datasets/UfoGeojson.json", function (error, data) {
            ufo = g.append("g")
            ufo.selectAll("circle")
                .data(data.features)
                .enter()
                .append("circle")
                .attr("cx", function (d) {
                    return projection([d.geometry.coordinates[0], d.geometry.coordinates[1]])[0];
                })
                .attr("cy", function (d) {
                    return projection([d.geometry.coordinates[0], d.geometry.coordinates[1]])[1];
                })
                .style("fill", "red")
                .attr("r", scaleFactor);

            /* Creation of Brush */
            var margin = {top: 30, right: 10, bottom: 20, left: 40},
                width = 960 - margin.left - margin.right,
                height = 100 - margin.top - margin.bottom;

            /* Get the correct form for data */
            var parseDate = d3.time.format("%Y").parse;


            var x = d3.time.scale().range([0, width]), // type scale
                y = d3.scale.linear().range([height, 0]);

            /* Position of brushbar */
            var xAxis = d3.svg.axis().scale(x).orient("bottom"),
                yAxis = d3.svg.axis().scale(y).orient("left");

            var brush = d3.svg.brush()
                .x(x)
                .on("brushend", brushed);

            var area2 = d3.svg.area()
                .interpolate("monotone")
                .x(function (d) {
                    return x(parseDate(d.year));
                })
                .y0(height)
                .y1(function (d) {
                    return y(d.amount);
                });

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

            d3.json("datasets/brushData.json", function (error, brushdata) {
                x.domain(d3.extent(brushdata.map(function (d) {
                    return parseDate(d.year);
                })));
                y.domain([0, d3.max(brushdata.map(function (d) {
                    return d.amount;
                }))]);

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
                var begindatum = parseInt(new Date(brush.extent()[0]).getFullYear());
                var einddatum = parseInt(new Date(brush.extent()[1]).getFullYear());


                console.log(ufo);
                ufo.selectAll("circle").remove();
                ufo.selectAll("circle")
                    .data(data.features.filter(function (d, i) {
                        if (begindatum <= parseInt(d.properties.year) && parseInt(d.properties.year) <= einddatum) {
                            // console.log("begin" + begindatum + " " + d.properties.year + " " + einddatum)
                            return d;
                        }
                    }))
                    .enter()
                    .append("circle")
                    .attr("cx", function (d) {
                        return projection([d.geometry.coordinates[0], d.geometry.coordinates[1]])[0];
                    })
                    .attr("cy", function (d) {
                        return projection([d.geometry.coordinates[0], d.geometry.coordinates[1]])[1];
                    })
                    .style("fill", "blue")
                    .attr("r", calcScale());

                console.log(new Date(brush.extent()[0]).getFullYear());
                console.log(new Date(brush.extent()[1]).getFullYear());

                /**
                 * ufo.selectAll("path").style("fill", "blue")
                 * x.domain(brush.empty() ? x2.domain() : brush.extent());
                 * focus.select(".area").attr("d", area);
                 * focus.select(".x.axis").call(xAxis);
                 */
            }


        })

    });



    /*
     * Defines the zooming behaviour
     *
     * the "g" variable here is our SVG group.
     * Since we added both paths and circles here, we can now calculate what needs to happen.
     * transform: retrieve the zooming and positing and move the group position
     *
     * Then we update paths and circles after zooming
     * we calculate the new projection and the new scale
     */
    var zoomFn = function() {
        g.attr("transform", "translate(" +
            d3.event.translate.join(",") + ")scale(" + d3.event.scale + ")");

        g.selectAll("path")
            .attr("d", path.projection(projection));
        g.selectAll("circle")
            .attr("r", calcScale());

    }
    var zoom = d3.behavior.zoom()
        .scaleExtent([1, Number.POSITIVE_INFINITY])
        .on("zoom", zoomFn);

    /* activates zooming behaviour */
    svg.call(zoom);

})();