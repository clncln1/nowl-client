var fs=require('fs'),
	async=require('async'),
	Promise=require('promise'),
	util=require('util'),
	availableWatchers={},
	watchers={};



module.exports={
	run:run,
	setWatchers:setWatchers,
	getAvailableWatchers:function(){
		return Object.keys(availableWatchers).map(function(k){
			return {name:k};
		});
	}
};

function run(){
	return new Promise(function(resolve,reject){
		var watcherNames=Object.keys(watchers);
		async.parallel(watcherNames.map(function(key){return watchers[key];}),
		function(err,results){
			if(err)
				reject(err);
			else{
				resolve(watcherNames.map(function(ele,idx){ return {name:ele,value:results[idx]};}));
			}
		});
	});
}

function setWatchers(arr){
	if(!util.isArray(arr)){
		throw new Error('Argument must be an array');
	}
	watchers={};
	arr.forEach(function(ele){
		if(ele.name && availableWatchers.hasOwnProperty(ele.name))
			watchers[ele.name]=availableWatchers[ele.name];
	});
}

(function includeModules(){
	fs.readdir(__dirname+'/watch_agents',function(err,files){
		if(err){
			console.error("Unable to read contents of directory ./watch_agents");
		}else{
			files.forEach(function(file){
				var newModule=require(__dirname+'/watch_agents/'+file);
				if(typeof newModule !== 'object' || typeof newModule.name !== 'string' || typeof newModule.exec !== 'function'){
					return console.error('Invalid module found at (will be ignored):'+file);
				}
				if(!availableWatchers.hasOwnProperty(newModule.name)){
					availableWatchers[newModule.name]=newModule.exec;
				}
			});
		}
		setTimeout(includeModules,60000);
	});
})();