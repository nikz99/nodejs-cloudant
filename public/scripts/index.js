// index.js

var elem = $('.dropdown-trigger').dropdown({
    inDuration: 300,
    outDuration: 225,
    hover: true, // Activate on hover
    belowOrigin: true, // Displays dropdown below the button
    alignment: 'right' // Displays dropdown with edge aligned to the left of button
});
var REST_DATA = 'api/glucosedata';
var KEY_ENTER = 13;
var defaultItems = [

];

function encodeUriAndQuotes(untrustedStr) {
    return encodeURI(String(untrustedStr)).replace(/'/g, '%27').replace(')', '%29');
}

function loadItems() {
    xhrGet(REST_DATA, function (data) {
        data = data.map(d => { d.value.timestamp = d.name; return d; })
        data.forEach(patientData => {
            const details = patientData.value;
            let row = "<td>" + details.name + "</td>";
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
                    break; m_.chain(data.map(d => d.value))
                        .groupBy("name")
                        .toPairs()
                        .value();
                case 'VERY HIGH':
                    riskClass = 'red glow';
                    break;
            }
            row += "<td> <span class='badge " + riskClass + "'>" + details.criticality + "</span></td>";
            row += "<td>" + details.action + "</td>";
            $("#details").children('tbody').append("<tr>" + row + "</tr>");
        });

        const groupedData = _.chain(data.map(d => d.value))
            .groupBy("name")
            .toPairs()
            .value();

        patients = groupedData.map(d => d[0]);
        patients.forEach(p => {
            $("#dropdown1").append(`
            <li>
				<a href="#!" onclick="selectPatient('`+ p + `')">` + p + `</a>
			</li>
            `)
        })
        patientsData = groupedData.map(d => ({ name: d[0], data: d[1].map(i => [i.timestamp, i.sugarLevel]) }));

        setChart(patientsData[2].data);
    }, function (err) {
        console.error(err);
    });
}


window.selectPatient = function (e) {
    selectChartOf(e);
}

function selectChartOf(name) {
    let patient = patientsData.filter(e => e.name == name)[0];
    setChart(patient.data);
}
loadItems();