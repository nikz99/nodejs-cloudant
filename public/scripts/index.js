// index.js

var elem = $('.dropdown-trigger').dropdown({
    inDuration: 300,
    outDuration: 225,
    hover: true, // Activate on hover
    belowOrigin: true, // Displays dropdown below the button
    alignment: 'right' // Displays dropdown with edge aligned to the left of button
});
var REST_DATA = 'api/glucosedata';
var USERS = 'api/getUsers';
var KEY_ENTER = 13;
var defaultItems = [

];
let groupedData;

function encodeUriAndQuotes(untrustedStr) {
    return encodeURI(String(untrustedStr)).replace(/'/g, '%27').replace(')', '%29');
}

function loadItems() {
    xhrGet(REST_DATA, function (data) {
        data = data.sort(function (a, b) {
            return parseFloat(a.name) - parseFloat(b.name);
        })
        data = data.map(d => { d.value.timestamp = parseFloat(d.name); return d; })
        console.log(data);
        groupedData = _.chain(data.map(d => d.value))
            .groupBy("name")
            .toPairs()
            .value();

        patients = groupedData.map(d => d[0]);
        patients.forEach(p => {
            $("#dropdown1").append(`
            <li>
    			<a href="#!" onclick="selectPatient('`+ p + `')" >` + p + `</a>
    		</li>
            `)
        })
        patientsData = groupedData.map(d => ({ name: d[0], data: d[1].map(i => [i.timestamp, i.sugarLevel]) }));

        selectChartOf(patients[0]);
        setTableData(patients[0]);
    }, function (err) {
        console.error(err);
    });

    // xhrGet(USERS, undefined, function (patients) {
    //     patients.forEach(p => {
    //         $("#dropdown1").append(`
    //         <li>
    // 			<a href="#!" onclick="selectPatient('`+ p + `')" >` + p + `</a>
    // 		</li>
    //         `)
    //     });
    // }, function (err) {
    //     console.error(err);
    // });

    // xhrGet('api/userGlucoseData?name=Prajwal', function (patients) {

    // }, function (err) {
    //     console.error(err);
    // });
}


window.selectPatient = function (name) {
    selectChartOf(name);
    setTableData(name);
}

function selectChartOf(name) {
    let patient = patientsData.filter(e => e.name == name)[0];
    setChart(patient.data);
}
function getTime(timestamp) {

    var date = new Date(timestamp).toLocaleString();



    console.log(date);

    // Hours part from the timestamp

    // var hours = date.getUTCHours();
    // Minutes part from the timestamp
    //var minutes = "0" + date.getUTCMinutes();
    // Seconds part from the timestamp
    //var seconds = "0" + date.getUTCSeconds();

    // Will display time in date:10:30:23 format
    // var formattedTime = dateDay +':' + hours + ':' + minutes.substr(-2) + ':' + seconds.substr(-2);

    return date;
}


function setTableData(name) {
    $("#details").children('tbody').html('');
    let data = groupedData.filter(e => e[0] == name)[0][1];
    let count = 0;
    for (let i = data.length - 1; i >= 0; i-- , count++) {
        if (count >= 1000)
            break;
        let details = data[i];
        let row = "<td>" + getTime(details.timestamp) + "</td>";
        row += "<td>" + details.name + "</td>";
        row += "<td>" + details.sugarLevel + "</td>";
        let riskClass = '';
        switch (details.criticality) {
            case 'NO RISK':
                riskClass = 'green';
                break;
            case 'MEDIUM':
                riskClass = 'yellow';
                break;
            case 'HIGH':
                riskClass = 'red';
                break;
            case 'VERY HIGH':
                riskClass = 'red glow';
                break;
        }
        row += "<td> <span class='badge " + riskClass + "'>" + details.criticality + "</span></td>";
        row += "<td>" + details.action + "</td>";
        $("#details").children('tbody').append("<tr>" + row + "</tr>");
    }

}
loadItems();