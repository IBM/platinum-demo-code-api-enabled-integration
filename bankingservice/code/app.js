//Require module
const https = require("https");
const fs = require("fs");
const express = require('express');
var bodyParser = require('body-parser')
var syncrequest = require('sync-request');

// Express Initialize
const app = express();
app.use(bodyParser.json());
const port = 8000;
app.listen(port,()=> {
  console.log('listen port 8000');
})

const appsecure = express();
appsecure.use(bodyParser.json());
const portsecure = 8443;
https.createServer(
  {
    key: fs.readFileSync("key.pem"),
    cert: fs.readFileSync("cert.pem"),
  },
  appsecure).listen(portsecure,()=> {
  console.log('listen port 8443');
})

appsecure.post('/*', (req,res)=>{
  console.log('Secure Request Data='+JSON.stringify(req.body));
  console.log('Secure Request Data='+JSON.stringify(req.headers));

  for (const property in req.headers) {
    var header = property;
    var value = req.headers[property];
    console.log("Setting response header '"+header+"' to '"+value+"'");
    res.setHeader(header, value);
  };

  res.header("Content-Type", "application/json");
  res.send('{"status": "Accepted", "secureauthentication": "1234567890"}');
})

appsecure.get('/*', (req,res)=>{
  console.log('Secure Request Data='+JSON.stringify(req.body));
  console.log('Secure Request Data='+JSON.stringify(req.headers));

  for (const property in req.headers) {
    var header = property;
    var value = req.headers[property];
    console.log("Setting response header '"+header+"' to '"+value+"'");
    res.setHeader(header, value);
  };

  res.header("Content-Type", "application/json");
  res.send('{"status": "Accepted", "secureauthentication": "1234567890"}');
})

//app.get('/notificationService', (req,res)=>{
//  res.header("Content-Type", "application/json");
//  res.send('{"status": "Accepted", "notificationId": "1234567890"}');
//})

app.post('/bankingservices/v1/bankingservices', (req,res)=>{
  console.log('Request Data='+JSON.stringify(req.body));
  console.log('Request Data='+JSON.stringify(req.headers));

  for (const property in req.headers) {
    var header = property;
    var value = req.headers[property];
    console.log("Setting response header '"+header+"' to '"+value+"'");
    res.setHeader(header, value);
  };

  res.header("Content-Type", "application/json");
  res.send('{"status": "Accepted", "bankingservices": "1234567890"}');
})

app.get('/balance/v1/balance/*', (req,res)=>{
  console.log('Request Data='+JSON.stringify(req.body));
  console.log('Request Data='+JSON.stringify(req.headers));

  for (const property in req.headers) {
    var header = property;
    var value = req.headers[property];
    console.log("Setting response header '"+header+"' to '"+value+"'");
    res.setHeader(header, value);
  };

  res.header("Content-Type", "application/json");
  var responseBody = '{"status": "Accepted", "balance": "$3,791.54"}';
  sendTrace(2, 4, "Get Balance", "", "http://banking:8000/balance/v1/balance/00005-6528965", req.headers, "", "GET");
  sendTrace(4, 2, "Balance", "200", "http://banking:8000/balance/v1/balance/00005-6528965", {}, responseBody, "GET");
  res.send(responseBody);              
})

app.post('/audit/v1/audit', (req,res)=>{
  console.log('Request Data='+JSON.stringify(req.body));
  console.log('Request Data='+JSON.stringify(req.headers));

  for (const property in req.headers) {
    var header = property;
    var value = req.headers[property];
    console.log("Setting response header '"+header+"' to '"+value+"'");
    res.setHeader(header, value);
  };

  res.header("Content-Type", "application/json");
  res.send('{"status": "Accepted", "audit": "1234567890"}');
})

app.post('/authentication/v1/authentication', (req,res)=>{
  console.log('Request Data='+JSON.stringify(req.body));
  console.log('Request Data='+JSON.stringify(req.headers));

  for (const property in req.headers) {
    var header = property;
    var value = req.headers[property];
    console.log("Setting response header '"+header+"' to '"+value+"'");
    res.setHeader(header, value);
  };

  res.header("Content-Type", "application/json");
  res.send('{"status": "Accepted", "authentication": "1234567890"}');
})

app.post('/Fraud/v1/frauddetection', (req,res)=>{
  console.log('Request Data='+JSON.stringify(req.body));
  console.log('Request Data='+JSON.stringify(req.headers));

  for (const property in req.headers) {
    var header = property;
    var value = req.headers[property];
    console.log("Setting response header '"+header+"' to '"+value+"'");
    res.setHeader(header, value);
  };

  res.header("Content-Type", "application/json");
  res.send('{"status": "Accepted", "frauddetection": "1234567890"}');
})

app.post('/notification/v1/notification', (req,res)=>{
  console.log('Request Data='+JSON.stringify(req.body));
  console.log('Request Data='+JSON.stringify(req.headers));

  for (const property in req.headers) {
    var header = property;
    var value = req.headers[property];
    console.log("Setting response header '"+header+"' to '"+value+"'");
    res.setHeader(header, value);
  };

  res.header("Content-Type", "application/json");
  res.send('{"status": "Accepted", "notification": "1234567890"}');
})

app.post('/transferfunds/v1/transfer', (req,res)=>{
  console.log('Request Data='+JSON.stringify(req.body));
  console.log('Request Data='+JSON.stringify(req.headers));

  for (const property in req.headers) {
    var header = property;
    var value = req.headers[property];
    console.log("Setting response header '"+header+"' to '"+value+"'");
    res.setHeader(header, value);
  };

  res.header("Content-Type", "application/json");
  res.send('{"status": "Accepted", "transfer": "1234567890"}');
})

function sendTrace(startPosition, endPosition, message, code, url, headers, body, method){
  console.log("Starting "+message+ " trace call");

  var res = syncrequest('POST', 'http://oauthviewer:8000/postData', {
        json: {
          start: startPosition,
          end: endPosition, 
          message: message, 
          code: code,
          url: url,
          headers: headers, 
          body: body,
          method: method
        }
      });
  var response_body = res.getBody('utf8');
  console.log("Ending "+message +" with response: "+response_body);
  return response_body;
  
}