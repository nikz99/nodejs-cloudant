/**
 * Module dependencies.
 */

var express = require('express'),
    routes = require('./routes'),
    user = require('./routes/user'),
    http = require('http'),
    url = require('url'),
    path = require('path'),
    fs = require('fs'),
    request = require('request'),
    twilio = require('twilio');

var app = express();

var db;

var cloudant;

var fileToUpload;

var dbCredentials = {
    dbName: 'my_sample_db'
};

var levelConfig = JSON.parse(fs.readFileSync('limits.json', 'utf8'));
// console.log(levelConfig);

var bodyParser = require('body-parser');
var methodOverride = require('method-override');
var logger = require('morgan');
var errorHandler = require('errorhandler');
var multipart = require('connect-multiparty')
var multipartMiddleware = multipart();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.engine('html', require('ejs').renderFile);
app.use(logger('dev'));
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());
app.use(methodOverride());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/style', express.static(path.join(__dirname, '/views/style')));

// development only
if ('development' == app.get('env')) {
    app.use(errorHandler());
}

function getDBCredentialsUrl(jsonData) {
    var vcapServices = JSON.parse(jsonData);
    // Pattern match to find the first instance of a Cloudant service in
    // VCAP_SERVICES. If you know your service key, you can access the
    // service credentials directly by using the vcapServices object.
    for (var vcapService in vcapServices) {
        if (vcapService.match(/cloudant/i)) {
            return vcapServices[vcapService][0].credentials.url;
        }
    }
}

function initDBConnection() {
    //When running on Bluemix, this variable will be set to a json object
    //containing all the service credentials of all the bound services
    if (process.env.VCAP_SERVICES) {
        dbCredentials.url = getDBCredentialsUrl(process.env.VCAP_SERVICES);
    } else { //When running locally, the VCAP_SERVICES will not be set

        // When running this app locally you can get your Cloudant credentials
        // from Bluemix (VCAP_SERVICES in "cf env" output or the Environment
        // Variables section for an app in the Bluemix console dashboard).
        // Once you have the credentials, paste them into a file called vcap-local.json.
        // Alternately you could point to a local database here instead of a
        // Bluemix service.
        // url will be in this format: https://username:password@xxxxxxxxx-bluemix.cloudant.com
        dbCredentials.url = getDBCredentialsUrl(fs.readFileSync("vcap-local.json", "utf-8"));
    }

    cloudant = require('cloudant')(dbCredentials.url);

    // check if DB exists if not create
    cloudant.db.create(dbCredentials.dbName, function (err, res) {
        if (err) {
            console.log('Could not create new db: ' + dbCredentials.dbName + ', it might already exist.');
        }
    });

    db = cloudant.use(dbCredentials.dbName);
}

initDBConnection();

app.get('/', routes.index);

app.get('/trigger', function (request, response) {
    response.render('trigger.html');
    response.end();
});


function createResponseData(id, name, value, attachments) {

    var responseData = {
        id: id,
        name: sanitizeInput(name),
        value: value,
        attachements: []
    };


    attachments.forEach(function (item, index) {
        var attachmentData = {
            content_type: item.type,
            key: item.key,
            url: '/api/favorites/attach?id=' + id + '&key=' + item.key
        };
        responseData.attachements.push(attachmentData);

    });
    return responseData;
}

