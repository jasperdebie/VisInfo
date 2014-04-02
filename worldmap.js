(function () {
    d3.select(window).on("resize", throttle);

    var zoom = d3.behavior.zoom()
        .scaleExtent([1, Number.POSITIVE_INFINITY])
        .on("zoom", move);


    var ufo;
    var utils;
    (function(utils) {
        utils.getWidth = function() { return document.getElementById('container').offsetWidth; };

    })(utils || (utils = {}));

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

    var width = document.getElementById('container').offsetWidth;
    var height = width / 2;

    var topo, projection, path, svg, g;

    var graticule = d3.geo.graticule();

    var tooltip = d3.select("#container").append("div").attr("class", "tooltip hidden");

    setup(width, height);

    function setup(width, height) {
        projection = d3.geo.mercator()
            .translate([(width / 2), (height / 2)])
            .scale(width / 2 / Math.PI);

        path = d3.geo.path().projection(projection);

        svg = d3.select("#container").append("svg")
            .attr("width", width)
            .attr("height", height)
            .call(zoom)
            .on("click", click);

        g = svg.append("g");
    }

    d3.json("datasets/world-topo-min.json", function (error, world) {

        var countries = topojson.feature(world, world.objects.countries).features;
        topo = countries;
        draw(topo);

        d3.json("datasets/UfoGeojson.json", function (error, data) {
            drawUfos(data);
            setupBrush(data);
        });


    });

    function setupBrush(data) {
        /* Creation of Brush */
        var margin = {top: 30, right: 10, bottom: 20, left: 10},
            width = utils.getWidth() - margin.left - margin.right,
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


            ufo.selectAll("circle").remove();
            ufo.selectAll("circle")
                .data(data.features.filter(function (d, i) {
                    if (begindatum <= parseInt(d.properties.year) && parseInt(d.properties.year) <= einddatum) {
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
    }

    function drawUfos(data) {
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
    }

    function draw(topo) {

        svg.append("path")
            .datum(graticule)
            .attr("class", "graticule")
            .attr("d", path);


        g.append("path")
            .datum({type: "LineString", coordinates: [
                [-180, 0],
                [-90, 0],
                [0, 0],
                [90, 0],
                [180, 0]
            ]})
            .attr("class", "equator")
            .attr("d", path);


        var country = g.selectAll(".country").data(topo);

        country.enter().insert("path")
            .attr("class", "country")
            .attr("d", path)
            .attr("id", function (d, i) {
                return d.id;
            })
            .attr("title", function (d, i) {
                return d.properties.name;
            })
            .style("fill", function (d, i) {
                return "green";
            });

        //offsets for tooltips
        var offsetL = document.getElementById('container').offsetLeft + 20;
        var offsetT = document.getElementById('container').offsetTop + 10;

        //tooltips
        country
            .on("mousemove", function (d, i) {

                var mouse = d3.mouse(svg.node()).map(function (d) {
                    return parseInt(d);
                });

                tooltip.classed("hidden", false)
                    .attr("style", "left:" + (mouse[0] + offsetL) + "px;top:" + (mouse[1] + offsetT) + "px")
                    .html(d.properties.name);

            })
            .on("mouseout", function (d, i) {
                tooltip.classed("hidden", true);
            });


        //EXAMPLE: adding some capitals from external CSV file
        d3.csv("datasets/country-capitals.csv", function (err, capitals) {

            capitals.forEach(function (i) {
                addpoint(i.CapitalLongitude, i.CapitalLatitude, i.CapitalName);
            });

        });

    }


    function redraw() {
        width = document.getElementById('container').offsetWidth;
        height = width / 2;
        d3.select('svg').remove();
        setup(width, height);
        draw(topo);
    }


    function move() {

        var t = d3.event.translate;
        var s = d3.event.scale;
        zscale = s;
        var h = height / 4;


        t[0] = Math.min(
            (width / height) * (s - 1),
            Math.max(width * (1 - s), t[0])
        );

        t[1] = Math.min(
            h * (s - 1) + h * s,
            Math.max(height * (1 - s) - h * s, t[1])
        );

        zoom.translate(t);
        g.attr("transform", "translate(" + t + ")scale(" + s + ")");

        //adjust the country hover stroke width based on zoom level
        d3.selectAll(".country").style("stroke-width", 1.5 / s);

        g.selectAll("circle")
            .attr("r", calcScale());

    }


    var throttleTimer;

    function throttle() {
        window.clearTimeout(throttleTimer);
        throttleTimer = window.setTimeout(function () {
            redraw();
        }, 200);
    }


//geo translation on mouse click in map
    function click() {
        var latlon = projection.invert(d3.mouse(this));
        console.log(latlon);
    }


//function to add points and text to the map (used in plotting capitals)
    function addpoint(lat, lon, text) {

        var gpoint = g.append("g").attr("class", "gpoint");
        var x = projection([lat, lon])[0];
        var y = projection([lat, lon])[1];

        gpoint.append("svg:circle")
            .attr("cx", x)
            .attr("cy", y)
            .attr("class", "point")
            .attr("r", 1.5);

        //conditional in case a point has no associated text
        if (text.length > 0) {

            gpoint.append("text")
                .attr("x", x + 2)
                .attr("y", y + 2)
                .attr("class", "text")
                .text(text);
        }

    }
})();