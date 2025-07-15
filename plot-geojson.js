import * as d3 from 'https://cdn.skypack.dev/d3@7';
import { convertCsvToGeoJson } from './script.js';
import { globalState } from './config.js';
import { pieChartSetup } from './piechart.js';
import { convertCsvToGeoJsonForAnimation } from './script.js';

// Color combination
const colors = {
  mapFill: "#faf3e1",
  mapBorder: "#5e5a51",
  hoverFill: "#ffcc00",
  hoverBorder: "#ff9900",
  circleFill: "#293742",
  circleHover: "#d2e0f5"
};

const targetSize = .75 * window.innerHeight;
const scale = targetSize/616;
const projection = d3.geoMercator()
.scale(5000 * scale)
.center([-111.0937, 39.3200]);



// Function to plot GeoJSON data on the map
function plotGeoJson(geojson, geoJsonGroup, path) {
  console.log("Plotting GeoJSON Data:", geojson);

  geoJsonGroup.selectAll("path")
    .data(geojson.features)
    .enter().append("path")
    .attr("d", path)
    .attr("stroke", colors.mapBorder)
    .attr("fill", colors.mapFill)
    .style("z-index", 3)

  
}



// Function to plot points from GeoJSON data
export function plotPoints(geojson, geoJsonGroup) {
  console.log("Plotting Points Data:", geojson);
  console.log("Projection:", projection);
  console.log("GeoJSON Group:", geoJsonGroup);

  // Create a tooltip
  const tooltip = d3.select("#tooltip")
  const tooltipLabel = d3.select("#tooltip-text-label")
  const tooltipText = d3.select("#tooltip-text-value")
  const offsetX = 10
  const offsetY = 10
  const pointRadius = 5

  const colorScale = d3.scaleSequential(d3.interpolateReds)
  .domain(d3.extent(geojson.features, d => d.properties.avgPM25));

  addLegend(colorScale, geoJsonGroup)

  const sizeScale = d3.scaleLinear().domain(d3.extent(geojson.features, d => d.properties.avgPM25)).range([2, 15]);

  geoJsonGroup.selectAll("circle").remove();
  
  geoJsonGroup.selectAll("circle")
    .data(geojson.features)
    .enter().append("circle")
    .attr("cx", d => {
      const [x, y] = projection(d.geometry.coordinates);
      console.log(`Coordinates for ${d.properties.name}: (${x}, ${y})`);
      return x;
    })
    .attr("cy", d => projection(d.geometry.coordinates)[1])
    // .attr("r", d => sizeScale(d.properties.avgPM25))
    .attr("r", pointRadius)
    .attr("fill", d => colorScale(d.properties.avgPM25))
    .attr("class", "map-circle")
    .on("mouseover", function(event, d) {
      d3.select(this)
        // .attr("fill", "000000")
        // .attr("r", 2);  // Increase radius on hover
        .attr("r", pointRadius * 2)
        console.log('MOUSE OVER');
          tooltip.style("display", "block")
        tooltipLabel.text(d.properties.name);
        
        tooltipText.text(`Avg PM2.5 for ${globalState.selectedYear}: ${d.properties.avgPM25.toFixed(2)}`)
        console.log("TOOLTIPTYPE", globalState.tooltipChartType);
        pieChartSetup(globalState, d.properties.name);

    })
    .on("mouseout", function(event, d) {
      d3.select(this)
        .attr("fill", d => colorScale(d.properties.avgPM25))  
        // .attr("r", d => sizeScale(d.properties.avgPM25));  // Revert radius
        .attr("r", pointRadius)
      tooltip.style("display", "none");
    })
    .on("mousemove", function(event) {
      let x = event.pageX + offsetX;
      let y = event.pageY + offsetY; 
      // Get the modal element's dimensions
      const modal = d3.select("#tooltip").node();
      const modalWidth = modal.offsetWidth;
      const modalHeight = modal.offsetHeight;
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      console.log('MOUSE MOVE');
      // Adjust x position if the modal goes off the right edge
      if (x + modalWidth > viewportWidth) {
          x = event.pageX - modalWidth - offsetX;
      }

      // Adjust y position if the modal goes off the bottom edge
      if (y + modalHeight > viewportHeight) {
        y = event.pageY - modalHeight - offsetY;
      }

      tooltip.style("left", x + "px")
            .style("top", y + "px");
      
    });
}

