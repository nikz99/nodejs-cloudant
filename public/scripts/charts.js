
function setChart(data) {
    console.log(data);
    Highcharts.chart('container', {
        chart: {
            zoomType: 'x'
        },
        title: {
            text: 'Glucose rate over time'
        },
        subtitle: {
            text: document.ontouchstart === undefined ?
                'Click and drag in the plot area to zoom in' : 'Pinch the chart to zoom in'
        },
        xAxis: {
            type: 'datetime',
                // labels: {
                //     formatter: function () {
                //         console.log(this);
                //         return getTime(this.value);
                //     }
                // },
        },
        yAxis: {
            title: {
                text: 'Sugar level (mmol/L)'
            }
        },
        legend: {
            enabled: false
        },
        plotOptions: {
            area: {
                fillColor: {
                    linearGradient: {
                        x1: 0,
                        y1: 0,
                        x2: 0,
                        y2: 1
                    },
                    stops: [
                        [0, Highcharts.getOptions().colors[0]],
                        [1, Highcharts.Color(Highcharts.getOptions().colors[0]).setOpacity(0).get('rgba')]
                    ]
                },
                marker: {
                    radius: 2
                },
                lineWidth: 1,
                states: {
                    hover: {
                        lineWidth: 1
                    }
                },
                threshold: null
            }
        },

        series: [{
            type: 'area',
            name: 'Surar level (mmol/L)',
            data: data
        }]
    });
}