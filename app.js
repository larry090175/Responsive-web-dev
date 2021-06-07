var express = require('express');
var http = require('http');
var path = require("path");
var bodyParser = require('body-parser');
var helmet = require('helmet');
var rateLimit = require("express-rate-limit");


var app = express();
var server = http.createServer(app);
var io = require('socket.io')(server);   //new

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});


app.use(bodyParser.urlencoded({extended: false}));
app.use(express.static(path.join(__dirname,'./public')));
app.use(helmet());
app.use(limiter);

app.get('/', function(req,res){
  res.sendFile(path.join(__dirname,'./public/index.html'));
});


// Add
server.listen(3000, function(){
  console.log("server is listening on port: 3000");
});