function addLegend(color, geoJsonGroup) {
  // Constants for the legend
  const legendWidth = 100; // Width of the legend
  const legendHeight = 20; // Height of the legend
  const margin = { left: 20, bottom: 40 }; // Margin for positioning
  const map = d3.select("#utah-map-svg");
  const bounds = geoJsonGroup.node().getBBox();
  const svgWidth = parseInt(map.attr("width")); // Set the width of your SVG
  const svgHeight = parseInt(map.attr("height"));
  console.log(svgWidth + 100)
   // Assuming this is your SVG element

  // Add legend group to map and position it
  const legend = map.append("g")
    .attr("class", "legend")
    .attr("transform", `translate(${bounds.x + svgWidth - legendWidth - 50}, ${bounds.y + svgHeight - legendHeight - 80})`);

  // Define the color gradient for the legend
  const defs = map.append("defs");
  const linearGradient = defs.append("linearGradient")
    .attr("id", "legend-gradient")
    .attr("x1", "0%")
    .attr("x2", "100%")
    .attr("y1", "0%")
    .attr("y2", "0%");

  // Create a gradient by calculating stops across the domain
  const numStops = 10;
  for (let i = 0; i <= numStops; i++) {
      const ratio = i / numStops;
      const colorValue = color(color.domain()[0] + ratio * (color.domain()[1] - color.domain()[0])); // Get color value for the stop
      linearGradient.append("stop")
          .attr("offset", `${ratio * 100}%`)
          .attr("stop-color", colorValue);
  }

  // Draw the rectangle with the gradient fill
  legend.append("rect")
    .attr("x", 0)
    .attr("width", legendWidth)
    .attr("height", legendHeight)
    .style("fill", "url(#legend-gradient)");

  // Define a scale for the legend axis
  const legendScale = d3.scaleLinear()
    .domain([0, 9]) // Use the domain of the color scale
    .range([0, legendWidth]);

  // Define the axis to display values on the legend
  const legendAxis = d3.axisBottom(legendScale)
    .tickValues([0, 4.5, 9])
    .tickFormat(d3.format(".1f")); // Format the tick values to 2 decimal places

  // Add the legend axis to the legend
  legend.append("g")
    .attr("transform", `translate(0, ${legendHeight})`) // Position the axis below the rectangle
    .call(legendAxis);
}



function updateCircleSizes(month, geojson, geoJsonGroup) {
  const monthIndex = parseInt(month);
  console.log(geojson);
  
  geoJsonGroup.selectAll("circle")
    .data(geojson.features)
    .on("mouseover", function(event, d) {})
    .on("mousemove", function(event) {})
    .on("mouseout", function(event, d) {})
    .transition()
    .duration(500)
    .attr("r", d => {
      const monthlyData = d.properties.monthlyData;
      const avgPM25Month = monthlyData[monthIndex-1].avgPM25Month;
      return avgPM25Month;
    });
    
}
 

  

  
  // convertCsvToGeoJson(filePath, function(geojson) {
  //   const sizeScale = d3.scaleLinear()
  //     .domain(d3.extent(geojson.features, d => d.properties.avgPM25))
  //     .range([2, 15]);

  //   geoJsonGroup.selectAll("circle")
  //     .data(geojson.features)
  //     .transition()
  //     .duration(1000)
  //     .attr("r", d => sizeScale(d.properties.avgPM25));
  // });


