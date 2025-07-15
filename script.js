// Import D3.js
import * as d3 from 'https://cdn.skypack.dev/d3@7';
import { globalState } from './config.js';
import { heatMapSetup } from './heatmap.js';
import { deletePieChart } from './piechart.js';
import { plotPoints } from './plot-geojson.js';



// Function to group data by season
function groupbySeason(data) {
  const seasons = ["Winter", "Spring", "Summer", "Fall"];

  // Define the date ranges for each season
  const seasonRanges = {
    "Winter": [12, 1, 2],
    "Spring": [3, 4, 5],
    "Summer": [6, 7, 8],
    "Fall": [9, 10, 11]
  };

  // Parse the date format
  const parseDate = d3.timeParse("%m/%d/%Y");

  // Function to check if a date falls within a given range
  function isDateInRange(date, range) {
    const month = date.getMonth() + 1;
    return range.includes(month);
  }

  const seasonalData = seasons.map(season => {
    const seasonData = data.filter(d => {
      const date = parseDate(d["Date"]);
      return isDateInRange(date, seasonRanges[season]);
    });
    const avgPM25 = d3.mean(seasonData, d => +d["Daily Mean PM2.5 Concentration"]);
    return { season: season, avgPM25Seasonal: avgPM25 };
  });


  return seasonalData;
}

function updateBySeason(season, geojson) {
  const modalContent = d3.select("#modalContent");
  const seasonData = geojson.features.map(d => d.properties.seasonalData.find(s => s.season === season));
  const avgPM25 = d3.mean(seasonData, d => d ? d.avgPM25Seasonal : 0);

  const colorScale = d3.scaleSequential(d3.interpolateReds)
    .domain(d3.extent(geojson.features, d => d.properties.avgPM25));

  const sizeScale = d3.scaleLinear()
    .domain(d3.extent(geojson.features, d => d.properties.avgPM25))
    .range([2, 10]);

  // Update the circle colors based on the selected season
  d3.selectAll("circle").data(geojson.features)
    .attr("fill", d => {
      const seasonalData = d.properties.seasonalData.find(s => s.season === season);
      return seasonalData ? colorScale(seasonalData.avgPM25Seasonal) : colorScale(d.properties.avgPM25);
    })
    .attr("r", d => sizeScale(d.properties.seasonalData.find(s => s.season === season).avgPM25Seasonal))
    .style("opacity", 0.7);

  // Update the tooltip text
  d3.selectAll("circle").each(function(d) {
    const seasonalData = d.properties.seasonalData.find(s => s.season === season);
    const avgPM25Seasonal = seasonalData ? seasonalData.avgPM25Seasonal : 0;
    d3.select(this).on("mouseover", function(event) {
      d3.select(this)
        .attr("stroke", "#ffff")
        .attr("stroke-width", 1)
        .attr("r", sizeScale(avgPM25Seasonal) * 1.5); // Increase radius on hover

      d3.select("#tooltip-text-label").text(d.properties.name);
      d3.select("#tooltip-text-value").text(`Average PM2.5 for ${season}: ${avgPM25Seasonal.toFixed(2)}`);
      d3.select("#tooltip").style("display", "block");
      deletePieChart();
      heatMapSetup(globalState, d.properties.name);
    }).on("mouseout", function(event) {
      d3.select(this)
        .attr("fill", colorScale(avgPM25Seasonal))
        .attr("r", sizeScale(avgPM25Seasonal)) // Reset radius on mouseout
        .attr("stroke-width", 0);

      d3.select("#tooltip").style("display", "none");
    });
  });

  console.log(`Updated modal content for ${season}: Avg PM2.5 = ${avgPM25.toFixed(2)}`); // Debugging log
}


d3.selectAll(".btn-group .btn").classed("season-unselected", true);

 d3.selectAll(".btn-group .btn").on("click", function(event) {
  const buttonClicked = d3.select(this);
  if(!buttonClicked.classed("season-unselected")) {
    d3.selectAll(".btn-group .btn").classed("season-unselected", true);
    console.log("BUTTON CLICKED HAS NO UNSELECT")
    const filePath = globalState.data;
    const geoJsonGroup = d3.select("#utah-map-svg").select("g");
    convertCsvToGeoJson(filePath, function(geojson) {
      console.log("CALLING UNSELECT FUNCTION");
      plotPoints(geojson, geoJsonGroup);
    });
    if(globalState.selectedYear) {
      d3.select("#selected-year").text(`Average over: ${globalState.selectedYear}`);
    }

    return
  }

  d3.selectAll(".btn-group .btn").classed("season-unselected", true); // Remove "selected" class from all buttons
  buttonClicked.classed("season-unselected", false); // Add "selected" class to the clicked button

  console.log("Button clicked:", d3.select(this).attr("id"));
  const season = buttonClicked.attr("id");
  if(globalState.selectedYear) {
    d3.select("#selected-year").text(`Average over: ${season} ${globalState.selectedYear}`);
  }
  globalState.selectedSeason = season;
  globalState.tooltipChartType = "heatMap";
  // Load the GeoJSON data and update the modal content
  convertCsvToGeoJson(globalState.data, function(geojson) {
    console.log("GeoJSON Data:", globalState.data);
    updateBySeason(season, geojson);
  });
});

