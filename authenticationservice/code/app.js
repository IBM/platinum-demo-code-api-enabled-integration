const fs = require("fs");
const url = require("url");

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
        let responseBody = fs.readFileSync("login.html")
        res.setHeader("Content-Type", "text/html");
        res.writeHead(200);
        res.write(responseBody);
        res.end();
      }
      else if(req.url.startsWith('/authcheck'))
      {
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

        res.writeHead(200);
        res.end();
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