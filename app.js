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
    selectedPie = barChartEvents[0],
    pieEvents = organizeByKey(selectedPie.data, 'eventType2', 'eventType3'),
    colors = Highcharts.getOptions().colors,
    brightness,
    et2Data = [],
    et3Data = [];

buildPieData();

/////////////////////////////
//     Chart Updater       //
/////////////////////////////

function updateSubCharts(category) {
  console.log('we made it this far with ' + category);
  var ix = barChartCategories.indexOf(category);
  selectedPie = barChartEvents[ix];
  pieEvents = organizeByKey(selectedPie.data, 'eventType2', 'eventType3'),
  buildPieData();
  chartB.update({
    title: {
      text: category
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


function buildPieData()
{
  et2Data = [];
  et3Data = [];
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

}

var chartB = Highcharts.chart('chart-b', {
  chart: {
    type: 'pie'
  },
  title: {
    text: barChartEvents[0].name
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
