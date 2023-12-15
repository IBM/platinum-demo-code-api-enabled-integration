const fs = require("fs");
const url = require("url");
var syncrequest = require('sync-request');

const host = 'localhost';
const port = 8443;
const oauthHostname = "ademo-gw-gateway-cp4i."+process.env.HOSTNAME;
var redirectAppUrl = "https://aggregator-cp4i."+process.env.HOSTNAME+"/redirect";
const clientId = process.env.CLIENT_ID;
const clientSecret = process.env.CLIENT_SECRET;
const path = "/ibm-demo/sandbox/banking-oauth/oauth2/"

const https = require("https");

const requestListener = function(originalReq, originalRes){
    console.log("Path: "+originalReq.url + " method: "+originalReq.method);

    let body = '';

    originalReq.on('data', (chunk) => {
      body += chunk;
    });

    originalReq.on('end', () => {

      console.log('Request payload: '+body);

      if(originalReq.url.startsWith('/login'))
      {
        let responseBody = fs.readFileSync("login.html")
        originalRes.setHeader("Content-Type", "text/html");
        originalRes.writeHead(200);
        originalRes.write(responseBody);
        originalRes.end();
      }
      else if(originalReq.url.startsWith('/authcheck'))
      {
        sendTrace(0, 1, "Aggregator auth checks", "", "https://aggregator-cp4i."+process.env.HOSTNAME+originalReq.url, originalReq.headers, body, "GET");
        let responseBody = fs.readFileSync("addAccount.html")
        originalRes.setHeader("Content-Type", "text/html");
        originalRes.writeHead(200);
        originalRes.write(responseBody);
        originalRes.end();
        sendTrace(1, 0, "Accepted", "200", "https://aggregator-cp4i."+process.env.HOSTNAME+originalReq.url, originalRes.headers, body, "GET");
      }

      else if(originalReq.url.startsWith('/add'))
      {
        let responseBody = fs.readFileSync("addAccount.html")
        originalRes.setHeader("Content-Type", "text/html");
        originalRes.writeHead(200);
        originalRes.write(responseBody);
        originalRes.end();
      }

      else if(originalReq.url.startsWith('/linkbank'))
      {
        console.log("linkbank ========ENTRY=====")
        sendTrace(0, 1, "Link bank account", "", "https://aggregator-cp4i."+process.env.HOSTNAME+originalReq.url, originalReq.headers, body, "GET");
        
        var parsedURL = url.parse(originalReq.url, true);
        console.log("linkbank: parsedURL="+JSON.stringify(parsedURL));
        var usernameAggregator = parsedURL.query.usernameAggregator;
        console.log("linkbank: usernameAggregator="+usernameAggregator);
        var queryParameters = "?response_type=code&redirect_uri="+redirectAppUrl+"&scope=balance&client_id="+clientId+"&aggregatorUsername="+usernameAggregator;

        var redirectURL = "https://"+oauthHostname+path+"authorize"+queryParameters;
        console.log("linkbank: redirectURL="+redirectURL);
        originalRes.writeHead(302, {
          'Location': redirectURL
        });
        sendTrace(1, 0, "Redirect OAuth Service", "302", redirectURL, {}, body, "GET");
        sendTrace(0, 2, "OAuth authorize", "", redirectURL, "", "", "GET");
        originalRes.end();
      }
      else if(originalReq.url.startsWith('/redirect'))
      {
        console.log("redirect ========ENTRY=====")
        sendTrace(2, 0, "Redirect with Access Code", "302", "https://aggregator-cp4i."+process.env.HOSTNAME+originalReq.url, {}, body, "GET");
        sendTrace(0, 1, "Redirect with Access Code", "", "https://aggregator-cp4i."+process.env.HOSTNAME+originalReq.url, originalReq.headers, body, "GET");

        var parsedURL = url.parse(originalReq.url, true);
        console.log("redirect: parsedURL="+JSON.stringify(parsedURL));
        console.log("redirect: code="+parsedURL.query.code);

        var auth = 'Basic ' + Buffer.from(clientId + ':' + clientSecret).toString('base64');

        const tokenRequestOptions = {
          hostname: oauthHostname,
          port: 443,
          path: path+"token",
          method: 'POST',
          headers:{
            'Authorization': auth,
            'content-type': 'application/x-www-form-urlencoded'
          }
        };

        console.log("redirect: tokenRequestOptions="+JSON.stringify(tokenRequestOptions));

        var postData = "grant_type=authorization_code&scope=balance&redirect_uri="+redirectAppUrl+"&code="+parsedURL.query.code;

        console.log("redirect: postData="+postData);
        
        sendTrace(1, 2, "Request token", "", "https://"+oauthHostname+"443"+path+"token", tokenRequestOptions.headers, postData, "POST");
        
        var tokenRequest = https.request(tokenRequestOptions, tokenResponse => {
          let data = [];
          console.log('redirect: Status Code:', tokenResponse.statusCode);
          
          tokenResponse.on('data', chunk => {
            data.push(chunk);
          });

          tokenResponse.on('end', () => {
            console.log('redirect: Response ended: data='+data);
            const tokenResponseData = JSON.parse(Buffer.concat(data).toString());
            console.log("redirect: Token="+tokenResponseData.access_token);
            
            var bearerToken = "Bearer "+tokenResponseData.access_token;
            
            sendTrace(2, 1, "Token", tokenResponse.statusCode, "https://"+oauthHostname+"443"+path+"token", tokenResponse.headers, tokenResponseData, "POST");
        

            const balanceRequestOptions = {
              hostname: oauthHostname,
              port: 443,
              path: "/ibm-demo/sandbox/balance/00005-6528965",
              method: 'GET',
              headers:{
                'Authorization': bearerToken,
                'accept': 'application/json'
              }
            };

            console.log("redirect: balanceRequestOptions="+JSON.stringify(balanceRequestOptions));
            sendTrace(1, 2, "Get Balance", "", "https://"+oauthHostname+"443"+balanceRequestOptions.path, balanceRequestOptions.headers, "", "GET");

            var balanceRequest = https.request(balanceRequestOptions, balanceResponse => {
              let balanceResponseData = [];
              console.log('Status Code:'+ balanceResponse.statusCode);
              
              balanceResponse.on('data', chunk => {
                balanceResponseData.push(chunk);
              });

              balanceResponse.on('end', () => {
                console.log('balanceResponse ended: balanceResponseData='+balanceResponseData);

                let responseBody = fs.readFileSync("accounts.html").toString();

                responseBody=responseBody.replace('<!--AddList-->', JSON.parse(balanceResponseData).balance);
                
                originalRes.setHeader("Content-Type", "text/html");
                originalRes.writeHead(200);
                originalRes.write(responseBody);
                originalRes.end();
                sendTrace(2, 1, "Balance", "", "https://"+oauthHostname+"443"+balanceRequestOptions.path, balanceResponse.headers, balanceResponseData, "GET");
                sendTrace(1, 0, "Balance", "", "https://aggregator-cp4i."+process.env.HOSTNAME+originalReq.url, responseBody.headers, balanceResponseData, "GET");

              });
            });

            balanceRequest.on('error', (error) => {
              console.log('Error: ', error.message);
            });

            balanceRequest.end();

          });

        });
        
        tokenRequest.on('error', err => {
          console.log('Error: ', err.message);
        });

        tokenRequest.write(postData);
        tokenRequest.end();

      }
      else
      {
        var filename =originalReq.url.substring(1);
        console.log("Going to try "+filename);
        try
        {
          let responseBody = fs.readFileSync(filename)

          if(filename.endsWith('.js'))
          {
            originalRes.setHeader("Content-Type", "text/javascript");
          }
          else if(filename.endsWith('.css'))
          {
            originalRes.setHeader("Content-Type", "text/css");
          }
          else if(filename.endsWith('.html'))
          {
            originalRes.setHeader("Content-Type", "text/html");
          }
          else if(filename.endsWith('.ttf'))
          {
            originalRes.setHeader("Content-Type", "font/ttf");
          }
          originalRes.writeHead(200);
          originalRes.write(responseBody);
          originalRes.end();
        }
        catch (error)
        {
          console.log("Sending 404 for "+filename);
          originalRes.writeHead(404);
          originalRes.end();
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
    process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;
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

