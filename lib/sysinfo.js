var os=require('os'),
	exec=require('child_process').exec,
	async=require('async'),
	Promise=require('promise'),
	helper=require('./helper');

module.exports=function(){
	return new Promise(function(resolve,reject){
		async.parallel([
			getOS,
			getCPU,
			getHostname,
			getIPs,
			getNodeVersion,
			getDiskCapacity],
			function(err,results){
				if(err)
					reject(err);
				else
					resolve(helper.collectProperties.apply(this,results));
			});
	});
};

var PATHS={
};

function getOS(cb){
	setImmediate(cb,null,{'os':os.type()+' '+os.release()});
}

function getCPU(cb){
	var cpus=os.cpus();
	setImmediate(cb,null,{'cpu':cpus.length>0?cpus[0].model:'unknown','cpuamount':cpus.length});
}

function getHostname(cb){
	exec('hostname -f',function(err,stdout,stderr){
		cb(err,{'hostname':stdout.trim()});
	});
}

function getIPs(cb){
	var interfaces=os.networkInterfaces();
	var ips=[];
	for(var key in interfaces){
		if(interfaces.hasOwnProperty(key)){
			interfaces[key].forEach(function(addr){
				if(!addr.internal){
					ips.push(addr.address);
				}
			});
		}
	}
	setImmediate(cb,null,{'ips':ips});
}

function getNodeVersion(cb){
	setImmediate(cb,null,{'node':process.version});
}

function getMemory(cb){
	setImmediate(cb,null,{'memory':os.os.totalmem()});
}

function getDiskCapacity(cb){
	exec('df -k',function(err,stdout,stderr){
		if(err){
			cb(err);
		}else{
			var disks=[];
			stdout.split('\n').forEach(function(line){
				if(/(^\s*$)|(^[^\/].*$)|(^Filesystem)/.test(line))
					return;
				var splitted=line.split(/\s+/);
				if(splitted[1]==='0')
					return;
				disks.push({name:splitted[splitted.length-1],size:parseInt(splitted[1])});
			});
			cb(null,{'disks':disks});
		}
	});
}