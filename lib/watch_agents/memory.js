var os=require('os');

module.exports={
	name:'memory',
	exec:function(cb){
		setImmediate(cb,null,1-os.freemem()/os.totalmem());
	}
};