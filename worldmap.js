/***
 * Jasper Debie, Jochen François, Michael Lippens, Ayrton Vercruysse
 * 2014
 */

var worldmap = (function () {
    var exports = {};
    var country;
    var begindatum = 1950;
    var einddatum = 2010;



    //offsets for tooltips
    var offsetL = document.getElementById('container').offsetLeft + 20;
    var offsetT = document.getElementById('container').offsetTop + 10;

    d3.select(window).on("resize", throttle);

    var zoom = d3.behavior.zoom()
        .scaleExtent([1, Number.POSITIVE_INFINITY])
        .on("zoom", move);




    var ufoDescriptor = {
        descriptor: function(d) {
            return "City: "+ d.properties.city+
                "<br>Year: "+ d.properties.year+
                "<br>Date Sighted: "+ d.properties.sighted+
                "<br>Date Reported: "+ d.properties.reported;


        },
        colorClass: "ufoColor",
        header: "Info UFO",
        group: "ufo"
    };

    var bigfootDescriptor = {
        descriptor: function(d) {
            return "Name: " +d.properties.Name+
                "<br>Description: <a href=" +d.properties.Description +">Details"+ "</a>"+
                "<br>Year: "+ d.properties.year;
        },
        colorClass: "bigfootColor",
        header: "Info Bigfoot",
        group: "bigfoot"
    };

    var meteoriteDescriptor = {
        descriptor: function(d) {
            return "Place: " + d.properties.name +
                "<br> Mass: " + d.properties.mass +
                "<br> Year: "+ d.properties.year;
        },
        header: "Info meteorite",
        colorClass: "meteoriteColor",
        group: "meteorite"
    };

    var airportDescriptor = {
        descriptor: function(d) {
            return "Code:" + d.properties.airport_code +
                "<br> Name: "+ d.properties.airport_name;
        },
        header: "Info airport",
        colorClass: "bigfootColor",
        group: "airport"
    };

    //keeps the groups (svg) of different datasets. to avoid global cluttering
    var datasets = {};


    /*
     * Colors
     */


    // Setting color domains(intervals of values) for our map - amount of alcohol consumtion
    var ext_color_domain;//  = [.00, 2.5, 5.0, 7.5, 10];
    var legend_labels;//  = ["< .00", "2.5+", "5.0+", "7.0+", "10+"];
    var color;// = d3.scale.threshold()
        //.domain(ext_color_domain)
        //.range(["#f2f0f7", "#dadaeb", "#bcbddc", "#9e9ac8", "#756bb1", "#54278f"]);
    var sort = 1;
    setLegend();



    $(function(){
        $("input[name='optionsRadios']").on("click", function(e){
            var newsort = parseInt($(this).val());
            sort = newsort;
            setLegend();
            drawLegend();
            colorMap();
        });
    });





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
    };

    var width = document.getElementById('container').offsetWidth;
    var height = width / 2;

    var topo, projection, path, svg, g;

    var graticule = d3.geo.graticule();

    var tooltip = d3.select("#container").append("div").attr("class", "tooltip hidden");


    function setLegend(){
            switch(sort) {
            case 1:
                ext_color_domain = [.00, 2.5, 5.0, 7.5, 10];
                legend_labels = ["< .00", "2.5+", "5.0+", "7.0+", "10+"];
                break;
            case 2:
                ext_color_domain = [10, 50,70 , 100, 150];
                legend_labels = ["< 10", "50+", "70+", "100+", "150+"];
                break;
            case 3:
                ext_color_domain = [.00, 2.5, 5.0, 7.5, 10];
                legend_labels = ["< .00", "2.5+", "5.0+", "7.5+", "10+"];
                break;
            case 4:
                ext_color_domain = [60, 70, 80 ,90, 100];
                legend_labels = ["< 60", "70+", "80+", "90+", "100+"];
                break;
            case 5:
                ext_color_domain = [.50, .60, .70, .80, .90];
                legend_labels = ["< .50", ".60+", ".70+", ".80+", ".90+"];
                break;
            default:
                queue().await(ready);
        }
        color = d3.scale.threshold()
        .domain(ext_color_domain)
        .range(["#c7e9c0", "#a1d99b", "#74c476", "#41ab5d", "#238b45", "#006d2c"]);

    }


    
    setup(width, height);

    function setupMap() {
        queue()
            .defer(d3.json, "datasets/world-topo-min.json")
            .await(function(error, world) {

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

                country = g.selectAll(".country").data(topo);
                colorMap();
        });

    }

    function colorMap() {
        var readyOpts;
        var callback = function(){
            ready.apply(null, [].concat(Array.prototype.slice.call(arguments), [readyOpts]));
        };



        // first load everything and than draw
        switch(sort) {
            case 1:
                queue().await(callback);
                break;
            case 2:
                readyOpts = {"location": "Location", "column": "2012"};
                queue()
                    .defer(d3.csv, "datasets/populationdensity.csv")
                    .await(callback);
                break;
            case 3:
                readyOpts = {"location": "Location", "column": "Liters"};
                queue()
                    .defer(d3.csv, "datasets/Alcohol_Consumption_Per_Country.csv")
                    .await(callback);
                break;
            case 4:
                readyOpts = {"location": "Country", "column": "IQ"};
                queue()
                    .defer(d3.csv, "datasets/IQ.csv")
                    .await(callback);
                break;
            case 5:
                readyOpts = {"location": "Location", "column": "HDI"};
                console.log(readyOpts);
                queue()
                    .defer(d3.csv, "datasets/HDI.csv")
                    .await(callback);
                break;
            default:
                queue().await(ready);
        }
    }

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


        setupMap();
        drawLegend();



        //Adding legend for our Choropleth
        //var legend_labels = ["< .00", "2.5+", "5.0+", "7.0+", "10+"];
        //var legend_labels2 = ["< 0.00", "10", "50", "100", "200"];
    }

    var legend=undefined;
    function drawLegend(){

        if(legend===undefined)
        {
            legend = svg.selectAll("g.legend")

        }
        legend
            .data(ext_color_domain)
            .enter().append("g")

            .attr("class", "legend");



        var ls_w = 20, ls_h = 20;

        legend.selectAll("rect").remove();
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

        legend.selectAll("text").remove();


        legend.append("text")
            .attr("x", 50)
            .attr("y", function (d, i) {
                return height - (i * ls_h) - ls_h - 4;
            })

            .text(function (d, i) {
                return legend_labels[i]
            })

        ;

    }

    function ready(error, dataset, opts) {
        var default_mapcolor = "#808080";
        if (error !== null) {
            throw new Error(error);
        }

        var rateById = {}; // will hold the detailed info for a dataset
        console.log(arguments);
        if (typeof dataset !== 'undefined') {
            dataset.forEach(function (d) {
                rateById[d[opts.location]] = +d[opts.column];

            });
        }

        country.enter().insert("path")
            .attr("class", "country")
            .attr("d", path)
            .attr("id", function (d) {
                return d.id;
            })
            .attr("title", function (d, i) {
                return d.properties.name;
            })
            .style("fill", function (d) {

                var rate = rateById[d.properties.name];

                if (typeof rate !== 'undefined') {
                    return color(rate);
                } else {
                    return default_mapcolor;
                }
            });




        var tooltipsVisible = false;
        //tooltips
        country.on("mousemove", function (d, i) {

            $("#extraData").text(getExtraText(d));

            var infoHeader = "Info ";
            switch(sort) {
                case 1:
                    infoHeader +="Country ";
                    break;
                case 2:
                    infoHeader +="Population";
                    break;
                case 3:
                    infoHeader +="Alcohol Consumption";
                    break;
                case 4:
                    break;
                case 5:
                    break;
                default:
                    infoHeader ="";
            }
            $("#extraDataHeader").text(infoHeader);


        })


            .on("mouseout", function (d, i) {
                tooltip.classed("hidden", true);
                $("#extraData").text("");
                $("#extraDataHeader").text("");


            })
            .on("click", function (d, i) {
                if(tooltipsVisible==false)
                {
                    var mouse = d3.mouse(svg.node()).map(function (d) {
                        return parseInt(d);
                    });
                    tooltip.classed("hidden", false)
                        .attr("style", "left:" + (mouse[0] + offsetL) + "px;top:" + (mouse[1] + offsetT) + "px")
                        .html(getExtraText(d));


                    tooltipsVisible=true;
                }
                else{
                    tooltip.classed("hidden",true);
                    tooltipsVisible=false;
                }


            });

        function getExtraText(d)
        {
            var detailVal = rateById[d.properties.name];
            if (detailVal == undefined)  // if it is not defined this is the default
                detailVal = "Unknown";


            var prefixText = "\n - ";  // prefix text for a property
            var numberOfDecimals = 2; // specifies the amount of decimals for the value
            // determine extra info based on selected item
            switch(sort) {
                case 1:
                    prefixText ="";
                    break;
                case 2:
                    prefixText +="Population: ";
                    detailVal = parseFloat(detailVal).toFixed(numberOfDecimals);
                    break;
                case 3:
                    prefixText +="Amount of Liters: ";
                    detailVal = parseFloat(detailVal).toFixed(numberOfDecimals);
                    break;
                case 4:
                    break;
                case 5:
                    break;
                default:
                    prefixText ="";
            }

            if(prefixText=="") // no detail info when the neutral map is chosen
            {
                detailVal = "";
            }

            return d.properties.name + prefixText + detailVal;

        }
    }

    //draw brush and ufo
    d3.json("datasets/new_ufos.json", function (error, ufodata) {
        drawDataset(ufodata, ufoDescriptor);
        $("#circleUfo").addClass("circleUfo");

        d3.json("datasets/bigfootfiltered.geojson", function (error, bigfootData) {
            d3.json("datasets/meteorites.json", function (error, meteorietdata) {
                setupBrush(ufodata,bigfootData, meteorietdata);
            });

        });
    });




    function setupBrush(ufodata, bigfootdata, meteorietdata) {
        /* Creation of Brush */
        var margin = {top: 30, right: 15, bottom: 20, left: 15},
            width = document.getElementById('container').offsetWidth -4,
            height = 100 - margin.top - margin.bottom;

        /* Get the correct form for data */
        var parseDate = d3.time.format("%Y").parse;


        var x = d3.time.scale().range([0, width- ( margin.left + margin.right  )]), // type scale
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
            .attr("width", width  )
            .attr("height", height + margin.top + margin.bottom)
                .attr("class", "brushelement");

        svg.append("defs").append("clipPath")
            .attr("id", "clip")
            .append("rect")
            .attr("width", width - ( margin.left + margin.right +40 ))
            .attr("height", height);

        var context = svg.append("g")
            .attr("class", "context")
            .attr("transform", "translate(" + 20 + "," + margin.top + ")");

        d3.json("datasets/bigfootbrush.json", function (error, brushdata) {
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
                .attr("class", "bigfootColor");

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

        d3.json("datasets/meteorietbrush.json", function (error, brushdata) {
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
                .attr("class", "meteoriteColor");

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

        d3.json("datasets/ufobrush.json", function (error, brushdata) {
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
                .attr("class", "ufoColor");

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
            begindatum = parseInt(new Date(brush.extent()[0]).getFullYear()) || 1950;
            einddatum = parseInt(new Date(brush.extent()[1]).getFullYear()) || 2010;

            if($(chkUfoSpotting).prop('checked')){
            datasets.ufo.selectAll("circle").remove();
            datasets.ufo.selectAll("circle")
                .data(ufodata.features.filter(function (d, i) {
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
                .attr("class", "ufoColor")
                .attr("r", calcScale())
                .on("mouseout", function (d) {
                    tooltip.classed("hidden", true);
                    $("#extraData").text("");
                })
                .on("mousemove", function (d) {

                    $("#extraDataHeader").text(ufoDescriptor.header);

                    $("#extraData").html(ufoDescriptor.descriptor(d));

                })
                .on("click", function (d, i) {
                    if(tooltipsVisible==false)
                    {
                        var mouse = d3.mouse(svg.node()).map(function (d) {
                            return parseInt(d);
                        });
                        var textValue = ufoDescriptor.descriptor(d);

                        tooltip.classed("hidden", false)
                            .attr("style", "left:" + (mouse[0] + offsetL) + "px;top:" + (mouse[1] + offsetT) + "px")
                            .html(textValue);


                        tooltipsVisible=true;
                    }
                    else{
                        tooltip.classed("hidden",true);
                        tooltipsVisible=false;
                    }
                });
            }

            if($(chkBigfootSpotting).prop('checked')){
                datasets.bigfoot.selectAll("circle").remove();
                datasets.bigfoot.selectAll("circle")
                    .data(bigfootdata.features.filter(function (d, i) {
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
                    .attr("class", "bigfootColor")
                    .attr("r", calcScale())
                    .on("mouseout", function (d) {
                        tooltip.classed("hidden", true);
                        $("#extraData").text("");
                    })
                    .on("mousemove", function (d) {

                        $("#extraDataHeader").text(bigfootDescriptor.header);

                        $("#extraData").html(bigfootDescriptor.descriptor(d));

                    })
                    .on("click", function (d, i) {
                        if(tooltipsVisible==false)
                        {
                            var mouse = d3.mouse(svg.node()).map(function (d) {
                                return parseInt(d);
                            });
                            var textValue = bigfootDescriptor.descriptor(d);

                            tooltip.classed("hidden", false)
                                .attr("style", "left:" + (mouse[0] + offsetL) + "px;top:" + (mouse[1] + offsetT) + "px")
                                .html(textValue);


                            tooltipsVisible=true;
                        }
                        else{
                            tooltip.classed("hidden",true);
                            tooltipsVisible=false;
                        }
                    });
            }

            if($(chkMeteorites).prop('checked')){
                datasets.meteorite.selectAll("circle").remove();
                datasets.meteorite.selectAll("circle")
                    .data(meteorietdata.features.filter(function (d, i) {
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
                    .attr("class", "meteoriteColor")
                    .attr("r", calcScale())
                    .on("mouseout", function (d) {
                        tooltip.classed("hidden", true);
                        $("#extraData").text("");
                    })
                    .on("mousemove", function (d) {

                        $("#extraDataHeader").text(meteoriteDescriptor.header);

                        $("#extraData").html(meteoriteDescriptor.descriptor(d));

                    })
                    .on("click", function (d, i) {
                        if(tooltipsVisible==false)
                        {
                            var mouse = d3.mouse(svg.node()).map(function (d) {
                                return parseInt(d);
                            });
                            var textValue = meteoriteDescriptor.descriptor(d);

                            tooltip.classed("hidden", false)
                                .attr("style", "left:" + (mouse[0] + offsetL) + "px;top:" + (mouse[1] + offsetT) + "px")
                                .html(textValue);


                            tooltipsVisible=true;
                        }
                        else{
                            tooltip.classed("hidden",true);
                            tooltipsVisible=false;
                        }
                    });
            }

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



    function drawDataset(data, opts) {
        var tooltipsVisible = false;
        datasets[opts.group] = g.append("g");
        var dataset = datasets[opts.group];
        dataset.selectAll("circle")
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
            .attr("class", opts.colorClass)
            .attr("r", scaleFactor)
            .on("mouseout", function (d) {
                tooltip.classed("hidden", true);
                $("#extraData").text("");
            })
            .on("mousemove", function (d) {

                $("#extraDataHeader").text(opts.header);

                $("#extraData").html(opts.descriptor(d));

            })
            .on("click", function (d, i) {
                if(tooltipsVisible==false)
                {
                    var mouse = d3.mouse(svg.node()).map(function (d) {
                        return parseInt(d);
                    });
                    var textValue = opts.descriptor(d);

                    tooltip.classed("hidden", false)
                        .attr("style", "left:" + (mouse[0] + offsetL) + "px;top:" + (mouse[1] + offsetT) + "px")
                        .html(textValue);


                    tooltipsVisible=true;
                }
                else{
                    tooltip.classed("hidden",true);
                    tooltipsVisible=false;
                }
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

    /* filtering with checkboxes */
    function checkboxFilteringUfo(ufoChecked) {
        if(ufoChecked)
        {
            d3.json("datasets/new_ufos.json", function (error, data) {
                drawDataset(data, ufoDescriptor);
            });
        }
        else{
            datasets.ufo.selectAll("circle").remove();
        }

    }

    function checkboxFilteringBigfoot(bigfootchecked) {
        if(bigfootchecked)
        {

            d3.json("datasets/bigfootfiltered.geojson", function (error, data) {
                drawDataset(data, bigfootDescriptor);
            })
        }
        else
        {

            datasets.bigfoot.selectAll("circle").remove();

        }
    }

    function checkboxFilteringMeteorites(meteoritesChecked) {
        if (meteoritesChecked) {

            d3.json("datasets/meteorites.json", function(error, data) {
                drawDataset(data, meteoriteDescriptor);
            });
        }
        else{
            //datasets.bigfoot.selectAll("circle").remove();
            datasets.meteorite.selectAll("circle").remove();
        }
    }



    exports.checkboxFilteringUfo = checkboxFilteringUfo;
    exports.checkboxFilteringBigfood = checkboxFilteringBigfoot;
    exports.checkboxFilteringMeteorites = checkboxFilteringMeteorites;
    return exports;
})();
