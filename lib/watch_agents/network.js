var os=require('os'),
	system=os.platform().toLowerCase(),
	exec=require('child_process').exec;

module.exports={
	name:'network',
	exec:getNetworkUtilization
};

function getNetworkUtilization(cb){
	if(system==='darwin')
		getNetworkUtilizationDarwin(cb);
	else if(system==='linux')
		getNetworkUtilizationLinux(cb);
	else
		setImmediate(cb,null,[]);
}

function getNetworkUtilizationDarwin(cb, prevVals){
	exec('netstat -ib',function(err,stdout,stderr){
		if(err)
			cb(err);
		else{
			var headers=null,
				vals={};
			stdout.split('\n').forEach(function(line){
				if(line.trim()==='')
					return;
				var splitted=line.split(/\s+/);
				if(!headers)
					headers=splitted;
				else{
					if(splitted.length!==headers.length)
						return;
					if(!vals.hasOwnProperty(splitted[headers.indexOf('Name')]))
						vals[splitted[headers.indexOf('Name')]]={
							input:0,
							output:0
						};
					vals[splitted[headers.indexOf('Name')]].input+=parseInt(splitted[headers.indexOf('Ibytes')]);
					vals[splitted[headers.indexOf('Name')]].output+=parseInt(splitted[headers.indexOf('Obytes')]);
				}
			});
			if(!prevVals)
				setTimeout(getNetworkUtilizationDarwin,1000,cb,vals);
			else{
				var diff=[];
				for(var key in vals){
					if(vals.hasOwnProperty(key)&&prevVals.hasOwnProperty(key)){
						diff.push({name:key+'-input',value:vals[key].input-prevVals[key].input});
						diff.push({name:key+'-output',value:vals[key].output-prevVals[key].output});
					}
				}
				cb(null,diff);
			}
		}
	});
}

function getNetworkUtilizationLinux(cb, prevVals){
	exec('netstat -ie',function(err,stdout,stderr){
		if(err)
			cb(err);
		else{
			var currentInterface=null;
			var vals={};
			stdout.split('\n').forEach(function(line){
				line=line.trim();
				if(line.toLowerCase()==='kernel interface table' || line===''){
					currentInterface=null;
					return;
				}
				if(!currentInterface){
					currentInterface=/^([^\s]+)/.exec(line)[0];
					vals[currentInterface]={
						input:0,
						output:0
					};
				}else{
					var lineMatch=/(R|T)X bytes:([^\s]+)/g;
					var currentMatch=null;
					while((currentMatch=lineMatch.exec(line))!==null){
						if(currentMatch[1]==='R')
							vals[currentInterface].input+=parseInt(currentMatch[2]);
						else if(currentMatch[1]==='T')
							vals[currentInterface].output+=parseInt(currentMatch[2]);
					}
				}
			});
			if(!prevVals)
				setTimeout(getNetworkUtilizationLinux,1000,cb,vals);
			else{
				var diff=[];
				for(var key in vals){
					if(vals.hasOwnProperty(key)&&prevVals.hasOwnProperty(key)){
						diff.push({name:key+'-input',value:vals[key].input-prevVals[key].input});
						diff.push({name:key+'-output',value:vals[key].output-prevVals[key].output});
					}
				}
				cb(null,diff);
			}
		}
	});
}