var fs=require('fs'),
	async=require('async'),
	Promise=require('promise'),
	util=require('util'),
	EventEmitter=require('events').EventEmitter,
	helper=require('./helper'),
	availableEvents={},
	events={};


(function(){
	var availableEvents={},
		events={},
		obj=new EventEmitter();

	obj.setEvents=setEvents;
	obj.getAvailableEvents=getAvailableEvents;

	module.exports=obj;

	function setEvents(arr){
		if(!util.isArray(arr)){
			throw new Error('Argument must be an array');
		}
		arr.forEach(function(ele){
			if(ele.name && availableEvents.hasOwnProperty(ele.name)){
				var props=applyDefaultPropValues(availableEvents[ele.name].props,ele.props);
				if(events.hasOwnProperty(ele.id)){
					events[ele.id].removeAllListeners();
					events[ele.id].stop();
				}
				events[ele.id]=new availableEvents[ele.name].EventAgent(props);
				events[ele.id].on('update',helper.curry(onEvent,ele.id));
				events[ele.id].start();
			}
		});
		for(var eventid in events){
			var found=arr.some(function(ele){
				return ele.id==eventid;
			});
			if(!found){
				events[eventid].removeAllListeners();
				events[eventid].stop();
			}
		}
	}

	function getAvailableEvents(){
		return Object.keys(availableEvents).map(function(k){
			return {name:k,props:availableEvents[k].props};
		});
	}

	function onEvent(id,event){
		obj.emit('event',helper.collectProperties({id:id},event));
	}

	function applyDefaultPropValues(moduleProps,userProps){
		var props={};
		moduleProps.forEach(function(prop){
			if(userProps.hasOwnProperty(prop.name)){
				props[prop.name]=prop.type==='number'?parseInt(userProps[prop.name]):userProps[prop.name];
			}else{
				props[prop.name]=prop.default||null;
			}
		});
		return props;
	}

	(function includeModules(){
		fs.readdir(__dirname+'/event_agents',function(err,files){
			if(err){
				console.error("Unable to read contents of directory ./event_agents");
			}else{
				files.forEach(function(file){
					var newModule=require(__dirname+'/event_agents/'+file);
					if(typeof newModule !== 'object' || typeof newModule.name !== 'string' || typeof newModule.EventAgent !== 'function' || !util.isArray(newModule.props)){
						return console.error('Invalid module found at (will be ignored):'+file);
					}
					if(!availableEvents.hasOwnProperty(newModule.name)){
						availableEvents[newModule.name]={
							EventAgent: newModule.EventAgent,
							props: newModule.props
						}
						obj.emit('update',{name:newModule.name,props:newModule.props});
					}
				});
			}
			setTimeout(includeModules,60000);
		});
	})();
})();