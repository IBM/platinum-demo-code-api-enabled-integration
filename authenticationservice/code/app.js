const fs = require("fs");
const url = require("url");
var syncrequest = require('sync-request');

const host = 'localhost';
const port = 8443;

const https = require("https");

const requestListener = function(req, res){
    console.log("Path: "+req.url + " method: "+req.method);

    let body = '';

    req.on('data', (chunk) => {
      body += chunk;
    });

    req.on('end', () => {

      console.log('Request payload: '+body);

      if (req.url.startsWith('/api'))
      {

        let responseBody = 'Hello Callum';
        console.log("Writing response: "+responseBody);
        res.setHeader("Content-Type", "application/json");
        res.writeHead(200);
        res.write(responseBody);
        res.end();
      }
      
      else if(req.url.startsWith('/login'))
      {
        let gatewayRedirect = "https://authentication-cp4i."+process.env.HOSTNAME+req.url;
        sendTrace(2, 0, "Redirect bank login", "302", gatewayRedirect, {}, body, "GET");
        sendTrace(0, 3, "Bank login", "", gatewayRedirect, req.headers, body, "GET");
        sendTrace(3, 0, "Login screen", "200", gatewayRedirect, {}, "Login screen HTML not shown", "GET");
        let responseBody = fs.readFileSync("login.html")
        res.setHeader("Content-Type", "text/html");
        res.writeHead(200);
        res.write(responseBody);
        res.end();
      }
      else if(req.url.startsWith('/authcheck'))
      {
        let gatewayRedirect = "https://authentication-cp4i."+process.env.HOSTNAME+req.url;
        sendTrace(0, 3, "Auth checks", "", gatewayRedirect, req.headers, body, req.method);
        let responseBody = fs.readFileSync("consent.html")
        res.setHeader("Content-Type", "text/html");
        res.writeHead(200);
        res.write(responseBody);
        res.end();
      }

      else if(req.url.startsWith('/redirect'))
      {

        console.log("Redirect========ENTRY=====")
        var parsedURL = url.parse(req.url, true);
        console.log("redirect: parsedURL="+JSON.stringify(parsedURL));
        var username = parsedURL.query.username;
        console.log("redirect: username="+username);
        var originalURL = parsedURL.query["original-url"];
        console.log("redirect: original-url="+originalURL);
        var redirectURL = originalURL+'&confirmation=1234567890&username='+username;
        console.log("redirect: redirectURL="+redirectURL);
        res.writeHead(302, {
          'Location': redirectURL,
          'APIm-debug': true
        });
        sendTrace(3, 0, "Accepted - redirect to OAuth", "", redirectURL, {}, body, req.method);
        sendTrace(0, 2, "OAuth authorize with confirmationID", "", redirectURL, {}, body, req.method);
        res.end();
      }

      else if(req.url.startsWith('/approve'))
      {
        var parsedURL = url.parse(req.url, true);
        console.log("authCheck: parsedURL="+JSON.stringify(parsedURL));
        console.log("authCheck: username="+parsedURL.query.username);
        console.log("authCheck: password="+parsedURL.query.password);

        let responseBody = fs.readFileSync("login.html")
        res.setHeader("Content-Type", "text/html");
        res.writeHead(200);
        res.write(responseBody);
        res.end();
      }
      else if(req.url.startsWith('/authorizationurl'))
      {
        var parsedURL = url.parse(req.url, true);
        console.log("authorizationurl: parsedURL="+JSON.stringify(parsedURL));
        let traceUrl = "https://authentication-cp4i."+process.env.HOSTNAME+req.url;
        sendTrace(2, 3, "Verify confirmationID", "", traceUrl, req.headers, body, req.method);
        res.writeHead(200);
        res.end();
        sendTrace(3, 2, "Confirmed", "200", traceUrl, res.headers, "", req.method);
      }
      else
      {
        var filename =req.url.substring(1);
        console.log("Going to try "+filename);
        try
        {
          let responseBody = fs.readFileSync(filename)

          if(filename.endsWith('.js'))
          {
            res.setHeader("Content-Type", "text/javascript");
          }
          else if(filename.endsWith('.css'))
          {
            res.setHeader("Content-Type", "text/css");
          }
          else if(filename.endsWith('.html'))
          {
            res.setHeader("Content-Type", "text/html");
          }
          else if(filename.endsWith('.ttf'))
          {
            res.setHeader("Content-Type", "font/ttf");
          }
          res.writeHead(200);
          res.write(responseBody);
          res.end();
        }
        catch (error)
        {
          console.log("Sending 404 for "+filename);
          res.writeHead(404);
          res.end();
        }
      }
    });
};

https.createServer(
  {
    key: fs.readFileSync("key.pem"),
    cert: fs.readFileSync("cert.pem"),
  },
  requestListener).listen(port,()=> {
    console.log('listen port 8443');
  }
)

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