var worldmap = (function () {
    var exports = {};
    d3.select(window).on("resize", throttle);

    var zoom = d3.behavior.zoom()
        .scaleExtent([1, Number.POSITIVE_INFINITY])
        .on("zoom", move);

    /*
     * Colors
     */


    // Setting color domains(intervals of values) for our map - amount of alcohol consumtion
    var ext_color_domain = [.00, 2.5, 5.0, 7.5, 10];
    var ext_color_domain2 = [.00, 10, 50, 100, 200];
    var sort = 2

    var color = d3.scale.threshold()
        .domain(ext_color_domain)
        .range(["#f2f0f7", "#dadaeb", "#bcbddc", "#9e9ac8", "#756bb1", "#54278f"]);

    var ufo;
    var bigfoot;
    var unemploymentData; // will hold the data of unemployement

    var utils;
    (function (utils) {
        utils.getWidth = function () {
            return document.getElementById('container').offsetWidth;
        };

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

        // first load everything and than draw

        if (sort == 1)

            queue()
                .defer(d3.json, "datasets/world-topo-min.json")
                .defer(d3.csv, "datasets/Alcohol_Consumption_Per_Country.csv")
                //.defer(d3.csv, "datasets/populationdensity.csv")
                .await(ready)
        else
            queue()
                .defer(d3.json, "datasets/world-topo-min.json")
                //.defer(d3.csv, "datasets/Alcohol_Consumption_Per_Country.csv")
                .defer(d3.csv, "datasets/populationdensity.csv")
                .await(ready);


        //Adding legend for our Choropleth
        var legend_labels = ["< .00", "2.5+", "5.0+", "7.0+", "10+"]

        var legend_labels2 = ["< 0.00", "10", "50", "100", "200"]


        var legend = svg.selectAll("g.legend")
            .data(ext_color_domain)
            .enter().append("g")
            .attr("class", "legend");

        var ls_w = 20, ls_h = 20;

        legend.append("rect")
            .attr("x", 20)
            .attr("y", function (d, i) {
                return height - (i * ls_h) - 2 * ls_h;
            })
            .attr("width", ls_w)
            .attr("height", ls_h)
            .style("fill", function (d, i) {
                return color(d);
            })
            .style("opacity", 0.8);

        legend.append("text")
            .attr("x", 50)
            .attr("y", function (d, i) {
                return height - (i * ls_h) - ls_h - 4;
            })
            .text(function (d, i) {
                if (sort == 1)
                    return legend_labels[i]
                else
                    return legend_labels2[i]
            });

    }

    function ready(error, world, liters) {

        var rateById = {}; // will hold the liters per alcohol adult consumption

        if (sort == 1)
            liters.forEach(function (d) {
                rateById[d.Location] = +d["Liters per capita pure alcohol adult consumption"]
            })
        else
            liters.forEach(function (d) {
                rateById[d.Location] = +d["2012"]
            });


        console.log("rate", rateById)
        var countries = topojson.feature(world, world.objects.countries).features;
        topo = countries;

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
            .style("fill", function (d) {

                var rate = rateById[d.properties.name];

                if (rate !== undefined)
                    return color(rate)
                else
                    return "White"

            })

        ;

        //offsets for tooltips
        var offsetL = document.getElementById('container').offsetLeft + 20;
        var offsetT = document.getElementById('container').offsetTop + 10;


        //tooltips
        country
            .on("mousemove", function (d, i) {

                var mouse = d3.mouse(svg.node()).map(function (d) {
                    return parseInt(d);
                });

                var amountOfLiters = rateById[d.properties.name];
                if (amountOfLiters == undefined)  // if it is not defined this is the default
                    rateById[d.properties.name] = "Unknown";

                tooltip.classed("hidden", false)
                    .attr("style", "left:" + (mouse[0] + offsetL) + "px;top:" + (mouse[1] + offsetT) + "px")
                    .html(d.properties.name + "\n - Amount of Liters: " + rateById[d.properties.name]);

            })
            .on("mouseout", function (d, i) {
                tooltip.classed("hidden", true);
            })
        ;


        //EXAMPLE: adding some capitals  rom external CSV file
        d3.csv("datasets/country-capitals.csv", function (err, capitals) {

            capitals.forEach(function (i) {
                addpoint(i.CapitalLongitude, i.CapitalLatitude, i.CapitalName);
            });

        });

    };


    //draw brush and ufo
    d3.json("datasets/UfoGeojson.json", function (error, data) {
        drawUfos(data);
        setupBrush(data);
    });
    d3.json("datasets/bigfootfiltered.geojson", function (error, data) {
       // drawBigfoot(data);
        //setupBrush(data);
    });


    function setupBrush(data) {
        /* Creation of Brush */
        var margin = {top: 30, right: 15, bottom: 20, left: 15},
            width = document.getElementById('container').offsetWidth ,
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

        var svg = d3.select("#brush").append("svg")
            .attr("width", width + margin.left + margin.right )
            .attr("height", height + margin.top + margin.bottom).attr("class", "brushelement")
            ;

        svg.append("defs").append("clipPath")
            .attr("id", "clip")
            .append("rect")
            .attr("width", width)
            .attr("height", height);

        var context = svg.append("g")
            .attr("class", "context")
            .attr("transform", "translate(" + 20 + "," + margin.top + ")")
            ;

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
                .attr("d", area2)
                .attr("class", "ufoColor")

            context.append("g")
                .attr("class", "x axis")
                .attr("transform", "translate(00," + height + ")")
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
                .attr("class", "circles")
                .attr("cx", function (d) {
                    return projection([d.geometry.coordinates[0], d.geometry.coordinates[1]])[0];
                })
                .attr("cy", function (d) {
                    return projection([d.geometry.coordinates[0], d.geometry.coordinates[1]])[1];
                })
                .attr("class", "UfoColor")
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
            .attr("class", "ufoColor")
            .attr("r", scaleFactor);
    }

    function drawBigfoot(data) {
        bigfoot = g.append("g")
        bigfoot.selectAll("circle")
            .data(data.features)
            .enter()
            .append("circle")
            .attr("cx", function (d) {
                return projection([d.geometry.coordinates[0], d.geometry.coordinates[1]])[0];
            })
            .attr("cy", function (d) {
                return projection([d.geometry.coordinates[0], d.geometry.coordinates[1]])[1];
            })
            .attr("class", "bigfootColor")
            .attr("r", scaleFactor);
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

    /* filtering with checkboxes */
    function checkboxFilteringUfo(ufoChecked) {
        (ufoChecked) ?
            d3.json("datasets/UfoGeojson.json", function (error, data) {
                drawUfos(data);
            }) :
            ufo.selectAll("circle").remove();
    }

    function checkboxFilteringBigfood(bigfoodChecked) {
        (bigfoodChecked) ?
            d3.json("datasets/bigfootfiltered.geojson", function (error, data) {
                drawBigfoot(data);
            }) :
            bigfoot.selectAll("circle").remove();
    }

    exports.checkboxFilteringUfo = checkboxFilteringUfo;
    exports.checkboxFilteringBigfood = checkboxFilteringBigfood;
    return exports;
})();
