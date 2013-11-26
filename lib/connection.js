var util=require('util'),
	EventEmitter=require('events').EventEmitter,
	io=require('socket.io-client'),
	helper=require('./helper');

function ConnectionManager(){
	this._connections=[];
	setTimeout(this._checkConnections.bind(this),10000);
}

util.inherits(ConnectionManager,EventEmitter);

ConnectionManager.prototype.send=function(type,msg,client){
	this._connections.forEach(function(conn){
		if(client&&conn!==client)
			return;
		conn.emit(type,msg);
	});
};

ConnectionManager.prototype.connect=function(address){
	var newConn=io.connect(address,{
		'reconnection limit': 5000,
		'max reconnection attempts': Infinity
	});
	newConn.on('connect',helper.curry(this._onConnect,this));
	newConn.on('disconnect',helper.curry(this._onDisconnect,this));
	newConn.on('connect_failed',helper.curry(this._onConnectionError,this));
	newConn.on('reconnect_failed',helper.curry(this._onConnectionError,this));
	newConn.on('watch',this._onWatch.bind(this));
	newConn.on('acknowledge',helper.curry(this._onAcknowledge,this));
	this._connections.push(newConn);
};

ConnectionManager.prototype._onConnect=function(manager){
	manager.emit('connect',this);
};

ConnectionManager.prototype._onDisconnect=function(manager){
	manager.emit('disconnect',this);
}

ConnectionManager.prototype._onConnectionError=function(manager){
	manager.emit('connectionerror',this);
};

ConnectionManager.prototype._onWatch=function(msg){
	this.emit('watch',msg);
};

ConnectionManager.prototype._onAcknowledge=function(manager){
	manager.emit('acknowledge',this);
}

ConnectionManager.prototype._checkConnections=function(){
	this._connections.forEach(function(conn){
		/*console.log('checking connection: ',conn.socket.connected,conn.socket.connecting,conn.socket.reconnecting);
		if(!conn.socket.connected&&!conn.socket.connecting&&!conn.socket.reconnecting){
			conn.socket.connect();
		}*/
	});
	setTimeout(this._checkConnections.bind(this),10000);
}

module.exports=new ConnectionManager();