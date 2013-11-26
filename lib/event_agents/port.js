var fs=require('fs'),
	util=require('util'),
	exec=require('child_process').exec,
	EventEmitter=require('events').EventEmitter;

module.exports={
	name:'port',
	props:[
		{'name':'protocol','type':'enum','values':['TCP','UDP'],'default':'TCP'},
		{'name':'port','type':'number','default':80},
		{'name':'interval','type':'number','default':5000}
	],
	EventAgent:PortWatcher
};

function PortWatcher(params){
	this.opts=params;
	this.timer=0;
	this.paused=true;
	this.lastStatus={
		status:null,
		description:null
	};
}

util.inherits(PortWatcher,EventEmitter);

PortWatcher.prototype.start=function(){
	this.paused=false;
	this.timer=setTimeout(this._test.bind(this),this.opts.interval);
}

PortWatcher.prototype.stop=function(){
	this.paused=true;
	clearTimeout(this.timer);
}

PortWatcher.prototype._test=function(){
	var cmd='lsof -i '+this.opts.protocol+':'+this.opts.port+' -P'+(this.opts.protocol==='TCP'?' | grep LISTEN':'');
	exec(cmd,this._onTestResult.bind(this));
};

PortWatcher.prototype._onTestResult=function(err,stdout){
	if(this.lastStatus.status==null||err&&this.lastStatus.status||!err&&!this.lastStatus.status){
		this.lastStatus.status=!err;
		if(err){
			this.lastStatus.description='No Process is listening on that port'
		}else{
			this.lastStatus.description=(/^[^\s]*/.exec(stdout)[0]||'<unknown process>')+' is listening on that port';
		}
		this.emit('update',this.lastStatus);
	}
	if(!this.paused)
		this.timer=setTimeout(this._test.bind(this),this.opts.interval);
};