function sanitizeInput(str) {
    return String(str).replace(/&(?!amp;|lt;|gt;)/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

var saveDocument = function (id, name, value, response) {

    if (id === undefined) {
        // Generated random id
        id = '';
    }

    db.insert({
        name: name,
        value: value
    }, id, function (err, doc) {
        if (err) {
            console.log(err);
            response.sendStatus(500);
        } else
            response.sendStatus(200);
        response.end();
    });

}

// setInterval(() => {
//     triggerDevice();
// }, 5000);

function getDataFromMockaroo() {
    try {
        request('https://my.api.mockaroo.com/sugar_levels.json?key=a9ca3c60', function (error, response, body) {
            const data = [];
            console.log('Data received - ', body);
            body = JSON.parse(body);
            body.forEach(patient => {
                let patientStatus = checkSugarLevel(patient);
                setTimeout(() => {
                    db.insert({
                        name: (new Date()).getTime(),
                        value: patientStatus
                    }, '', function (err, doc) {
                        if (err)
                            console.log(err);
                        else
                            console.log('Successfully added record');
                    });
                }, 1000);
            })
        });
    } catch (e) {
        console.log('Interval job error occured : ', e)
    }
}
function getSavedMockData() {
    const body = JSON.parse(fs.readFileSync('data.json', 'utf8'));
    try {
        const data = [];
        console.log('Data received - ', body);
        body.forEach(patient => {
            let patientStatus = checkSugarLevel(patient);
            setTimeout(() => {
                db.insert({
                    name: (new Date()).getTime(),
                    value: patientStatus
                }, '', function (err, doc) {
                    if (err)
                        console.log(err);
                    else
                        console.log('Successfully added record');
                });
            }, 1000);
        })
        // });
    } catch (e) {
        console.log('Interval job error occured : ', e)
    }
}

app.get('/triggermock', function (request, response) {
    getDataFromMockaroo();
    response.end();
});

app.get('/triggersaved', function (request, response) {
    getSavedMockData();
    response.end();
});



app.get('/api/getUsers', function (request, response) {
    db.view('unique', 'unique', { group: true }, function (err, body) {
        if (!err) {
            response.setHeader('Content-Type', 'text/plain');
            response.write(JSON.stringify(body.rows.map(user => user.key)));
            response.end();
        }
    });
})



app.get('/api/userGlucoseData', function (request, response) {
    console.log(url.parse(request.url, true).query);
    console.log("user glucose.. ")
    response.setHeader('Content-Type', 'text/plain');
    response.end();
    // db = cloudant.use(dbCredentials.dbName);
    // var docList = [];
    // var i = 0;
    // db.list(function (err, body) {
    //     if (!err) {
    //         var len = body.rows.length;
    //         // console.log('total # of docs -> ' + body.rows);
    //         // if (len != 0)  {
    //         var limit = (len < 20) ? len : 20;
    //         for (let j = 0; j < limit; j++) {
    //             console.log('J', j);
    //             db.get(body.rows[j].id, {
    //                 revs_info: true
    //             }, function (err, doc) {
    //                 if (!err) {
    //                     var responseData = createResponseData(
    //                         doc._id,
    //                         doc.name,
    //                         doc.value, []);
    //                     docList.push(responseData);
    //                     if (j >= len || j == 19) {
    //                         response.setHeader('Content-Type', 'text/plain');
    //                         response.write(JSON.stringify(docList));
    //                         console.log('ending response...');
    //                         response.end();
    //                     }
    //                 } else {
    //                     console.log(err);
    //                 }
    //             });
    //         }
    //     } else {
    //         console.log(err);
    //     }
    // });

});

app.get('/api/glucosedata', function (request, response) {

    console.log("Get method invoked.. ")

    db = cloudant.use(dbCredentials.dbName);
    var docList = [];
    var i = 0;
    db.list(function (err, body) {
        if (!err) {
            var query = {
                "selector": {},
                "sort": [
                    {
                        "name": "desc"
                    }
                ]
            }

            db.find(query, function (err, documents) {
                const docs = documents.docs;
                if (!err) {
                    docs.forEach(d => {
                        docList.push(createResponseData(
                            d._id,
                            d.name,
                            d.value, []))
                    })
                    response.setHeader('Content-Type', 'text/plain');
                    response.write(JSON.stringify(docList));
                    console.log('ending response...');
                    response.end();
                } else {
                    console.log(err);
                }
            });


        } else {
            console.log(err);
        }
    });

});


function checkSugarLevel(patientStatus) {
    let sugarLevel, sendMessage = false;
    for (let i = 0; i < levelConfig.length; i++) {
        sugarLevel = levelConfig[i];
        if (patientStatus.sugarLevel <= sugarLevel.value) {
            break;
        }
    }
    patientStatus.level = sugarLevel.level;
    patientStatus.action = sugarLevel.action;

    //Checking criticality
    switch (sugarLevel.criticality) {
        case 0:
            patientStatus.criticality = 'NO RISK'
            break;

        case 1:
            patientStatus.criticality = 'MEDIUM'
            break;

        case 2:
            patientStatus.criticality = 'HIGH'
            // sendMessage = true;
            break;

        case 3:
            patientStatus.criticality = 'VERY HIGH'
            sendMessage = true;
            break;

    }

    if (sendMessage) {
        // console.log('Patient ' + patientStatus.name + ' is at high risk. Glucose level is ' + patientStatus.sugarLevel);
        sendTwillioMessage(patientStatus);
    }
    return patientStatus;

}

function sendTwillioMessage(patientStatus) {
    console.log('Sending twillio message');
    var accountSid = 'AC5ebb7b19ce1a589988df6def0d5f99ba'; // Your Account SID from www.twilio.com/console
    var authToken = '5dcd30eb4861dadfa49782ac7c27a025';   // Your Auth Token from www.twilio.com/console
    var client = new twilio(accountSid, authToken);

    client.messages.create({
        body: 'Patient ' + patientStatus.name + ' is at high risk. Glucose level is ' + patientStatus.sugarLevel,
        to: '+61478743847',    // Text this number
        from: '+61437503511'    // From a valid Twilio number
    }).then((message) => console.log(message.sid));
}

http.createServer(app).listen(app.get('port'), '0.0.0.0', function () {
    console.log('Express server listening on port ' + app.get('port'));
});
