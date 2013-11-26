var os=require('os');

module.exports={
	name:'cpu',
	exec:function(cb){
		getCPUUsage(cb);
	}
};

function getCPUUsage(cb,prevTotal,prevIdle){
	var cpus=os.cpus();
	var total=0;
	var idle=0;
	cpus.forEach(function(cpu){
		for(var key in cpu.times){
			if(cpu.times.hasOwnProperty(key)){
				total+=cpu.times[key];
				if(key==='idle'){
					idle+=cpu.times[key];
				}
			}
		}
	});
	if(prevTotal!==undefined&&prevIdle!==undefined){
		cb(null, 1-(idle-prevIdle)/(total-prevTotal));
	}else{
		setTimeout(getCPUUsage,1000,cb,total,idle);
	}
}