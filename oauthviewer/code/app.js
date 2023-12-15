const fs = require("fs");
const url = require("url");

const host = 'localhost';
const port = 8000;

const http = require("http");

global.oauthtrace = [];

const requestListener = function(req, res){
    console.log("Path: "+req.url + " method: "+req.method);

    let body = '';

    req.on('data', (chunk) => {
      body += chunk;
    });

    req.on('end', () => {

      console.log('Request payload: '+body);

      if (req.url.startsWith('/postData'))
      {
        var jsonData = JSON.parse(body);
        if(jsonData!=null){
          var message = jsonData.message;
          if(message == "Aggregator login")
          {
            oauthtrace.length = 0;
          }
          oauthtrace.push(jsonData);
        }
        let responseBody = 'DONE';
        console.log("Writing response: "+responseBody);
        res.setHeader("Content-Type", "application/json");
        res.writeHead(200);
        res.write(responseBody);
        res.end();
      }
      
      else if(req.url.startsWith('/getData'))
      {
        var responseBody = JSON.stringify(oauthtrace);
        console.log("Writing response: "+responseBody);
        res.setHeader("Content-Type", "application/json");
        res.writeHead(200);
        res.write(responseBody);
        res.end();
      }
      else if(req.url.startsWith('/css/'))
      {
        var filename =req.url.substring(1);
        console.log("Going to try "+filename);
        try
        {
          let responseBody = fs.readFileSync(filename)

          if(filename.endsWith('.css'))
          {
            res.setHeader("Content-Type", "text/css");
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
      else 
      {
        let responseBody = fs.readFileSync("viewer.html")
        res.setHeader("Content-Type", "text/html");
        res.writeHead(200);
        res.write(responseBody);
        res.end();
      }
    });
}

http.createServer(
  requestListener).listen(port,()=> {
    console.log('listen port 8000');
  }
)