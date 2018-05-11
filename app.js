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
    selectedEventType1 = barChartEvents[0],
    colors = Highcharts.getOptions().colors,
    brightness,
    chartA,
    chartB,
    chartCData = organizeByKey(selectedEventType1.data, 'ship', 'severity');
let pieEvents = organizeByKey(selectedEventType1.data, 'eventType2', 'eventType3');
console.log(chartCData);
buildPieChart(pieEvents, "Fire/Explosion");
buildShipSeverityData();

/////////////////////////////
//     Chart Updater       //
/////////////////////////////

function updateSubCharts(category) {
  var ix = barChartCategories.indexOf(category);
  selectedEventType1 = barChartEvents[ix];
  pieEvents = organizeByKey(selectedEventType1.data, 'eventType2', 'eventType3');
  let isUpdate = true;
  buildPieChart(pieEvents, category, isUpdate);
  // chartB.update({
  //   title: {
  //     text: category
  //   },
  //   series: [{
  //     name: 'Event Type 2',
  //     data: et2Data,
  //     size: '60%',
  //     dataLabels: {
  //       formatter: function () {
  //         return this.y > 5 ? this.point.name : null;
  //       },
  //       color: '#ffffff',
  //       distance: -30
  //     }
  //   }, {
  //     name: 'Event Type 3',
  //     data: et3Data,
  //     size: '80%',
  //     innerSize: '60%',
  //     dataLabels: {
  //       formatter: function () {
  //         // display only if larger than 1
  //         return this.y > 1 ? '<b>' + this.point.name + ':</b> ' +
  //           this.y + '%' : null;
  //       }
  //     },
  //     id: 'versions'
  //   }],
  // })
}

//////////////////////////
// Bar Chart (Chart A)  //
//////////////////////////

var chartA = Highcharts.chart('chart-a', { 
  chart: {
    type: 'column'
  },
  title: {
    text: 'Event Types'
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


function buildPieChart(pieEvents, pieTitle, update)
{
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
  if(!update) { 
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
  } else {
    
    chartB.update({
      title: {
        text: pieTitle
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
    })
  }
}


//////////////////////////////////
// Chart C (Ship then Severity) //
//////////////////////////////////
function buildShipSeverityData() {


  var chartC = Highcharts.chart('chart-c', {
    chart: {
      type: 'column'
    },
    title: {
      text: 'Monthly Average Rainfall'
    },
    subtitle: {
      text: 'Source: WorldClimate.com'
    },
    xAxis: {
      categories: arrayFromKey(chartCData,'name'),
      crosshair: true
    },
    yAxis: {
      min: 0,
      title: {
        text: 'Rainfall (mm)'
      }
    },
    tooltip: {
      headerFormat: '<span style="font-size:10px">{point.key}</span><table>',
      pointFormat: '<tr><td style="color:{series.color};padding:0">{series.name}: </td>' +
        '<td style="padding:0"><b>{point.y:.1f} mm</b></td></tr>',
      footerFormat: '</table>',
      shared: true,
      useHTML: true
    },
    plotOptions: {
      column: {
        pointPadding: 0.2,
        borderWidth: 0
      }
    },
    series: [{
      name: 'Tokyo',
      data: [49.9, 71.5, 106.4, 129.2, 144.0, 176.0, 135.6, 148.5, 216.4, 194.1, 95.6, 54.4]

    }, {
      name: 'New York',
      data: [83.6, 78.8, 98.5, 93.4, 106.0, 84.5, 105.0, 104.3, 91.2, 83.5, 106.6, 92.3]

    }, {
      name: 'London',
      data: [48.9, 38.8, 39.3, 41.4, 47.0, 48.3, 59.0, 59.6, 52.4, 65.2, 59.3, 51.2]

    }, {
      name: 'Berlin',
      data: [42.4, 33.2, 34.5, 39.7, 52.6, 75.5, 57.4, 60.4, 47.6, 39.1, 46.8, 51.1]

    }]
  });
}

