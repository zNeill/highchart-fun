// Ensuring data.js in scope
// console.log(srcJSON);

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
  var shift = function (number, precision) {
    var numArray = ("" + number).split("e");
    return +(numArray[0] + "e" + (numArray[1] ? (+numArray[1] + precision) : precision));
  };
  return shift(Math.round(shift(number, +precision)), -precision);
}

/// Returns array of objects organized by the unique values for a given key.
/// Optional subkey MUST only exist within 
function organizeByKey(obj,key,subkey)
{
  var newObjects = [];
  var uArr = findUniques(obj,key);
  var objsTotal = 0;

  for(var i = 0; i < uArr.length; i++)
  {
    var newObj = {};
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

  for(var i = 0; i < newObjects.length; i++)
  {
    newObjects[i].pct = (newObjects[i].count / objsTotal) * 100; //pie chart adjustment
    if(subkey) {
      newObjects[i].subObjects = organizeByKey(newObjects[i].data,subkey);
      for(var j = 0; j < newObjects[i].subObjects.length; j++)
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
  var newArray = [];
  for(var i = 0; i < obj.length; i++)
  {
    newArray.push(obj[i][key]);
  }
  return newArray;
}


/////////////////////////////
// "Main" (if this were C) //
/////////////////////////////


// Sorry for global variable pollution, world
var barChartEvents = organizeByKey(srcJSON, 'eventType1', 'eventType2'),
    barChartCategories = arrayFromKey(barChartEvents, 'name'),
    barChartCounts = arrayFromKey(barChartEvents, 'count'),
    originalcolors = Highcharts.getOptions().colors,
    colors = ["#2e84bf", "#434348", "#d9534f", "#f7a35c", "#3b6aa0", "#f15c80", "#e4d354", "#2b908f", "#f45b5b", "#91e8e1"],
    brightness,
    chartA,
    chartB;
let selectedEventType1 = barChartEvents[0];

buildPieChart(selectedEventType1);
buildShipSeverityData(selectedEventType1);

/////////////////////////////
//     Chart Updater       //
/////////////////////////////

function updateSubCharts(category) {
  var ix = barChartCategories.indexOf(category);
  selectedEventType1 = barChartEvents[ix];
  // let isUpdate = true;
  buildPieChart(selectedEventType1); //, isUpdate);
  buildShipSeverityData(selectedEventType1);
}

//////////////////////////
// Bar Chart (Chart A)  //
//////////////////////////

var chartA = Highcharts.chart('chart-a', { 
  chart: {
    type: 'column'
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
      text: 'Number of Events'
    }
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
  series:
  [{
    name: 'Events',
    data: barChartCounts,
    events: {
      click: function(event) {
        updateSubCharts(event.point.category);
      }
    }
  }]});

////////////////////////////
//  Pie Chart (Chart B)   //
////////////////////////////


function buildPieChart(selectedEventType1) //add update as third param if disabling always-animate
{
  pieEvents = organizeByKey(selectedEventType1.data, 'eventType2', 'eventType3');
  let pieTitle = 'Types of ' + selectedEventType1.name + ' events';
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
      brightness = 0.2 - (j / pieEvents[i].subObjects.length) / 5;
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
      tooltip: {
        valueSuffix: '%'
      },
      series: [{
        name: 'Event Type 2',
        data: et2Data,
        size: '60%',
        dataLabels: {
          formatter: function () {
            return this.y > 5 ? this.point.name : null;
          },
          color: '#ffffff',
          distance: -30
        }
      }, {
        name: 'Event Type 3',
        data: et3Data,
        size: '80%',
        innerSize: '60%',
        dataLabels: {
          formatter: function () {
            // display only if larger than 1
            return this.y > 1 ? '<b>' + this.point.name + ':</b> ' +
              this.y + '%' : null;
          }
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
  for(var i = 0; i < sLevels.length; i++)
  {
    chartSeries.push({
      name: sLevels[i],
      data: []
    });
    for(var j = 0; j < byShip.length; j++)
    {
      let currentShip = byShip[j].name;
      // console.log('i is ' + i + '\n j is ' + j + '\n current level is ' + sLevels[i] + '\n current ship is ' + currentShip + '\n objects of ship are: \n'); console.log(byShip[j].subObjects);
      let filteredSubObjects = byShip[j].subObjects.filter(function(elem) {
        return elem.name == sLevels[i];
      });
      chartSeries[i].data.push(filteredSubObjects[0] ? filteredSubObjects[0].count : 0);
    } 
  }

  var chartC = Highcharts.chart('chart-c', {
     chart: {
        type: 'column'
    },
    title: {
        text: chartTitle
    },
    subtitle: {
      text: 'Click on legend to filter by severity'
    },
    xAxis: {
        categories: shipList
    },
    colors: ["#2e84bf",  "#f7a35c", "#d9534f", "#434348", "#3b6aa0", "#f15c80", "#e4d354", "#2b908f", "#f45b5b", "#91e8e1"],
    yAxis: {
        min: 0,
        title: {
            text: 'Total number of events'
        },
        stackLabels: {
            enabled: true,
            style: {
                fontWeight: 'bold',
                color: (Highcharts.theme && Highcharts.theme.textColor) || 'gray'
            }
        }
    },

    navigation: {
      buttonOptions: {
        enabled: false
      }
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
        headerFormat: '<b>{point.x}</b><br/>',
        pointFormat: '{series.name}: {point.y}<br/>Total: {point.stackTotal}'
    },
    plotOptions: {
        column: {
            stacking: 'normal',
            dataLabels: {
                enabled: true,
                color: (Highcharts.theme && Highcharts.theme.dataLabelsColor) || 'white'
            }
        }
    },
    series: chartSeries
  });
}