// Main function to load and plot data
function main() {
  const width = 600;
  const height = 800;

  const path = d3.geoPath().projection(projection);

  const svg = d3.select("#utah-map-svg")
    .attr("width", width)
    .attr("height", height);
  const geoJsonGroup = svg.append("g")

  // Load and plot filtered GeoJSON data
  d3.json("data/counties.geojson").then(function(data) {
    console.log("Loaded GeoJSON Data:", data);

    const filteredData = {
      type: "FeatureCollection",
      features: data.features.filter(d => d.properties.STATEFP === "49")
    };

    console.log("Filtered GeoJSON Data:", filteredData);
    
    plotGeoJson(filteredData, geoJsonGroup, path);
    // Calculate bounds of the content
    const bounds = geoJsonGroup.node().getBBox();

    svg.attr("width", bounds.width + (50 * scale))
    .attr("height", bounds.height + (50* scale))
    .attr("viewBox", `${bounds.x} ${bounds.y} ${bounds.width} ${bounds.height}`)

    // geoJsonGroup.attr("transform", `translate(${bounds.width/(5*scale)}, ${bounds.height/(1.5*scale)})`)

  }).catch(function(error) {
    console.error("Error loading the GeoJSON data:", error);
  });
  // SET DEFAULTS
  d3.select("#selected-year").text("Please select a year");

  // On selection change
  d3.selectAll(".dropdown-item").on("click", function(event) {
    const year = d3.select(this).attr('data-value');
    console.log("Year selected:", year); // Debugging log
    // Load the GeoJSON data and update the modal content based on the selected year

    d3.select('#dropdownMenuButton')
    .text(year);

    d3.selectAll(".btn-group .btn").classed("season-unselected", true);
    d3.select("#selected-year").text(`Average For: ${year}`);


    const filePath = `data/${year}.csv`;

    globalState.data = filePath;
    globalState.selectedYear = year;
    globalState.tooltipChartType = "pieChart";

    console.log("File Path:", filePath); // Debugging log

    console.log("Global State:", globalState);

    convertCsvToGeoJson(filePath, function(geojson) {
      console.log("Check after selecting year, call this plot function");
      plotPoints(geojson, geoJsonGroup);
    });

  });


  d3.select("#customRange3").on("change", function(event) {
    const month = this.value;
    console.log("Month selected:", month); // Debugging log
    console.log("Global State:", globalState);
    const filePath = globalState.data;
    console.log("File Path:", filePath); // Debugging log

    convertCsvToGeoJsonForAnimation(filePath, function(geojson) {
      updateCircleSizes(month, geojson, geoJsonGroup);
      console.log("Check after selecting month, call this plot function");
    });
    // Load the GeoJSON data and update the modal content based on the selected year
  });

  const sideButton = d3.select("#arrow-icon");
  sideButton.on("click", toggleModal);

  const playButton = d3.select("#animation-icon");
  playButton.on("click", handleAnimation);
  
}

let isModalOpen = true;
// Toggle function to open and close the modal
function toggleModal() {
  const sideModalContainer = d3.select("#side-modal-container");
  const buttonContainer = d3.select("#button-container");
  const arrowIcon = d3.select("#arrow-icon");

  if (isModalOpen) {
      // Close the modal
      sideModalContainer.style("right", "-270px"); // Slide container off-screen
      arrowIcon.style("transform", "scaleX(1)"); // Flip arrow to point right
      buttonContainer.style("margin-right", "100px"); 
  } else {
      // Open the modal
      sideModalContainer.style("right", "0"); // Slide container into view
      arrowIcon.style("transform", "scaleX(-1)"); // Flip arrow to point left
      buttonContainer.style("margin-right", "20px");
  }

  // Toggle the state
  isModalOpen = !isModalOpen;
}


let interval; 

const monthNames = ["January", "February", "March", "April", "May", "June","July", "August", "September", "October", "November", "December"];

function handleAnimation() {
  if(!globalState.selectedYear){
    return;
  }
  const playButton = d3.select("#animation-icon");
  let currSrc = playButton.attr("src");
  const newSrc = currSrc === "/icons/PlayIcon.png" ? "/icons/stop_icon.svg" : "/icons/PlayIcon.png";
  playButton.attr("src", newSrc);
  const text_label = d3.select("#selected-year");
  const slider = d3.select("#customRange3");
  d3.selectAll(".btn-group .btn").classed("season-unselected", true);

  if (newSrc === "/icons/PlayIcon.png") {
    // Stop the animation
    clearInterval(interval);
    slider.property("value", 1);
    const filePath = globalState.data;
    const geoJsonGroup = d3.select("#utah-map-svg").select("g");
    text_label.text(`Average For: ${globalState.selectedYear}`);
    
    convertCsvToGeoJson(filePath, function(geojson) {
      console.log("Check after selecting year, call this plot function");
      plotPoints(geojson, geoJsonGroup);
    });
  } else {
    // Start the animation
    interval = setInterval(() => {
      const currValue = parseInt(slider.property("value"));
      const newValue = currValue + 1 > 12 ? 1 : currValue + 1;
      slider.property("value", newValue);
      slider.dispatch("change");
      text_label.text(`Average For: ${monthNames[newValue - 1]} ${globalState.selectedYear}`);
    }, 1000);
  }
}





// Run the main function
main();
