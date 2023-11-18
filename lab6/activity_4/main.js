// Load the data
d3.csv('cars.csv').then(function(data) {
    // Convert string values to numbers
    data.forEach(function(d) {
        d.cylinders = +d.cylinders;
        d['power (hp)'] = +d['power (hp)'];
    });

    // Set up initial attributes for scatterplot
    var xAttribute = 'cylinders';
    var yAttribute = 'power (hp)';

    // Create dropdown options
    var attributeOptions = ['cylinders', 'power (hp)'];

    // Create X and Y dropdowns
    d3.select('#x-axis-select')
        .selectAll('option')
        .data(attributeOptions)
        .enter()
        .append('option')
        .attr('value', function(d) { return d; })
        .text(function(d) { return d; });

    d3.select('#y-axis-select')
        .selectAll('option')
        .data(attributeOptions)
        .enter()
        .append('option')
        .attr('value', function(d) { return d; })
        .text(function(d) { return d; });

    // Set up scales and axes for scatterplot
    var margin = { top: 20, right: 20, bottom: 40, left: 40 };
    var width = 400 - margin.left - margin.right;
    var height = 400 - margin.top - margin.bottom;

    var xScale = d3.scaleLinear().range([0, width]);
    var yScale = d3.scaleLinear().range([height, 0]);

    var xAxis = d3.axisBottom(xScale);
    var yAxis = d3.axisLeft(yScale);

    // Set up scales and axes for bar chart
    var barWidth = 30;

    var xBarScale = d3.scaleBand().range([0, width]).padding(0.1);
    var yBarScale = d3.scaleLinear().range([height, 0]);

    var xAxisBar = d3.axisBottom(xBarScale);
    var yAxisBar = d3.axisLeft(yBarScale);

     // Create SVG containers for scatterplot and bar chart
     var scatterplotSvg = d3.select('#chart-svg')
     .attr('width', width * 2 + margin.left + margin.right)
     .attr('height', height + margin.top + margin.bottom)
     .append('g')
     .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

    var barChartSvg = d3.select('#chart-svg')
    .attr('width', width * 2 + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
     .append('g')
     .attr('transform', 'translate(' + (width + margin.left + barWidth) + ',' + margin.top + ')');

    // Add brushes for both scatterplot and bar chart
    var brush = d3.brush()
    .extent([[0, 0], [width, height]])
    .on("start", brushstart)
    .on("brush", brushmove)
    .on("end", brushend);

    scatterplotSvg.append('g')
    .attr('class', 'brush')
    .call(brush);

    barChartSvg.append('g')
    .attr('class', 'brush')
    .call(brush);

    // Initialize scatterplot and bar chart
    updateScatterplot();
    updateBarChart();

    // Event listeners for dropdown changes
    d3.select('#x-axis-select').on('change', function() {
        xAttribute = this.value;
        updateScatterplot();
        updateBarChart();
    });

    d3.select('#y-axis-select').on('change', function() {
        yAttribute = this.value;
        updateScatterplot();
        updateBarChart();
    });

    // Function to update scatterplot
    function updateScatterplot() {
        // Update scales
        xScale.domain(d3.extent(data, function(d) { return d[xAttribute]; }));
        yScale.domain(d3.extent(data, function(d) { return d[yAttribute]; }));

        // Update axes
        scatterplotSvg.select('.x-axis').remove();
        scatterplotSvg.select('.y-axis').remove();

        scatterplotSvg.append('g')
            .attr('class', 'x-axis')
            .attr('transform', 'translate(0,' + height + ')')
            .call(xAxis);

            scatterplotSvg.append('g')
            .attr('class', 'y-axis')
            .call(yAxis);

        // Update circles
        var circles = scatterplotSvg.selectAll('circle')
            .data(data);

        circles.enter()
            .append('circle')
            .attr('r', 5)
            .merge(circles)
            .attr('cx', function(d) { return xScale(d[xAttribute]); })
            .attr('cy', function(d) { return yScale(d[yAttribute]); })
            .attr('fill', 'steelblue');

        circles.exit().remove();
    }

    // Function to update bar chart
    function updateBarChart() {
        // // Update scales
        // xBarScale.domain(data.map(function(d) { return d.cylinders; }));
        // yBarScale.domain([0, d3.max(Array.from(cylindersCount.values()))]);

        // // Update axes
        // barChartSvg.select('.x-axis-bar').remove();
        // barChartSvg.select('.y-axis-bar').remove();

        // barChartSvg.append('g')
        //     .attr('class', 'x-axis-bar')
        //     .attr('transform', 'translate(' + (width + barWidth) + ',' + height + ')')
        //     .call(xAxisBar);

        //     barChartSvg.append('g')
        //     .attr('class', 'y-axis-bar')
        //     .call(yAxisBar);

        // // Update bars
        // var bars = barChartSvg.selectAll('.bar')
        //     .data(data);

        // bars.enter()
        //     .append('rect')
        //     .attr('class', 'bar')
        //     .merge(bars)
        //     .attr('x', function(d) { return xBarScale(d.cylinders); })
        //     .attr('y', function(d) { return yBarScale(d['power (hp)']); })
        //     .attr('width', xBarScale.bandwidth())
        //     .attr('height', function(d) { return height - yBarScale(d['power (hp)']); })
        //     .attr('fill', 'steelblue');

        // bars.exit().remove();

    // Sort data by cylinders in ascending order
    data.sort(function(a, b) {
        return a.cylinders - b.cylinders;
    });

    var cylindersCount = d3.rollup(data, v => v.length, d => d.cylinders);

            // Update scales
    xBarScale.domain(Array.from(cylindersCount.keys()));
    yBarScale.domain([0, d3.max(Array.from(cylindersCount.values()))]);

    // Update axes
    barChartSvg.select('.x-axis-bar').remove();
    barChartSvg.select('.y-axis-bar').remove();

    barChartSvg.append('g')
        .attr('class', 'x-axis-bar')
        .attr('transform', 'translate(0,' + height + ')')
        .call(xAxisBar);

    barChartSvg.append('g')
        .attr('class', 'y-axis-bar')
        .call(yAxisBar);

    // Update bars
    var bars = barChartSvg.selectAll('.bar')
        .data(Array.from(cylindersCount.entries()), d => d[0]);

    bars.enter()
        .append('rect')
        .attr('class', 'bar')
        .merge(bars)
        .attr('x', function(d) { return xBarScale(d[0]); })
        .attr('y', function(d) { return yBarScale(d[1]); })
        .attr('width', xBarScale.bandwidth())
        .attr('height', function(d) { return height - yBarScale(d[1]); })
        .attr('fill', 'steelblue');

    bars.exit().remove();
    }

    // Function to update brushes
    function updateBrush(event) {
        // Get the selected range
        var selectedRange = event.selection;

        // Update scatterplot circles based on the selected range
        var selectedDataScatterplot = [];
        if (selectedRange) {
            selectedDataScatterplot = data.filter(function(d) {
                return (
                    d[xAttribute] >= xScale.invert(selectedRange[0][0]) &&
                    d[xAttribute] <= xScale.invert(selectedRange[1][0]) &&
                    d[yAttribute] >= yScale.invert(selectedRange[1][1]) &&
                    d[yAttribute] <= yScale.invert(selectedRange[0][1])
                );
            });
        }

        // Update bar chart bars based on the selected range
        var selectedDataBarChart = [];
        if (selectedRange) {
            selectedDataBarChart = data.filter(function(d) {
                return (
                    d.cylinders >= xBarScale.invert(selectedRange[0][0]) &&
                    d.cylinders <= xBarScale.invert(selectedRange[1][0])
                );
            });
        }

        // Update scatterplot
        scatterplotSvg.selectAll('circle')
            .classed('highlighted', function(d) {
                return selectedDataScatterplot.indexOf(d) !== -1;
            });

        // Update bar chart
        barChartSvg.selectAll('.bar')
            .classed('highlighted', function(d) {
                return selectedDataBarChart.indexOf(d) !== -1;
            });
    }
});

// ********* Your event listener functions go here *********//
function brushstart(event, cell) {
    // cell is the SplomCell object

    // Check if this g element is different than the previous brush
    if(brushCell !== this) {

        // Clear the old brush
        brush.move(d3.select(brushCell), null);

        // Update the global scales for the subsequent brushmove events
        xScale.domain(extentByAttribute[cell.x]);
        yScale.domain(extentByAttribute[cell.y]);

        // Save the state of this g element as having an active brush
        brushCell = this;
    }
}

function brushmove(event, cell) {
    // cell is the SplomCell object

    // Get the extent or bounding box of the brush event, this is a 2x2 array
    var e = event.selection;
    if(e) {

        // Select all .dot circles, and add the "hidden" class if the data for that circle
        // lies outside of the brush-filter applied for this SplomCells x and y attributes
        svg.selectAll(".dot")
            .classed("hidden", function(d){
                return e[0][0] > xScale(d[cell.x]) || xScale(d[cell.x]) > e[1][0]
                    || e[0][1] > yScale(d[cell.y]) || yScale(d[cell.y]) > e[1][1];
            })
    }
}

function brushend(event) {
    // If there is no longer an extent or bounding box then the brush has been removed
    if(!event.selection) {
        // Bring back all hidden .dot elements
        svg.selectAll('.hidden').classed('hidden', false);
        // Return the state of the active brushCell to be undefined
        brushCell = undefined;
    }
}