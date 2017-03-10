"use strict";

var http = require('http');
var url = require('url');
var fs = require('fs');
var path = require('path');

//server config
var config = {
	port: 8888, 
	ip: '127.0.0.1',
	mime: {
		html: "text/html",
		js: "text/javascript",
		css: "text/css",
		gif: "image/gif",
		jpg: "image/jpeg",
		png: "image/png",
		ico: "image/icon",
		text: "text/plain",
		json: "application/json",
		default: "application/octet-stream"
	}
};

//start server
var start = () => {
	console.time("HttpServerStart");
	var port = config.port;
	var ip = config.ip;

	//Create an HTTP server
	var httpServer = http.createServer(processRequest)

	//now that server is running
	httpServer.listen(port, () => {
		console.log("HttpServer start", "runing at http://" + ip + ":" + port);
		console.timeEnd("HttpServerStart");
	});

	//Adding an 'error' event handler to server
	httpServer.on("error", (error) => {
		cosnole.error(error);
	})
};

//requestListener
var processRequest = (request, response) => {
	var hasExt = true;
	var requestUrl = request.url;
	var pathName = url.parse(requestUrl).pathname;

	//To prevent garbled
	pathName = decodeURI(pathName);

	if (path.extname(pathName) === '') {
		//add Redirection
		if (pathName.charAt(pathName.length -1) != "/") {
			pathName += "/";
			var redirect = "http://" + request.headers.host + pathName;
			response.writeHead(301, {
				location: redirect
			});
		}
		pathName += "index.html";
		hasExt = false;
	}

	//Configure relative paths
	var filePath = path.join("http/webroot", pathName);
	var contentType = getContentType(filePath);

	fs.access(filePath, fs.constants.R_OK | fs.constants.W_OK, (error) => {
		if (!error) {
			response.writeHead(200, {"content-type": contentType});
			var stream = fs.createReadStream(filePath, {flags:"r", encoding: null});
			stream.on("error", () => {
				response.writeHead(500, {"content-type": "text/html"});
				response.end("<h1>500 Server Error!</h1>");
			});
			stream.pipe(response);
		} else {
			if (hasExt) {
				response.writeHead(404, {"content-type": "text/html"});
				response.write("<h1>404 not Found</h1>");
				response.end();
			} else {
				var html = "<head><meta charset='utf-8'> </head>";
				try{
					var pathName = decodeURI(url.parse(requestUrl).pathname);
					var filedir = filePath.substring(0, filePath.lastIndexOf('\\'));
					var files = fs.readdirSync(filedir);
					files.forEach((item, index) => {
						html += "<div><a href='" + pathName + "/" + item + "'>" + item + "</a></div>";
					});
				} catch (e) {
					html += "<h1>您访问的目录不存在</h1>";
				}
				response.writeHead(200, {"content-type": "text/html"});
				response.end(html);
			}
		}
	});
};

var getContentType = (filePath) => {
	var contentType = config;
	var ext = path.extname(filePath).substr(1);
	if (contentType.hasOwnProperty(ext)) {
		return contentType[ext];
	} else {
		return contentType.default;
	}
}

exports.start = start;