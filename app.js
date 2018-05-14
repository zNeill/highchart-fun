// Ensuring data.js in scope
// console.log(srcJSON);

// Polyfills needed if not using ES6+ browser
// array.prototype.findIndex
// array.prototype.filter


////////////////
// globals    //
////////////////

const srcJSON = oldsrcJSON.filter(function(obj) {
  return (obj.ship !== "MEIN SCHIFF" && obj.ship !== "MEIN SCHIFF 3" && obj.ship !== "MEIN SCHIFF 4" && obj.ship !== "MEIN SCHIFF 5"); 
});

const colors = ["#2e84bf", "#434348", "#d9534f", "#f7a35c", "#3b6aa0", "#f15c80", "#e4d354", "#2b908f", "#f45b5b", "#91e8e1"],
      originalcolors = Highcharts.getOptions().colors;
var barChartCategories,
    barChartEvents;

// Function for finding and counting unique values given an
function findUniques(obj, key)
{
  let uniques = [];
  for(let i = 0; i < obj.length; i++)
  {
    if(uniques.indexOf(obj[i][key]) < 0) uniques.push(obj[i][key]); 
  }
  return uniques;
}

// rounding (shrug)
function round(number, precision) {
  let shift = function (number, precision) {
    let numArray = ("" + number).split("e");
    return +(numArray[0] + "e" + (numArray[1] ? (+numArray[1] + precision) : precision));
  };
  return shift(Math.round(shift(number, +precision)), -precision);
}

/// Returns array of objects organized by the unique values for a given key.
/// Optional subkey MUST only exist within 
function organizeByKey(obj,key,subkey)
{
  let newObjects = [];
  let uArr = findUniques(obj,key);
  let objsTotal = 0;

  for(let i = 0; i < uArr.length; i++)
  {
    let newObj = {};
    newObj.name = uArr[i];
    newObj.data = obj.filter(function(elem) {
      return elem[key] == uArr[i];
    });
    newObj.count = newObj.data.length;
    objsTotal += newObj.count;
    newObjects.push(newObj);
  }
  newObjects.sort(function(a, b) {
    return b.count - a.count; //descending
  });

  for(let i = 0; i < newObjects.length; i++)
  {
    newObjects[i].pct = (newObjects[i].count / objsTotal) * 100; //pie chart adjustment
    if(subkey) {
      newObjects[i].subObjects = organizeByKey(newObjects[i].data,subkey);
      for(let j = 0; j < newObjects[i].subObjects.length; j++)
      {
        newObjects[i].subObjects[j].pct = (newObjects[i].subObjects[j].count / objsTotal) * 100;
      }
    }
  }
  return newObjects;
}

// Returns 1D array for given property
function arrayFromKey(obj,key)
{
  let newArray = [];
  for(let i = 0; i < obj.length; i++)
  {
    newArray.push(obj[i][key]);
  }
  return newArray;
}

//prepareBarChartInitData
function barChartInitData(currentArr) {
  const result = [];
  for(let i = 0; i < currentArr.length; i++)
  {
    let colour = (i == 0 ? colors[2] : colors[0]);
    result.push({
      y: currentArr[i],
      color: colour
    })
  }
  return result;
}

////////////////////
// "Main"  C ftw! //
////////////////////

function main() {
  barChartEvents = organizeByKey(srcJSON, 'eventType1', 'eventType2');
  let initEventType1 = barChartEvents[0];
  buildChartA(barChartEvents);
  buildPieChart(initEventType1);
  buildShipSeverityData(initEventType1);
  buildLocationPieChart(initEventType1);
  buildRootCauseChart(initEventType1);
  buildContribFactorChart(initEventType1);
}

/////////////////////////////
//     Chart Updater       //
/////////////////////////////

function updateSubCharts(category) {
  let ix = barChartCategories.indexOf(category);
  let selectedEventType1 = barChartEvents[ix];
  // let isUpdate = true;
  buildPieChart(selectedEventType1); //, isUpdate);
  buildShipSeverityData(selectedEventType1);
  buildLocationPieChart(selectedEventType1);
  buildContribFactorChart(selectedEventType1);
  buildRootCauseChart(selectedEventType1);
}

