import { convertCsvToGeoJsonForPieChart } from './script.js';
import { globalState } from './config.js';


const MARGIN = { left: 50, bottom: 20, top: 20, right: 20 };
const CHART_WIDTH = 325 - MARGIN.left - MARGIN.right;
const CHART_HEIGHT = 300 - MARGIN.top - MARGIN.bottom;



export function pieChartSetup(globalState, stationName) {
    console.log("SETTING UP PIE CHART")
    const svg = d3.select("#tooltip-chart-svg")
    .attr("width", CHART_WIDTH + MARGIN.left + MARGIN.right)
    .attr("height", CHART_HEIGHT + MARGIN.top + MARGIN.bottom);

    svg.append("rect")
    .attr("width", "100%")
    .attr("height", "100%")
    .attr("fill", "white");

    

    console.log("Global State:", globalState);

    convertCsvToGeoJsonForPieChart(globalState.data, function(geojson) {
        console.log("GeoJSON Data:", geojson);
        updatePieChart(geojson, stationName);
    });
 
};

export function updatePieChart(geojson, stationName) {
    // Step 1: Group data into three categories: Low, Medium, High
    const svg = d3.select("#tooltip-chart-svg")

    svg.select("g").remove();
    const chart = svg.append("g")
    .attr("transform", `translate(${MARGIN.left},${MARGIN.top})`);

    console.log("Data:", geojson);
    const groupedData = geojson.features[stationName];

    console.log("Grouped Data:", groupedData);


    // Convert grouped data into an array suitable for the pie chart
    const pieData = Object.entries(groupedData).map(([key, value]) => ({
        category: key,
        value: value
    }));



    // Step 2: Set up dimensions and radius
    const width = CHART_WIDTH;
    const height = CHART_HEIGHT;
    const radius = Math.min(width, height) / 2;

    // Step 3: Create the pie layout
    const pie = d3.pie()
        .value(d => d.value)
        .sort(null);

    const arc = d3.arc()
        .innerRadius(0)
        .outerRadius(radius);
 
    // Step 5: Render the pie chart
    const color = d3.scaleOrdinal()
        .domain(["low", "medium", "high"])
        .range(["#33ff7d", "#ffea33", "#ff5733"]);
    
    chart.attr("transform", `translate(${width / 2}, ${height / 2})`);

    chart.selectAll("path")
        .data(pie(pieData))
        .join("path")
        .attr("d", arc)
        .attr("fill", d => color(d.data.category))
        .attr("stroke", "white")
        .style("stroke-width", "2px");
 
    // Step 6: Add labels (optional)
    chart.selectAll("text")
        .data(pie(pieData))
        .join("text")
        .text(d => `${d.data.value}`)
        .attr("transform", d => `translate(${arc.centroid(d)})`)
        .style("text-anchor", "middle")
        .style("font-size", "14px")
        .style("fill", "white");

    // Create legend container
    const legendGroup = chart.append("g")
        .attr("transform", `translate(${radius}, ${-radius})`);

    // Render legend
    legendGroup.selectAll("rect")
        .data(pieData)
        .join("rect")
        .attr("x", 0)
        .attr("y", (d, i) => i * 20)
        .attr("width", 15)
        .attr("height", 15)
        .attr("fill", d => color(d.category));

    // Add text labels for legend
    legendGroup.selectAll("text")
        .data(pieData)
        .join("text")
        .attr("x", 20)
        .attr("y", (d, i) => i * 20 + 12)
        .text(d => `${d.category.charAt(0).toUpperCase() + d.category.slice(1)}`)
        .style("font-size", "12px")
        .style("fill", "black");
}

export function deletePieChart(){
    const svg = d3.select("#tooltip-chart-svg")

    svg.select("g").remove();
}