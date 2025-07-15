import { convertCsvToGeoJsonForHeatMap } from './script.js';

//

const MARGIN = { left: 50, bottom: 20, top: 20, right: 20 };
const CHART_WIDTH = 275;
const CHART_HEIGHT = 300;

export function heatMapSetup(globalState, stationName) {
    // console.log("Creating Heatmap");
    const svg = d3.select("#tooltip-chart-svg")
    .attr("width", CHART_WIDTH)
    .attr("height", CHART_HEIGHT);

    // let tempGeoJson = makeFakeData(globalState.selectedSeason, globalState.selectedYear);
    // console.log("FAKE DATA", tempGeoJson);


    convertCsvToGeoJsonForHeatMap(globalState.data, function(geojson) {
        console.log("Data for HeatMAP: ", geojson);
        updateHeatMap(geojson, stationName, globalState.selectedSeason, globalState.selectedYear);
        
    });

}

function updateHeatMap(geojson, stationName, season, year) {

    const stationData = geojson.features.find(feature => feature.geometry.StationName === stationName);
    if (!stationData) {
        console.error(`No data found for station: ${stationName}`);
        return;
    }

    let inputData = stationData.properties.features;
    const numColumns = 7; // Days in a week for a calendar layout
    const numRows = 5; // Maximum rows for a month
    const spacing = 5; // Space between squares (in pixels)
    const labelHeight = 20
    const squareSize = 12

    const oneGridHeight = squareSize * (numRows) + spacing * (numRows - 1) + labelHeight;


    const monthsList = getSeasonDays(season, year);

    console.log("MONTHS LIST", monthsList);
    // console.log(monthsList.length, monthsList[0][2]);


    const svg = d3.select("#tooltip-chart-svg")
    // Color scale
    const colorScale = d3.scaleOrdinal()
    .domain(["Good", "Fair", "Poor", null])
    .range(["#33ff7d", "#ffea33", "#ff5733", "#d3d3d3"]);

    console.log("REMOVINGGG");

    const parseDate = d3.timeParse("%m/%d/%Y");

    svg.selectAll("g").remove();
    for(let month = 0; month < monthsList.length; month++) {
        console.log("here ", month);
        const fullData = Array.from({ length: monthsList[month][2] }, (_, i) => {
            // const day = `${monthsList[month][1]}${i+1}`;
            const dummyDate = parseDate(`${monthsList[month][0]}/${i+1}/${year}`);
            console.log("DUMMY DATE", dummyDate)
            const existingDay = inputData.find(d => parseDate(d.day).getTime() === dummyDate.getTime());
            console.log("EXISTING DAY", existingDay)
            return existingDay || { day: dummyDate, category: null };
          });
          console.log("FULL DATA", fullData)

        const chart = svg.append("g")
        .attr("class", "heatmap")
        .attr("transform", `translate(${MARGIN.left},${MARGIN.top})`);
        
        chart.append("text")
        .attr("class", "month-label")
        .attr("x", 0)
        .attr("y", (month * oneGridHeight) - 5)
        .text(monthsList[month][1])

        // Draw the squares dynamically
        chart.selectAll(".day")
        .data(fullData)
        .enter()
        .append("rect")
        .attr("class", "day")
        .attr("width", squareSize)
        .attr("height", squareSize)
        .attr("x", (d, i) => (i % numColumns) * (squareSize + spacing))
        .attr("y", (d, i) => (Math.floor(i / numColumns) * (squareSize + spacing)) + (month * oneGridHeight))
        .attr("fill", (d) => colorScale(d.category))
        .attr("stroke", "#ccc");
    }


}

function getSeasonDays(season, year) {
    let days_amnt = []
    if (season == "Winter") {
        days_amnt.push(["12", "December", getDaysInMonth("December", year)])
        days_amnt.push(["01", "January", getDaysInMonth("January", year)])
        days_amnt.push(["02", "February", getDaysInMonth("February", year)])
    }
    else if(season == "Spring") {
        days_amnt.push(["03", "March", getDaysInMonth("March", year)])
        days_amnt.push(["04", "April", getDaysInMonth("April", year)])
        days_amnt.push(["05", "May", getDaysInMonth("May", year)])
    }
    else if(season == "Summer") {
        days_amnt.push(["06", "June", getDaysInMonth("June", year)])
        days_amnt.push(["07", "July", getDaysInMonth("July", year)])
        days_amnt.push(["08", "August", getDaysInMonth("August", year)])
    }
    else if (season == "Fall") {
        days_amnt.push(["09", "September", getDaysInMonth("September", year)])
        days_amnt.push(["10", "October", getDaysInMonth("October", year)])
        days_amnt.push(["11", "November", getDaysInMonth("November", year)])
    }
    console.log("DAYS FOR season: ", season, ", year: ", year, "  ", days_amnt);
    return days_amnt
}

function getDaysInMonth(monthName, year) {
    const monthIndex = new Date(`${monthName} 1, ${year}`).getMonth(); // Convert month name to index
    const nextMonth = new Date(year, monthIndex + 1, 0); // Set to the last day of the month
    return nextMonth.getDate(); // Get the day of the last day (total days)
}

// function makeFakeData(season, year) {
//     // let tempGeoJson = {"tempStationName": [
//     //     { day: 1, category: "Good" },
//     //     { day: 2, category: "Fair" },
//     //     { day: 5, category: "Poor" },
//     //     // Missing days 3, 4, etc.
//     //   ]}

//     let tempGeoJson = {"tempStationName": []}

//     let categories = ["Good", "Fair", "Poor"]
//     const monthsList = getSeasonDays(season, year);
//     for(let month = 0; month < monthsList.length; month++) {
//         for(let i = 0; i < monthsList[month][2]; i++) {
//             tempGeoJson["tempStationName"].push({day:`${monthsList[month][1]}${i+1}`, category:categories[Math.floor(Math.random() * 3)]})
//         }
//     }

//     return tempGeoJson
// }