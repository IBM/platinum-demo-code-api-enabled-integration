const fs = require("fs");
const url = require("url");

const host = 'localhost';
const port = 8443;
const oauthHostname = "ademo-gw-gateway-cp4i."+process.env.HOSTNAME;
var redirectAppUrl = "https://aggregator-cp4i."+process.env.HOSTNAME+"/redirect";
const clientId = process.env.CLIENT_ID;
const clientSecret = process.env.CLIENT_SECRET;
const path = "/ibm-demo/sandbox/testoauth/oauth2/"

const https = require("https");
const { query } = require("express");

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
        let responseBody = fs.readFileSync("accounts.html")
        originalRes.setHeader("Content-Type", "text/html");
        originalRes.writeHead(200);
        originalRes.write(responseBody);
        originalRes.end();
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
        originalRes.end();
      }
      else if(originalReq.url.startsWith('/redirect'))
      {
        console.log("redirect ========ENTRY=====")
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
            
            const balanceRequestOptions = {
              hostname: oauthHostname,
              port: 443,
              path: "/ibm-demo/sandbox/testapi/",
              method: 'GET',
              headers:{
                'Authorization': bearerToken,
                'accept': 'application/json'
              }
            };

            console.log("redirect: balanceRequestOptions="+JSON.stringify(balanceRequestOptions));

            var balanceRequest = https.request(balanceRequestOptions, balanceResponse => {
              let balanceResponseData = [];
              console.log('Status Code:'+ balanceResponse.statusCode);
              
              balanceResponse.on('data', chunk => {
                balanceResponseData.push(chunk);
              });

              balanceResponse.on('end', () => {
                console.log('balanceResponse ended: balanceResponseData='+balanceResponseData);

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

        let responseBody = fs.readFileSync("accounts.html");
        originalRes.setHeader("Content-Type", "text/html");
        originalRes.writeHead(200);
        originalRes.write(responseBody);
        originalRes.end();
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