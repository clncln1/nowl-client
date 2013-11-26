#!/usr/bin/env node

var fs=require('fs'),
	sysinfo=require('./sysinfo')
	io=require('socket.io-client'),
	conn=require('./connection'),
	watcher=require('./watcher'),
	events=require('./events'),
	spawn=require('child_process').spawn,
	helper=require('./helper');

//detect if we have been included as module or called directly
var opts;
console.log(process.env.DEBUG);
if(require.main===module){
	(function(){
		var args={};
		var curopt=null;
		var argv=process.argv.splice(2);
		var isDaemon=false;
		if(argv.indexOf('-daemon')!==-1){
			argv.splice(argv.indexOf('-daemon'),1);
			isDaemon=true;
		}
		argv.forEach(function(val){
			if(!curopt){
				if(val.indexOf('-')===0){
					curopt=val.substring(1);
				}
			}else{
				if(args.hasOwnProperty(curopt)){
					args[curopt]=[args[curopt],val];
				}else{
					args[curopt]=val;
				}
				curopt=null;
			}
		});
		if(isDaemon){
			console.log('starting up an nowl-client daemon...');
			var stdoutFd,stderrFd;
			if(args.hasOwnProperty('logfile')){
				try{
					stdoutFd=fs.openSync(args.logfile,'a');
				}catch(err){
					console.error(helper.log.error,'could not open file',args.logfile);
				}
			}else{
				console.log(helper.log.warn,'-logfile file parameter not specified');
			}
			if(args.hasOwnProperty('errfile')){
				try{
					stderrFd=fs.openSync(args.errfile,'a');
				}catch(err){
					console.error(helper.log.error,'could not open file',args.errfile);
				}
			}else{
				console.log(helper.log.warn,'-errfile file parameter not specified');
			}
			var daemon=spawn(process.execPath,[require.main.filename].concat(argv),{
				detached:true,
				stdio:['ignore',stdoutFd?stdoutFd:'ignore',stderrFd?stderrFd:'ignore']
			});
			console.log('started daemon with PID',daemon.pid);
			if(args.hasOwnProperty('pidfile')){
				try{
					fs.writeFileSync(args.pidfile,daemon.pid);
				}catch(err){
					console.error(helper.log.error,'could not write PID file:',err);
				}
			}
			daemon.unref();
			process.exit();
		}
		opts=applyDefaultOptions(args);
		start();
	})();
}else{
	module.exports=function(args){
		opts=applyDefaultOptions(args);
		start();
	};
}

function start(){

	(function watchLoop(){
		watcher.run().then(function(res){
			//console.log(JSON.stringify(res));
			conn.send('status',res);
			setTimeout(watchLoop,opts.watchinterval);
		},function(err){
			console.log("watcher err: ",err);
			setTimeout(watchLoop,opts.watchinterval);
		});
	})();

	//module updates
	events.on('update',function(newModule){
		conn.send('registerModules',{events:[newModule]});
	});

	events.on('event',function(event){
		console.log('sending update now:'+JSON.stringify(event));
		conn.send('event',event);
	});

	// connection management
	conn.on('connect',function(connection){
		console.log('connection to '+connection.socket.options.host+' established');
		sendClientInfo(connection);
	});

	conn.on('disconnect',function(connection){
		console.log('connection to '+connection.socket.options.host+' closed');
	});

	conn.on('connectionerror',function(connection){
		console.log('connection to '+connection.socket.options.host+' could not be established');
	});

	conn.on('acknowledge',function(connection){
		conn.send('registerModules',{status:watcher.getAvailableWatchers(),events:events.getAvailableEvents()},connection);
	});

	conn.on('watch',function(watchInfo){
		//console.log('watchinfo:'+JSON.stringify(watchInfo));
		if(watchInfo && watchInfo.status){
			watcher.setWatchers(watchInfo.status);
		}
		if(watchInfo && watchInfo.events){
			events.setEvents(watchInfo.events);
		}
	});

	if(opts.server){
		if(typeof opts.server === 'string')
			opts.server=[opts.server];
		opts.server.forEach(function(server){
			console.log('trying to connect to '+server);
			conn.connect(server);
		});
	}
};

//send static client information to server
function sendClientInfo(connection){
	sysinfo().then(function(result){
		conn.send('register',result,connection);
	},
	function(err){
		console.error('error received:',err);
	}).then(0,console.log);
}

function applyDefaultOptions(o){
	return {
		server:o.server||[],
		watchinterval:parseInt(o.watchinterval)||10000,
	};
}