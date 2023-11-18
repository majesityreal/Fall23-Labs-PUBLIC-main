var svg = d3.select('svg');

// Get layout parameters
var svgWidth = +svg.attr('width');
var svgHeight = +svg.attr('height');

var padding = {t: 40, r: 40, b: 40, l: 40};
var cellPadding = 10;

// Choose the specific attributes for the scatterplot
var scatterXAttr = 'power (hp)';
var scatterYAttr = 'cylinders';

var barXAttr = 'count';
var barYAttr = 'cylinders';

var countByCylinders;
var extentBarchartXAttr = {};
var extentBarchartYAttr = {};

// Create a group element for appending chart elements
var chartG = svg.append('g')
    .attr('transform', 'translate('+[padding.l, padding.t]+')');

var dataAttributes = ['power (hp)', 'cylinders', 'economy (mpg)', '0-60 mph (s)', 'count'];
var N = 1;

// Compute chart dimensions
var cellWidth = (svgWidth - padding.l - padding.r) / 2;
var cellHeight = (svgHeight - padding.t - padding.b) / 2;

// Global x and y scales to be used for all scatterCells
var xScale = d3.scaleLinear().range([0, cellWidth - cellPadding]);
var yScale = d3.scaleLinear().range([cellHeight - cellPadding, 0]);
// axes that are rendered already for you
var xAxis = d3.axisTop(xScale).ticks(6).tickSize(-cellHeight, 0, 0);
var yAxis = d3.axisLeft(yScale).ticks(6).tickSize(-cellWidth, 0, 0);
// Ordinal color scale for cylinders color mapping
var customColors = ['#ff5733', '#ffbd69', '#45aaf2', '#2ecc71','#8e44ad','#f7dc6f', '#3498db', '#fd79a8', '#1abc9c', '#f39c12' ];
var colorScale = d3.scaleOrdinal(customColors);
// Map for referencing min/max per each attribute
var extentBscatterYAttr = {};
// Object for keeping state of which cell is currently being brushed
var brushCell;

// ****** Add reusable components here ****** //
function scatterCell(x, y, col, row) {
    this.x = x;
    this.y = y;
    this.col = col;
    this.row = row;
}

function BarChartCell(x, y, col, row) {
    this.x = x;
    this.y = y;
    this.col = col;
    this.row = row;
}

var scatterPlot = new scatterCell(scatterXAttr, scatterYAttr, 0, 0);

var barChart = new BarChartCell(barXAttr, barYAttr, 1, 0);

var brush = d3.brush()
    .extent([[0, 0], [cellWidth - cellPadding, cellHeight - cellPadding]])
    .on("start", brushstart)
    .on("brush", brushmove)
    .on("end", brushend);

scatterCell.prototype.init = function(g) {
    var cell = d3.select(g);

    cell.append('rect')
      .attr('class', 'frame')
      .attr('width', cellWidth - cellPadding)
      .attr('height', cellHeight - cellPadding);
}

BarChartCell.prototype.init = function(g) {
    var cell = d3.select(g);

    cell.append('rect')
        .attr('class', 'frame')
        .attr('width', cellWidth - cellPadding)
        .attr('height', cellHeight - cellPadding);
}

var toolTip = d3.tip()
.attr("class", "d3-tip")
.offset([-12, 0])
.html(function(event, d) {
    // Inject html, when creating your html I recommend editing the html within your index.html first
    return "<h5>"+d['name']+"</h5><table><thead><tr><td>Year</td><td>Displacement (cc)</td><td>Weight (lb)</td></tr></thead>"
         + "<tbody><tr><td>"+d['year']+"</td><td>"+d['displacement (cc)']+"</td><td>"+d['weight (lb)']+"</td></tr></tbody>"
         + "<thead><tr><td>0-60 mph (s)</td><td>Economy (mpg)</td><td>Cylinders</td><td>Power (hp)</td></tr></thead>"
         + "<tbody><tr><td>"+d['0-60 mph (s)']+"</td><td>"+d['economy (mpg)']+"</td><td>"+d['cylinders']+"</td><td>"+d['power (hp)']+"</td></tr></tbody></table>"
});

svg.call(toolTip);