function groupbyMonth(data) {
  const parseDate = d3.timeParse("%m/%d/%Y");

  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  const monthlyData = months.map(month => {
    const monthData = data.filter(d => {
      const date = parseDate(d["Date"]);
      return date.getMonth() === months.indexOf(month);
    });
    const avgPM25 = d3.mean(monthData, d => +d["Daily Mean PM2.5 Concentration"]);
    return { month: month, avgPM25Month: avgPM25 };
  });

  return monthlyData;
}

const methods = [
  "R & P Model 2025 PM-2.5 Sequential Air Sampler w/VSCC",
  "Teledyne T640 at 5.0 LPM",
  "Thermo Scientific Model 5030 SHARP w/VSCC",
  "Teledyne T640 at 5.0 LPM (Corrected)",
  "Thermo Scientific Model 5030 SHARP w/VSCC (Corrected)",
  "Teledyne T640 at 5.0 LPM - Beta Attenuation Monitor",
  "Thermo Scientific Model 5030 SHARP - Beta Attenuation Monitor",
  "Teledyne T640 at 5.0 LPM - Beta Attenuation Monitor (Corrected)",
  "Thermo Scientific Model 5030 SHARP - Beta Attenuation Monitor (Corrected)",
  "IMPROVE Module A with Cyclone Inlet-Teflon Filter, 2.2 sq. cm.",
  "R & P Model 2025 PM2.5 Sequential w/WINS",
  "R & P Model 2000 PM2.5 Sampler w/WINS",
  "Andersen RAAS Teflon",
  "Met One BAM-1020 w/VSCC",
  "Met One BAM-1020 Mass Monitor w/VSCC",
  "PM2.5 SCC",
  "R & P Model 2025 PM-2.5 Sequential Air Sampler w/VSCC",
  "R & P Model 2000 PM-2.5 Air Sampler w/VSCC",
  "Met One SASS/SuperSASS Teflon",
  "R & P Model 2000 PM2.5 Sampler w/WINS",
  "Thermo Scientific TEOM 1400 FDMS or 1405 8500C FDMS w/VSCC",
  "Thermo Scientific TEOM 1400 FDMS or 1405 8500C FDMS w/VSCC (Corrected)",
  "Thermo Scientific TEOM 1400 FDMS or 1405 8500C FDMS - Filter Dynamics Measurement System",
  "Thermo Scientific TEOM 1400 FDMS or 1405 8500C FDMS - Filter Dynamics Measurement System (Corrected)",
  "Thermo Scientific TEOM 1400 FDMS or 1405 8500C FDMS - Filter Dynamics Measurement System - Beta Attenuation Monitor",
  "Thermo Scientific TEOM 1400 FDMS or 1405 8500C FDMS - Filter Dynamics Measurement System - Beta Attenuation Monitor (Corrected)",
  "BGI Model PQ200 PM2.5 Sampler w/WINS",
  
];

function filterDataByMethods(data, methods) {
  // Group data by Local Site Name
  const groupedData = d3.group(data, d => d["Local Site Name"]);

  const filteredData = [];

  groupedData.forEach((values, key) => {
    // Group by date within each site
    const dateGrouped = d3.group(values, d => d["Date"]);

    const siteFilteredData = [];

    // Select one method per date
    dateGrouped.forEach((dateValues, date) => {
      const selectedMethod = dateValues.find(d => methods.includes(d["Method Description"]));
      if (selectedMethod) {
        siteFilteredData.push(selectedMethod);
      }
    });

    // Ensure the number of unique dates is capped at 356
    if (siteFilteredData.length > 356) {
      siteFilteredData.sort((a, b) => new Date(a["Date"]) - new Date(b["Date"]));
      filteredData.push(...siteFilteredData.slice(0, 356));
    } else {
      filteredData.push(...siteFilteredData);
    }
  });

  // foreach(filteredData, function(d) {
  //   if(d["Local Site Name"] === "naDinosaur National Monument"){
  //     console.log("Dinosaur National Monument Dugged", d);
  //   }
  // });

  return filteredData;
}


