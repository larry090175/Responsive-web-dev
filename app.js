var express = require('express');
var http = require('http');
var path = require("path");
var bodyParser = require('body-parser');
var helmet = require('helmet');
var rateLimit = require("express-rate-limit");
var paypal = require('paypal-rest-sdk');


paypal.configure({
  'mode': 'sandbox', //sandbox or live
  'client_id': 'AUubYI0Cyoil4rWnhiquANU8gP5FPE2SN0wa7zBmy3a-ZBikzm7Vu0yNogfmS05epSZgJZj3udKL0ZnZ',
  'client_secret': 'EGKEtrua29eRb6rCGzMAciaaMl6hNXfzIz5xu9u0V2WGsv43mpASSXl3QJ1NK8YZI5hWr7_Agleu7CRe'
});

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

app.post('/pay', (req, res) => {
  const firstName = req.body.firstname;
  const lastName = req.body.lastname;
  const email = req.body.useremail;
  console.log(firstName);
  console.log(lastName);
  console.log(email);

  const create_payment_json = {
    "intent": "sale",
    "payer": {
        "payment_method": "paypal"
    },
    "redirect_urls": {
        "return_url": "http://ec2-3-93-3-46.compute-1.amazonaws.com:3000/success",
        "cancel_url": "http://ec2-3-93-3-46.compute-1.amazonaws.com:3000/cancel"
    },
	
    "transactions": [{
        "item_list": {
            "items": [{
                "name": "Snowdrifters Membership",
                "sku": "001",
                "price": "45.00",
                "currency": "USD",
                "quantity": 1
            }]
        },
        "amount": {
            "currency": "USD",
            "total": "45.00"
        },
        "description": "Snowdrifters Membership",
		"custom": email+"-"+firstName+"-"+lastName,
    }]
};

paypal.payment.create(create_payment_json, function (error, payment) {
  if (error) {
      throw error;
  } else {
      for(let i = 0;i < payment.links.length;i++){
        if(payment.links[i].rel === 'approval_url'){
          res.redirect(payment.links[i].href);
        }
      }
  }
});

});

app.get('/success', (req, res) => {
  const payerId = req.query.PayerID;
  const paymentId = req.query.paymentId;

  const execute_payment_json = {
    "payer_id": payerId,
    "transactions": [{
        "amount": {
            "currency": "USD",
            "total": "45.00"
        }
    }]
  };

  paypal.payment.execute(paymentId, execute_payment_json, function (error, payment) {
    if (error) {
        console.log(error.response);
        throw error;
    } else {
        console.log(JSON.stringify(payment));
		res.redirect('/membership.html?status=success');
    }
});
});

app.get('/cancel', (req, res) => res.redirect('/membership.html?status=cancel'));

// Add
server.listen(3000, function(){
  console.log("server is listening on port: 3000");
});

