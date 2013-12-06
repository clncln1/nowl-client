var os=require('os'),
	exec=require('child_process').exec;

module.exports={
	name:'socket',
	exec:getSocketsViaNetstat
};

//ss -s seems to provide strange results
function getSockets(cb){
	if(os.platform() === 'win32') cb(null, 0);
	
	else exec('ss -s',function(err,stdout,stderr){
		if(err)
			getSocketsViaNetstat(cb);
		else{
			var match=stdout.match(/Total:\s*(\d+)\s*/);
			if(match&&match.length>=2){
				cb(null,parseInt(match[1]));
			}else{
				getSocketsViaNetstat(cb);
			}
		}
	});
}

function getSocketsViaNetstat(cb){
	if(os.platform() === 'win32') cb(null, 0);
	
	else exec('netstat -an | grep ESTABLISHED | wc -l',function(err,stdout,stderr){
		if(err)
			cb(err);
		else{
			stdout=stdout.trim();
			if(stdout.match(/^\d+$/)){
				cb(null,parseInt(stdout));
			}else{
				cb(new Error('Could not parse amount of opened sockets'));
			}
		}
	});
}