//////////////////////////
// Bar Chart (Chart A)  //
//////////////////////////
function buildChartA(barChartEvents)
{
  
  barChartCategories = arrayFromKey(barChartEvents, 'name');
  let barChartCounts = barChartInitData(arrayFromKey(barChartEvents, 'count'));
  const chartA = Highcharts.chart('chart-a', { 
    chart: {
      type: 'column', 
    },
    colors: colors,
    title: {
      text: 'Event Types'
    },
    subtitle: {
      text: 'Click on a data point to see detail in subsequent charts'
    },
    xAxis: {
      categories: barChartCategories,
      crosshair: true
    },
    yAxis: {
      min: 0,
      title: {
        enabled: false
      }
    },
    credits: {
      enabled: false
    },
    navigation: {
      buttonOptions: {
        enabled: false
      }
    },
    plotOptions: {
      column: {
        pointPadding: 0.2,
        borderWidth: 0
      }
    },
    legend: {
      enabled: false
    },
    tooltip: {
      enabled: false
    },
    series: [{
      name: 'Events',
      data: barChartCounts,
      events: {
        click: function(event) {
          for (let i = 0; i < this.data.length; i++) {
            this.data[i].color = colors[0];
          }
          event.point.update({color: colors[2]}, true, true);
          updateSubCharts(event.point.category);
        }
      },
      dataLabels: {
        enabled: true
      }
    }]

  });
}
////////////////////////////
//  Pie Chart (Chart B)   //
////////////////////////////


function buildPieChart(selected) //add update as third param if disabling always-animate
{
  pieEvents = organizeByKey(selected.data, 'eventType2', 'eventType3');
  let pieTitle = 'Types of ' + selected.name + ' events';
  let et2Data = [];
  let et3Data = [];
  // Build the data arrays
  for (let i = 0; i < pieEvents.length; i++) {

    //build tier 2 data (inner pie)
    et2Data.push({
      name: pieEvents[i].name,
      y: round(pieEvents[i].pct, 2),
      color: colors[i]
    });

    // build tier 3 data (outer pie)
    for (let j = 0; j < pieEvents[i].subObjects.length; j++) {
      let brightness = 0.2 - (j / pieEvents[i].subObjects.length) / 5;
      et3Data.push({
        name: pieEvents[i].subObjects[j].name,
        y: round(pieEvents[i].subObjects[j].pct, 2),
        color: Highcharts.Color(colors[i]).brighten(brightness).get()
      });
    }
  }

  // uncomment disable "always animating"
  // if(!update) { 
  chartB = Highcharts.chart('chart-b', {
    chart: {
      type: 'pie'
    },
    title: {
      text: pieTitle
    },
    yAxis: {
      title: {
        text: 'events'
      }
    },
    plotOptions: {
      pie: {
        shadow: false,
        center: ['50%', '50%']
      }
    },
    navigation: {
      buttonOptions: {
        enabled: false
      }
    },
    credits: {
      enabled: false
    },
    tooltip: {
      enabled: false
    },
    series: [{
      name: 'Event SubType',
      data: et2Data,
      size: '60%',
      dataLabels: {
        formatter: function () {
          return this.y > 5 ? this.point.name + ': ' + this.y + '%' : null;
        },
        distance: -20
      }
    }, {
      name: 'Event Sub-SubType',
      data: et3Data,
      size: '80%',
      innerSize: '60%',
      dataLabels: {
        formatter: function () {
          // display only if larger than 1
          return this.y > 1.6 ? '<b>' + this.point.name + ':</b> ' +
            this.y + '%' : null;
        },
        distance: 50
      },
      id: 'versions'
    }],
    responsive: {
      rules: [{
        condition: {
          maxWidth: 500,
        },
        chartOptions: {
          series: [{
            id: 'versions',
            dataLabels: {
              enabled: false
            }
          }]
        }
      }]
    }
  });
  
  // DISABLED FUNCTIONALITY FOR SMOOTH (NON ANIMATED) CHART UPDATE
  // } else {
  //   chartB.update({
  //     title: {
  //       text: pieTitle
  //     },
  //     series: [{
  //       name: 'Event Type 2',
  //       data: et2Data,
  //       size: '60%',
  //       dataLabels: {
  //         formatter: function () {
  //           return this.y > 5 ? this.point.name : null;
  //         },
  //         color: '#ffffff',
  //         distance: -30
  //       }
  //     }, {
  //       name: 'Event Type 3',
  //       data: et3Data,
  //       size: '80%',
  //       innerSize: '60%',
  //       dataLabels: {
  //         formatter: function () {
  //           // display only if larger than 1
  //           return this.y > 1 ? '<b>' + this.point.name + ':</b> ' +
  //             this.y + '%' : null;
  //         }
  //       },
  //       id: 'versions'
  //     }],
  //   });
  // }
}


