var http = require('http');
var zlib = require('zlib');
var fs = require('fs');
var querystring = require('querystring');
var htmlparser = require("htmlparser");
var util = require('util');
var iconv = require('iconv-lite');
var async = require('async');
var path = require('path');
var os = require('os');
var mail = require('./mail.js');

var main_url = '/zhaoche/advanced-0-0-0-0-0-0-0-0-0-0-0-0.html';
var output_dir = 'output/';
var path_base = '/zhaoche/AsLoadMore.ashx?page=%s&price=0&brandid=0&country=0&deliveryCapacity=0&level=0&struct=0&seat=0&_=';
var new_car_type = [];
var auto_car_type = [];
var exist_car_type = [];
var LINE_SEP = os.EOL;
var UNIX_LINE_SEP = '\n';
var WIN_LINE_SEP = '\r\n';
var now = new Date().toISOString().replace(/T/, '_').replace(/\..*/, '');
var now_file = path.join(output_dir, 'new_car_type_'+ now.replace(/:/g,'-') +'.txt');

var getPage = function(handler, url) {
	var parser = new htmlparser.Parser(handler);
	var options = {
		host: 'car.autohome.com.cn',
		path: url,
		method: 'GET',
		headers: { 'accept-encoding': 'gzip,deflate' }
	};

	// var request = http.get(options);
	// request.on('response', function(res) {

	// 	switch (res.headers['content-encoding']) {
	// 	    // or, just use zlib.createUnzip() to handle both cases
	// 	    case 'gzip':
	// 		  res.pipe(zlib.createGunzip()).pipe(parser);
	// 	      break;
	// 	    case 'deflate':
	// 	      res.pipe(zlib.createInflate()).pipe(parser);
	// 	      break;
	// 	    default:
	// 	      res.pipe(parser);
	// 	      break;
	// 	}
	// });
	// request.on('error', function(err) {
	//   console.log('problem with request: ' + e.message);
	// });
	// request.end();


	var req = http.request(options, function(res) {
		var buffers = [];
		var size = 0;
		// console.log(res.headers);
		res.on('data', function (data) {
			buffers.push(data);
			// size += data.length;
		});

		res.on('end', function() {
			var data = Buffer.concat(buffers);
			zlib.gunzip(data, function(error, unzip_data){
				if (error) {
					console.log('unzip error :' + error);
				} else {
					parser.parseComplete(iconv.decode(unzip_data, 'gbk'));
				}
			});
		});
	});

	req.on('error', function(e) {
	  console.log('problem with request: ' + e.message);
	});
	req.end();
}

var count = 0;
var pagehandler = new htmlparser.DefaultHandler(function (error, dom) {
    if (!error) {
		var names = htmlparser.DomUtils.getElements({ class: "ul-name" }, dom);
		names = htmlparser.DomUtils.getElementsByTagType("text", names);
		for (var n in names) {
			var ct = names[n]['data'];
			auto_car_type.push(ct);
			if (exist_car_type.indexOf(ct) < 0) {
				new_car_type.push(ct);
			}
		}

		// 
		if (auto_car_type.length != count) {
			// console.log('already completed ' + Math.floor(auto_car_type.length / count * 100) + '%');
		} else {
			
			if (new_car_type.length != 0) {
				// delete if exist
				if (fs.existsSync(now_file))
					fs.unlinkSync(now_file);
				var appendStr = new_car_type.join(WIN_LINE_SEP) + WIN_LINE_SEP;
				// flags:wx will fail if path exists.
				var writer = fs.createWriteStream(now_file, {encoding:'utf-8', flags:'wx'});
				writer.on('error', function(err) {
					// there is chance that more than one thread execute here.if it's reopen exception, don't throw error.
					if (err.code == 'EEXIST') {
						console.log('error===== ' + err.message);
					} else {
						throw err;
					}
				});
				writer.on('open', function(fd) {
					console.log(appendStr);
					writer.end(appendStr);
					// append new car types to the exist exist_car_type.txt file.			
					writer = fs.createWriteStream(path.join(output_dir, 'exist_car_type.txt'), {encoding:'utf-8', flags:'a'});
					writer.end(appendStr);
					// send mail
					mail(path.join(__dirname, now_file));
				});
			} else {
				console.log(now + ' 没有最新的车型!');
			}
		}
    }
}, { verbose: false, ignoreWhitespace: true });

var mainhandler = new htmlparser.DefaultHandler(function (error, dom) {
    if (!error) {

    	// calculate the pages of all car-type
		var countTag = htmlparser.DomUtils.getElementsByTagName("span", htmlparser.DomUtils.getElements({ class: "searchmain-title" }, dom));
		count = parseInt(countTag[0]['children'][0]['data']);
		
		var names = htmlparser.DomUtils.getElements({ class: "ul-name" }, dom);
		names = htmlparser.DomUtils.getElementsByTagType("text", names);
		// console.log(util.inspect(names, false, null));
		var pages = Math.ceil(count / names.length);
		var t_pages = pages;
		console.log('从汽车之家搜索到'+count+'个车型，共' + pages + '页数据');

		for (var n in names) {
			var ct = names[n]['data'];
			auto_car_type.push(ct);
			if (exist_car_type.indexOf(ct) < 0)
				new_car_type.push(ct);
			// writer.write(ct + "\n");
		}
		// completed += 1;
		
		var urls = [];
		while (t_pages > 1) {
			urls.push(util.format(path_base, t_pages - 1));
			t_pages -= 1;
		}

		// begin get car type from every url.
		async.each(urls, function(url, callback) {
			// console.log('begin get car type from url :' + url);
			getPage(pagehandler, url);
			callback();
		}, 
		function(err) {
			if (err) {
				console.log(err.message);
				writer.end();
				throw err;
			}
		});

    }
}, { verbose: false, ignoreWhitespace: true });


fs.readFile(path.join(output_dir, 'exist_car_type.txt'), {encoding:'utf-8'}, function(err, data) {
	if (err) throw err;
	data = data.trim().replace(/\r\n/g, UNIX_LINE_SEP);
	exist_car_type = data.trim().split(UNIX_LINE_SEP);
	console.log('现有'+exist_car_type.length+'款车型');
	// console.log(exist_car_type);

	getPage(mainhandler, main_url);
});