var stockData = [
    {key: 'TECHNOLOGY', pos: [200, 105], value: {
        total: 397.08,  companies: [
            {company: "MSFT", price: 77.74, pos: [-60, 0], color: '#85b623'},
            {company: "IBM", price: 159.48, pos: [12, -48], color: '#236cb0'},
            {company: "AAPL", price: 159.86, pos: [15, 45], color: '#666666'}
        ]}
    },
    {key: 'FOOD & DRINK', pos: [85, 290], value: {
        total: 266.78, companies: [
            {company: "KO", price: 46.47, pos: [50, 0], color: '#e32232'},
            {company: "MCD", price: 165.07, pos: [-18, -20], color: '#fed430'},
            {company: "SBUX", price: 55.24, pos: [20, 45], color: '#0e7042'}
        ]}
    },
    {key: 'AIRLINES', pos: [320, 290], value: {
        total: 183.51, companies: [
            {company: "DAL", price: 52.88, pos: [0, -35], color: '#980732'},
            {company: "AAL", price: 51.95, pos: [35, 10], color: '#1f98ce'},
            {company: "JBLU", price: 20.08, pos: [7, 45], color: '#101e40'},
            {company: "LUV", price: 58.60, pos: [-35, 15], color: '#d81f2a'}
        ]}
    }
];

// Updated for V6
var nested = d3.rollup(stockData,
    v => { return { values: { companies: v, total: d3.sum(v, d => d.price) } }; },
    d => { return { key: d.sector } },
);

var rSectorScale = d3.scaleSqrt()
    .domain([0, 397.08])
    .range([0, 100]);

var rScale = d3.scaleSqrt()
    .domain([0, 165.07])
    .range([0, 45]);

var svg = d3.select('svg');

var sectorG = svg.selectAll('.sector')
    .data(stockData)
    .enter()
    .append('g')
    .attr('class', 'sector')
    .attr('transform', function(d) {
        return 'translate('+d.pos+')';
    })
    .style('fill', '#ccc');

sectorG.append('circle')
    .attr('r', function(d) {
        return rSectorScale(d.value.total);
    })
    .style('fill', '#ccc');

sectorG.append('text')
    .text(function(d) {
        return d.key;
    })
    .attr('y', function(d) {
        return rSectorScale(d.value.total) + 16;
    })
    .attr('dy', '0.3em')
    .style('text-anchor', 'middle')
    .style('fill', '#aaa')
    .style('font-size', 14)
    .style('font-family', 'Open Sans');

var companyG = sectorG.selectAll('.company')
    .data(function(d) {
        return d.value.companies;
    })
    .enter()
    .append('g')
    .attr('class', 'company')
    .attr('transform', function(d) {
        return 'translate('+d.pos+')';
    });

companyG.append('circle')
    .attr('r', function(d) {
        return rScale(d.price);
    })
    .style('fill', function(d) {
        return d.color;
    });

companyG.append('text')
    .text(function(d) {
        return d.company;
    })
    .attr('dy', '0.3em')
    .style('text-anchor', 'middle')
    .style('fill', '#fff')
    .style('font-size', 12)
    .style('font-family', 'Open Sans');

