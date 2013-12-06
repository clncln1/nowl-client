var os = require('os'),
	exec=require('child_process').exec;

module.exports={
	name:'disk',
	exec:getDiskUsage
};

function getDiskUsage(cb){
	if(os.platform() === 'win32') cb(null, {'disks': 'not yet supported on this os'});
	else exec('df -k',function(err,stdout,stderr){
		if(err){
			cb(err);
		}else{
			var vals=[];
			stdout.split('\n').forEach(function(line){
				if(/(^\s*$)|(^[^\/].*$)|(^Filesystem)/.test(line))
					return;
				var splitted=line.split(/\s+/);
				var partInfo={
					size: parseInt(splitted[1]),
					used: parseInt(splitted[2])
				};
				if(isNaN(partInfo.size)||isNaN(partInfo.used))
					return;
				vals.push({name:splitted[splitted.length-1],value:partInfo.used/partInfo.size})
			});
			cb(null,vals);
		}
	});
}