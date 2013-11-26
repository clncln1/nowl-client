var fs=require('fs'),
	util=require('util'),
	exec=require('child_process').exec,
	EventEmitter=require('events').EventEmitter;


module.exports={
	name:'process',
	props:[
		{'name':'findBy','type':'enum','values':['processName','pid','pidFile'],'default':'processName'},
		{'name':'findValue','type':'string','default':'node'},
		{'name':'interval','type':'number','default':5000}
	],
	EventAgent:ProcessWatcher
};

function ProcessWatcher(params){
	this.opts=params;
	this.timer=0;
	this.paused=true;
	this.lastStatus={
		status:null,
		description:null
	};
}

util.inherits(ProcessWatcher,EventEmitter);

ProcessWatcher.prototype.start=function(){
	this.paused=false;
	this.timer=setTimeout(this._tick.bind(this),this.opts.interval);
}

ProcessWatcher.prototype.stop=function(){
	this.paused=true;
	clearTimeout(this.timer);
}

ProcessWatcher.prototype._tick=function(){
	var that=this;
	if(this.opts.findBy==='pidFile'){
		fs.readFile(this.opts.findValue, 'utf8', function(err,conts){
			if(err){
				that._onTestResult(new Error('Could not read pid file'));
			}else{
				that._test('pid',conts);
			}
		});
	}else{
		this._test(this.opts.findBy,this.opts.findValue);
	}
}

ProcessWatcher.prototype._test=function(findBy,findValue){
	var cmd = findBy==='pid' ? 'ps -p '+findValue : 'ps cax | grep '+findValue,
		that=this;
	exec(cmd,function(err){
		if(err){
			that._onTestResult(new Error('Process is not running'));
		}else{
			that._onTestResult();
		}
	});
}

ProcessWatcher.prototype._onTestResult=function(err){
	if(this.lastStatus.status==null||err&&this.lastStatus.status||!err&&!this.lastStatus.status){
		this.lastStatus.status=!err;
		this.lastStatus.description=err ? err.message : 'Process is running';
		this.emit('update',this.lastStatus);
	}
	if(!this.paused)
		this.timer=setTimeout(this._tick.bind(this),this.opts.interval);
}