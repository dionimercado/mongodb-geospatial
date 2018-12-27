const express = require('express');
const app = express();
const client = require('mongodb').MongoClient;
const URL = "mongodb://username:password@aws-us-west-2-portal.0.dblayer.com:15326/fairfax?ssl=true, mongodb://localhost/geospatial";

const port = 8080;
const morgan = require('morgan');
const router = express.Router();

app.use(express.static(__dirname));
app.use(morgan('dev'));

// ------------ DATABASE CONNECTION ------------ //

let db;

client.connect(URL, {}, (err, database) => {
    if (err) throw err;
    db = database;
    app.listen(port, () => {
        console.log("App listening on port %s", port);
    });
});

app.use('/api', router);

router.all("/*", function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Cache-Control, Pragma, Origin, Authorization, Content-Type, X-Requested-With");
  res.header("Access-Control-Allow-Methods", "GET, PUT, POST");
  return next();
});


// -------- SOME HELPER FUNCTION FOR QUERYING RADIUS --------- //

function findNearPlacesGeoNear(placeName, distMeters, collection1, collection2, res) {
    db.collection(collection1).find({"properties.DESCRIPTION": placeName}, {_id: 0, "properties.DESCRIPTION": 1, "geometry": 1})
    .toArray((err, docs)  => {
        db.collection(collection2).find({
            "geometry": {
                $nearSphere: {
                    $geometry: docs[0].geometry,
                    $maxDistance: distMeters // 8046.72 = 5 miles to meters
                }
            }
        }, {_id: 0}).toArray((err, docs) => {
            if (err) throw err;
            res.json(docs);
        });
    });
}

function findNearPlacesGeoWithin(placeName, radius, collection1, collection2, res) {
    db.collection(collection1).find({"properties.DESCRIPTION": placeName}, {_id: 0, "properties.DESCRIPTION": 1, "geometry": 1})
    .toArray((err, docs)  => {
        db.collection(collection2).find({
            "geometry": {    
                $geoWithin: {
                    $centerSphere: [docs[0].geometry.coordinates, radius/3963.2] // convert radius to miles
                }
            }
        }, {_id: 0}).toArray((err, docs) => {
            if (err) throw err;
            res.json(docs);
        });
    });
}

function findNearPlacesAgg(placeName, distMeters, collection1, collection2, res) {
    db.collection(collection1).find({"properties.DESCRIPTION": placeName}, {_id: 0, "properties.DESCRIPTION": 1, "geometry": 1})
    .toArray((err, docs) => {
        db.collection(collection2).aggregate([
            {$geoNear: {
                near: docs[0].geometry,
                maxDistance: distMeters,
                spherical: true,
                distanceField: "dist.calculated",
                distanceMultiplier: 1/1609.344 // calculate distance in miles
            }},
            {$project: {
                _id: 0,
                "type": 1,
                "properties.DESCRIPTION": 1,
                "geometry": 1
            }}
        ]).toArray((err, docs) => {
            if (err) throw err;
            res.json(docs);
        });
    });
}




// ------------ OUR ROUTES ------------ //

router.get('/libraries', (req, res, next) => {
    const librariesCollection = db.collection('libraries');
    librariesCollection.find({}, {_id: 0}).toArray((err, docs) => {
        if (err) throw (err);
        res.json(docs);
    });
});

router.get('/sites', (req, res, next) => {
    const historicCollection = db.collection('sites');
    historicCollection.find({}, {_id: 0}).toArray((err, docs) => {
        if (err) throw (err);
        res.json(docs);
    });
});

router.get('/borders', (req, res, next) => {
    const border = db.collection('border');
    border.find({}, {_id: 0}).toArray((err, doc) => {
        if (err) throw err;
        res.json(doc);
    });
});

router.get('/radius', (req, res, next) => {
    findNearPlacesAgg("THOMAS JEFFERSON LIBRARY", 8046.72, "libraries", "sites", res);
});
