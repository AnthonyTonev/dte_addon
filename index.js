"use strict";
import {API, PORT, ENV, ROOT, REL, PATH, WORK} from "./config.js";
import * as http from 'http'
import * as url from "url";
import * as fs from "fs";
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const server = http.createServer()

const routes = new Map();
routes.set('GET:/', function(req, res) {
	res.writeHead(302, {
  'Location': API+PORT+'/tree_struct/decision-tree-editor/public/index.html'
  //add other headers here...
});
res.end();

})
routes.set('GET:/ls', function(req, res) {
  res.writeHead(200, { "Content-Type": "application/json" });
      fs.readdir(`.${ROOT}${REL}${WORK}`, (err, files) => {
        let items = []
        files.forEach(file => {
          items.push(file)
        });
        res.end(JSON.stringify({items}))
      });
});
// routes.set('GET:/:filename', function(req, res) {
//   res.writeHead(200, { "Content-Type": "application/json" });
//   console.log(req.params.filename)
//   // fs.readFile(__dirname + req.params.filename, function (err, data) {
//   //   if (err) throw err;
//   //   res.end(data);
//   //   });
// });
routes.set('POST:/data', function(req, res) {
  res.writeHead(200, { "Content-Type": "application/json" });
      const json =  JSON.parse(req.body)
      const dir = json.dir;
      // console.log(json);
      fs.writeFile(`.${dir}${json.filename}.json`, req.body, (err) => {
        if (err) throw err;
        console.log("Data written to file");
        res.end();
      });
});


  server.listen(PORT,()=>{
    console.log('listening on port '+ PORT)
	console.log('open http://localhost:'+ PORT +'/tree_struct/decision-tree-editor/public/index.html') 
  });
  
  
  server.on('request', (req,res)=>{
	const method = req.method;
	const urlParsed = url.parse(req.url);
  const query = urlParsed.query;
 
  if (req.url === '/favicon.ico') {
    res.writeHead(200, {'Content-Type': 'image/x-icon'} );
    res.end();
    console.log('favicon requested');
    return;
  }
  
    let body = "";
    req.on("data",  (chunk) => {
      body += chunk;
    });
    req.on('end',  ()=> {
      const callback = routes.get(`${method}:${urlParsed.pathname}`);
      if (method === 'POST') {
			if (query && body) {
				req.query = query;
				req.body = body;
			} else if (body) {
				req.body = body;
			}
		}
    if (callback) {
			callback.call({}, req, res);
		} else {
			// Response if there is no associated route.
			res.writeHead(404, {
				"Content-Type": "application:json"
			});
      const purl = url.parse(req.url, true);
      fs.access(__dirname + purl.pathname, function (err) {
          const filePath =  purl.pathname.split('/').pop();
          const fileName = filePath.split('.');
          const extention = '.'+fileName.pop();
          const file = fileName.join('.')
         
          if(file){
            if(err){
              console.log(err)
              res.writeHead(404, { "Content-Type": "text/plain" });
              res.end();
            }
        
            const mime = {
              ".js": "text/javascript; charset=UTF-8",
              ".css":"text/css; charset=UTF-8",
              ".json": "text/json; charset=UTF-8",
              ".txt": "text/plain; charset=UTF-8",
              ".html": "text/html; charset=UTF-8",
            };
            if (body.length > 1e6) req.socket.destroy();
            res.writeHead(200, { "Content-Type": mime[extention] });
            fs.readFile(__dirname + purl.pathname, function (err, data) {
              if (err){
                console.log(err);
                res.end();
              } 
              else{
              res.end(data); 
              }
             
              });
           }
        });
      }
    })
  })