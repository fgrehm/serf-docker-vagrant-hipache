var http = require('http');
var server = http.createServer(function (request, response) {
  response.writeHead(200, {"Content-Type": "text/plain"});
  response.end("Hello from: " + process.env.INSTANCE + "\n");
});
server.listen(80, '0.0.0.0');
console.log("Server running at http://127.0.0.1:80/");