//////////////////////////////////
// Chart C (Ship then Severity) //
//////////////////////////////////
function buildShipSeverityData(selectedEventType1) // , update)
{
  let byShip = organizeByKey(selectedEventType1.data, 'ship', 'severity');
  let shipList = arrayFromKey(byShip, 'name');
  let sLevels = findUniques(srcJSON, 'severity');
  let chartTitle = selectedEventType1.name + ' events by Ship';
  let chartSeries = [];
  sLevels.sort();
  // console.log(sLevels);
  // console.info(byShip);

  //itierate through levels to build the series
  for(let i = 0; i < sLevels.length; i++)
  {
    chartSeries.push({
      name: sLevels[i],
      data: [],
      dataLabels: {
        formatter: function() {
          //TODO Fix this
          return (this.y > 0 ? this.y : null);
        }
      }
    });
    for(let j = 0; j < byShip.length; j++)
    {
      let currentShip = byShip[j].name;
      // console.log('i is ' + i + '\n j is ' + j + '\n current level is ' + sLevels[i] + '\n current ship is ' + currentShip + '\n objects of ship are: \n'); console.log(byShip[j].subObjects);
      let filteredSubObjects = byShip[j].subObjects.filter(function(elem) {
        return elem.name == sLevels[i];
      });
      chartSeries[i].data.push(filteredSubObjects[0] ? filteredSubObjects[0].count : 0);
    } 
  }

  let chartC = Highcharts.chart('chart-c', {
    chart: {
      type: 'column'
    },
    title: {
      text: chartTitle
    },
    xAxis: {
      categories: shipList
    },
    colors: ["#444444",  "#AAAAAA", "#ff9806", "#fd2e05", "#434348", "#3b6aa0", "#f15c80", "#e4d354", "#2b908f", "#f45b5b", "#91e8e1"],
    yAxis: {
      min: 0,
      title: {
        enabled: false
      },
      
    },

    navigation: {
      buttonOptions: {
        enabled: false
      }
    },
    credits: {
      enabled: false
    },
    
    legend: {
      align: 'right',
      x: -30,
      verticalAlign: 'top',
      y: 40,
      floating: true,
      backgroundColor: (Highcharts.theme && Highcharts.theme.background2) || 'white',
      borderColor: '#CCC',
      borderWidth: 1,
      shadow: false
    },
    tooltip: {
      enabled:false
      // headerFormat: '<b>{point.x}</b><br/>',
      // pointFormat: '{point.y} events with a severity level of <em>{point.series.name}</em>'
    },
    plotOptions: {
      column: {
        pointPadding: 0.2,
        borderWidth: 0,
        dataLabels: {
          enabled: true
        }
      }
    },
    series: chartSeries
  });
}

///////////////////////////////
// Chart D (Location Pie)    //
///////////////////////////////

function buildLocationPieChart(selected)
{
  let locationData = organizeByKey(selected.data, 'eventLocation');
  let chartSeries = [];
  let chartTitle = selected.name + ' locations';
  for(let i = 0; i < locationData.length; i++)
  {
    chartSeries.push({
      name: locationData[i].name,
      y: locationData[i].pct
    });
  }
  chartSeries[0].sliced = true;
  chartSeries[0].selected = true;

  let chartD = Highcharts.chart('chart-d', {
    chart: {
      plotBackgroundColor: null,
      plotBorderWidth: null,
      plotShadow: false,
      type: 'pie'
    },
    title: {
      text: chartTitle
    },
    tooltip: {
      enabled: false
      // pointFormat: '{series.name}: <b>{point.percentage:.1f}%</b>'
    },
    plotOptions: {
      pie: {
        allowPointSelect: true,
        cursor: 'pointer',
        dataLabels: {
          enabled: true
        },
        showInLegend: false
      }
    },
    colors: colors,
    navigation: {
      buttonOptions: {
        enabled: false
      }
    },
    credits: {
      enabled: false
    },
    series: [{
      name: 'Locations',
      colorByPoint: true,
      data: chartSeries,
      dataLabels: {formatter: function () {
        // display only if larger than 1
        return this.y > 1 ? '<b>' + this.point.name + ':</b> ' +
          round(this.y,2) + '%' : null;
      }}
    }]
  });
}