d3.csv('cars.csv', dataPreprocessor).then(function(dataset) {
    
        cars = dataset;
        countByCylinders = d3.rollup(dataset, v => v.length, d => d['cylinders']);
        extentBarchartXAttr[barXAttr] = d3.extent(Array.from(countByCylinders.keys()), d => +d);
        extentBarchartYAttr[barYAttr] = d3.extent(Array.from(countByCylinders.keys()), d => +d);

        // Create map for each attribute's extent
        dataAttributes.forEach(function(attribute){
            extentBscatterYAttr[attribute] = d3.extent(dataset, function(d){
                return d[attribute];
            });
        });

        // Pre-render gridlines and labels
        chartG.selectAll('.x.axis')
            .data([scatterXAttr, barXAttr])
            .enter()
            .append('g')
            .attr('class', 'x axis')
            .attr('transform', function(d,i) {
                return 'translate('+[i * cellWidth + cellPadding / 2, 0]+')';
            })
            .each(function(attribute){
                xScale.domain(extentBscatterYAttr[attribute]);
                d3.select(this).call(xAxis);
                d3.select(this).append('text')
                    .text(attribute)
                    .attr('class', 'axis-label')
                    .attr('transform', 'translate('+[cellWidth / 2, -20]+')');
            });
        chartG.selectAll('.y.axis')
            .data([scatterYAttr])
            .enter()
            .append('g')
            .attr('class', 'y axis')
            .attr('transform', function(d,i) {
                return 'translate('+[0, i * cellHeight + cellPadding / 2]+')';
            })
            .each(function(attribute){
                yScale.domain(extentBscatterYAttr[attribute]);
                d3.select(this).call(yAxis);
                d3.select(this).append('text')
                    .text(attribute)
                    .attr('class', 'axis-label')
                    .attr('transform', 'translate('+[-26, cellHeight / 2]+')rotate(270)');
            });


        // ********* Your data dependent code goes here *********//
        
        scatterCell.prototype.update = function(g, data) {
            var cell = d3.select(g);
        
            // Update the global x,yScale objects for this cell's x,y attribute domains
            xScale.domain(extentBscatterYAttr[this.x]);
            yScale.domain(extentBscatterYAttr[this.y]);
        
            // Save a reference of this scatterCell, to use within anon function scopes
            var _this = this;
        
            var dots = cell.selectAll('.dot')
                .data(data, function(d){
                    return d.name +'-'+d.year+'-'+d.cylinders; // Create a unique id for the car
                });
        
            var dotsEnter = dots.enter()
                .append('circle')
                .attr('class', 'dot')
                .style("fill", function(d) { return colorScale(d.cylinders); })
                .attr('r', 4);
        
            dots.merge(dotsEnter).attr('cx', function(d){
                    return xScale(d[_this.x]);
                })
                .attr('cy', function(d){
                    return yScale(d[_this.y]);
                });

            dotsEnter.on('mouseover', toolTip.show)
                .on('mouseout', toolTip.hide);
        
            dots.exit().remove();
        }

        BarChartCell.prototype.update = function(g, data) {
            var cell = d3.select(g);
        
            // Update the x, yScale objects for this cell's x, y attribute domains
            // xScale.domain(extentBarchartXAttr[this.x]);
            // yScale.domain([0, d3.max(data, function (d) { return d[this.y]; }.bind(this))]);

            // CHANGED
            xScale.domain([0, d3.max(data, function (d) { return d[this.x]; }.bind(this))]);
            yScale.domain(extentBarchartYAttr[this.y]);
        
            var bars = cell.selectAll('.bar')
                .data(Array.from(countByCylinders.entries()), function (d) {
                    return d[0];
                });
        
            var barsEnter = bars.enter()
                .append('rect')
                .attr('class', 'bar')
                .attr('fill', function (d) { return colorScale(+d[0]); });
        
            bars.merge(barsEnter)
                .attr('x', function (d) { 
                    console.log(d)
                    return 50 * d[0] - 150; })
                .attr('y', function (d) { return cellHeight - d[1] - 10; })
                .attr('width', (cellHeight / 7) - cellPadding)
                .attr('height', function (d) { return d[1]; });
                // .attr('y', function (d) { return yScale(d[0]); })
                // .attr('x', function (d) { return 0; })
                // .attr('height', (cellHeight / 7) - cellPadding)
                // .attr('width', function (d) { return (cellWidth - cellPadding - yScale(d[1])) / 28; });
        
            barsEnter.on('mouseover', toolTip.show)
                .on('mouseout', toolTip.hide);
        
            bars.exit().remove();
        }

        var cellEnter = chartG.selectAll('.cell')
            .data([scatterPlot, barChart])
            .enter()
            .append('g')
            .attr('class', 'cell')
            .attr("transform", function (d) {
                var tx = d.col * cellWidth + cellPadding / 2;
                var ty = d.row * cellHeight + cellPadding / 2;
                return "translate(" + [tx, ty] + ")";
            });
        
        cellEnter.append('g')
            .attr('class', 'brush')
            .call(brush);
        
        cellEnter.each(function (cell) {
            cell.init(this);
            cell.update(this, dataset);
        });

    });

// ********* Your event listener functions go here *********//
function brushstart(event, cell) {
    // cell is the scatterCell object

    // Check if this g element is different than the previous brush
    if(brushCell !== this) {

        // Clear the old brush
        brush.move(d3.select(brushCell), null);

        // Update the global scales for the subsequent brushmove events
        xScale.domain(extentBscatterYAttr[cell.x]);
        yScale.domain(extentBscatterYAttr[cell.y]);

        // Save the state of this g element as having an active brush
        brushCell = this;
    }
}

function brushmove(event, cell) {
    // cell is the scatterCell object

    // Get the extent or bounding box of the brush event, this is a 2x2 array
    var e = event.selection;
    if(e) {

        // Select all .dot circles, and add the "hidden" class if the data for that circle
        // lies outside of the brush-filter applied for this scatterCells x and y attributes
        svg.selectAll(".dot")
            .classed("hidden", function(d){
                return e[0][0] > xScale(d[cell.x]) || xScale(d[cell.x]) > e[1][0]
                    || e[0][1] > yScale(d[cell.y]) || yScale(d[cell.y]) > e[1][1];
            })
        svg.selectAll(".bar")
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

// Remember code outside of the data callback function will run before the data loads

function dataPreprocessor(row) {
    return {
        'name': row['name'],
        'economy (mpg)': +row['economy (mpg)'],
        'cylinders': +row['cylinders'],
        'displacement (cc)': +row['displacement (cc)'],
        'power (hp)': +row['power (hp)'],
        'weight (lb)': +row['weight (lb)'],
        '0-60 mph (s)': +row['0-60 mph (s)'],
        'year': +row['year'],
    };
}