export function convertCsvToGeoJsonForHeatMap(tempFilePath, callback) {
  console.log("Loading data from file:", tempFilePath);
  d3.csv(tempFilePath).then(function(data) {
    // Parse the data and calculate the average PM2.5 concentration for each location
    const firsthandData = filterDataByMethods(data, methods);

    const locations = d3.group(firsthandData, d => d["Local Site Name"]);

    console.log("Locations:", locations);
  
    const geojsonFeatures = [];
  
    locations.forEach((values, key) => {
      const latitude = +values[0]["Site Latitude"];
      const longitude = +values[0]["Site Longitude"];

      console.log(key);
      
  
      const groupedData = [];
      
      values.forEach(d => {
        const eachDateCell = {day: "",  category: ""};

        if (d["Daily Mean PM2.5 Concentration"] <= 6 && d["Daily Mean PM2.5 Concentration"] >= 0){
          eachDateCell.day = d["Date"]
          eachDateCell.category = "Good"
          groupedData.push(eachDateCell);
        }
        else if (d["Daily Mean PM2.5 Concentration"] <= 25){
          eachDateCell.day = d["Date"]
          eachDateCell.category = "Fair"
          groupedData.push(eachDateCell);
        }
        else{
          eachDateCell.day = d["Date"]
          eachDateCell.category = "Poor"
          groupedData.push(eachDateCell);
        }
      });

      geojsonFeatures.push({
        type: "Feature",
        properties: {
          features: groupedData
        },
        geometry: {
          type: "Point",
          StationName: key,
          coordinates: [longitude, latitude]
        }
      });
    });
  
    const geojson = {
      type: "FeatureCollection",
      features: geojsonFeatures
    };
  
    // console.log("GeoJSON Data:", geojson)
   
    console.log("GeoJSON Data:", geojson);
    

    // Call the callback function with the generated GeoJSON data
    callback(geojson);
  }).catch(function(error) {
    console.error("Error loading or parsing data:", error);
  });
}

export function convertCsvToGeoJsonForPieChart(tempFilePath, callback) {
  console.log("Loading data from file:", tempFilePath);
  // Load the CSV data
  d3.csv(tempFilePath).then(function(data) {
    // Filter data by Local Site Name and Method Description
    const filteredData = filterDataByMethods(data, methods);

    // console.log("Filtered Data:", filteredData);

    // Parse the data and calculate the average PM2.5 concentration for each location
    const locations = d3.group(filteredData, d => d["Local Site Name"]);

    console.log("Locations for PieChart:", locations);

    const geojsonFeatures = [];

    locations.forEach((values, key) => {
      // console.log("Values:", values["coordinates"]);


      
      const groupedData = { Good: 0, Fair: 0, Poor: 0 };
      
      values.forEach(d => {
        if (d["Daily Mean PM2.5 Concentration"] <= 6) groupedData.Good++;
        else if (d["Daily Mean PM2.5 Concentration"] <= 25) groupedData.Fair++;
        else groupedData.Poor++;
      });

      if(key === "naDinosaur National Monument"){
        console.log("Dinosaur National Monument", groupedData);
      }



      geojsonFeatures[key] = groupedData;
  
    });

    const geojson = {
      type: "FeatureCollection",
      features: geojsonFeatures
    };

    console.log("GeoJSON Data:", geojson);

    // Call the callback function with the generated GeoJSON data
    callback(geojson);
  }).catch(function(error) {
    console.error("Error loading or parsing data:", error);
  });
}

export function convertCsvToGeoJsonForAnimation(tempFilePath, callback) {
  console.log("Loading data from file:", tempFilePath);
  // Load the CSV data

  d3.csv(tempFilePath).then(function(data) {
    const locations = d3.group(data, d => d["Local Site Name"]);
    const geojsonFeatures = [];

    locations.forEach((values, key) => {
      const monthlyData = groupbyMonth(values);
      const latitude = +values[0]["Site Latitude"];
      const longitude = +values[0]["Site Longitude"];

      geojsonFeatures.push({
        type: "Feature",
        properties: {
          name: key,
          monthlyData: monthlyData
        },
        geometry: {
          type: "Point",
          coordinates: [longitude, latitude]
        }
      });   
    });

    const geojson = {
      type: "FeatureCollection",
      features: geojsonFeatures
    };

    console.log("GeoJSON Data:", geojson);

    // Call the callback function with the generated GeoJSON data
    callback(geojson);
    
  }).catch(function(error) {
    console.error("Error loading or parsing data:", error);
  });
  
}

// Function to convert CSV data to GeoJSON
export function convertCsvToGeoJson(tempFilePath, callback) {

  console.log("Loading data from file:", tempFilePath);
  // Load the CSV data
  d3.csv(tempFilePath).then(function(data) {
    // Parse the data and calculate the average PM2.5 concentration for each location
    const locations = d3.group(data, d => d["Local Site Name"]);
    
    const geojsonFeatures = [];

    locations.forEach((values, key) => {
      const avgPM25 = d3.mean(values, d => +d["Daily Mean PM2.5 Concentration"]);
      const latitude = +values[0]["Site Latitude"];
      const longitude = +values[0]["Site Longitude"];

      // Group data by season and calculate average PM2.5 for each season
      const seasonalData = groupbySeason(values);

      geojsonFeatures.push({
        type: "Feature",
        properties: {
          name: key,
          avgPM25: avgPM25,
          seasonalData: seasonalData
        },
        geometry: {
          type: "Point",
          coordinates: [longitude, latitude]
        }
      });
    });

    const geojson = {
      type: "FeatureCollection",
      features: geojsonFeatures
    };

    console.log("GeoJSON Data:", geojson);

    // Call the callback function with the generated GeoJSON data
    callback(geojson);
  }).catch(function(error) {
    console.error("Error loading or parsing data:", error);
  });
}