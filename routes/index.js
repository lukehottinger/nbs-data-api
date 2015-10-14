
var express = require('express');
var router = express.Router();
var pg = require('pg');
var connectionString = process.env.DATABASE_URL || 'postgres://node:udbsDB@localhost:5432/node';

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/api/sensors', function(req, res) {

    var results = [];

    // Get a Postgres client from the connection pool
    pg.connect(connectionString, function(err, client, done) {

        // SQL Query > Select Data
        var query = client.query("SELECT * FROM sensors;");

        // Stream results back one row at a time
        query.on('row', function(row) {
            results.push(row);
        });

        // After all data is returned, close connection and return results
        query.on('end', function() {
            client.end();
            return res.json(results);
        });

        // Handle Errors
        if(err) {
          console.log(err);
        }

    });

});

router.get('/api/sensors/:id', function(req, res) {

    var results = [];

    var id = req.params.id;

    // Get a Postgres client from the connection pool
    pg.connect(connectionString, function(err, client, done) {

        // SQL Query > Select Data
	var queryString = "SELECT s.id, v.value, v.timestamp, v.active FROM sensors s INNER JOIN values v ON s.id = v.sensor_id WHERE s.id = '" + id + "' AND timestamp > ( current_timestamp - interval '23 hours');";
        var query = client.query(queryString);

        // Stream results back one row at a time
        query.on('row', function(row) {
            results.push(row);
        });

        // After all data is returned, close connection and return results
        query.on('end', function() {
            client.end();
            return res.json(results);
        });

        // Handle Errors
        if(err) {
          console.log(err);
        }

    });

});

router.post('/api/sensors/:id', function(req, res) {

    var results = [];
    var id = req.params.id;

    // Grab data from http request
    var data = { value: req.body.value };

    // Get a Postgres client from the connection pool
    pg.connect(connectionString, function(err, client, done) {

	client.query("UPDATE values SET active=false WHERE sensor_id = $1 AND active = true", [id]);

        // SQL Query > Insert Data
        client.query("INSERT INTO values (sensor_id, value, active) values ($1, $2, true)", [id, data.value]);
	
	// SQL Query > Select Data
        var query = client.query("SELECT * FROM values WHERE sensor_id = $1 AND active = true", [id]);

        // Stream results back one row at a time
        query.on('row', function(row) {
            results.push(row);
        });

        // After all data is returned, close connection and return results
        query.on('end', function() {
            client.end();
            return res.json(results);
        });

        // Handle Errors
        if(err) {
          console.log(err);
        }

    });
});

router.post('/api/osc', function(req, res) {

    // Grab data from http request
    var data = { addr: req.body.addr, door: req.body.door, opacity: req.body.opacity };
	
    var osc = require('node-osc');

    var client = new osc.Client('192.168.1.7', 9001); client.send(data.addr, data.door, data.opacity, function () { client.kill(); });
	
    return res.json(true);

});

module.exports = router;