/////////////////////////////
// Chart E (Root Causes)   //
/////////////////////////////

function buildRootCauseChart(selected)
{
  let rcData = selected.data;

  //append full name of cause to data
  for(let i = 0; i < rcData.length; i++)
  {
    let thisCode = rcData[i].rootCode;
    let rcix = causeCodes.findIndex(function(elem) {
      return elem['code'] == thisCode;
    });
    if(rcix == -1) console.log(thisCode);
    let codeFullName = causeCodes[rcix].rcname;
    rcData[i].fullname = codeFullName;
  }

  let rcWithName = organizeByKey(rcData, 'fullname');
  let rcTopTen = [];
  for(let i = 0; i < Math.min(rcWithName.length, 10); i++)
  {
    rcTopTen.push(rcWithName[i]);
  }
  //console.log(rcTopTen);

  const chartE = Highcharts.chart('chart-e',{
    chart: {
      type: 'bar'
    },
    title: {
      text: 'Root Causes for ' + selected.name + ' events'
    },
    colors: colors,
    xAxis: {
      categories: arrayFromKey(rcTopTen,'name'),
      title: {
        text:null
      }
    },
    yAxis: {
      min: 0,
      title: {
        enabled:false
      },
    },
    plotOptions: {
      bar: {
        dataLabels: {
          enabled: true
        }
      }
    },
    tooltip: {
      enabled: false
      // formatter: function() {
      //   let foundx = this.x;
      //   let rcix = causeCodes.findIndex(function(elem) {
      //     return elem['code'] == foundx;
      //   });
      //   // console.log(rcix);
      //   let codeFullName = causeCodes[rcix].rcname;
      //   return "<b>" + codeFullName + "</b>";
      // }
    },
    legend: {
      enabled: false
    },
    credits: {
      enabled: false
    },
    navigation: {
      buttonOptions: {
        enabled: false
      }
    },
    series: [{
      name: 'Root Cause',
      data: arrayFromKey(rcTopTen,'count')
    }]
  });

}
/////////////////////////////////////
// Chart F (Contributing Factors) ///
/////////////////////////////////////

function buildContribFactorChart(selected)
{
  // console.log(selected);
  const allFactors = [];
  for(let i = 0; i < selected.data.length; i++)
  {
    if(!selected.data[i].contribFactors)
    {
      selected.data[i].contribFactors = ['No Contributing Factors Reported'];
    }
    for(let j = 0; j < selected.data[i].contribFactors.length; j++)
    {
      
      // const filteredFactors = allFactors.filter(function(elem) {
      //   return elem[name] === selected.data[i].contribFactors[j];
      // });

      let inx = allFactors.findIndex(function(elem){
        return elem.name == selected.data[i].contribFactors[j];
      });

      if(inx < 0)
      {
        allFactors.push({
          name: selected.data[i].contribFactors[j],
          x: 1
        });
      } else //factor already exists
      {
        allFactors[inx].x += 1;
      }
    }
  }
  allFactors.sort(function(a, b) {
    return b.x - a.x; //descending
  });
  let topTenFactors = [];
  for(let i = 0; i < Math.min(allFactors.length, 10); i++)
  {
    topTenFactors.push(allFactors[i]);
  }
  
  // console.log(allFactors);

  const chartF = Highcharts.chart('chart-f',{
    chart: {
      type: 'bar'
    },
    title: {
      text: 'Top contributing factors for ' + selected.name + ' events'
    },
    colors: colors,
    xAxis: {
      categories: arrayFromKey(topTenFactors,'name'),
      title: {
        text: null
      }
    },
    tooltip: {
      enabled: false
      // formatter: function() {
      //   return '<b>'+ this.x + '</b> was a factor in ' + this.y + ' different ' + selected.name + '  events';      } 
    },
    yAxis: {
      min: 0,
      title: {
        text: null
      }
    },
    plotOptions: {
      bar: {
        dataLabels: {
          enabled: true
        }
      }
    },
    legend: {
      enabled: false
    },
    credits: {
      enabled: false
    },
    navigation: {
      buttonOptions: {
        enabled: false
      }
    },
    series: [{
      name: 'Contributing Factors',
      data: arrayFromKey(topTenFactors,'x')
    }]
  });
}


//////////////////
// Initial Call //
//////////////////
main();
