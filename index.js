var util = require('util'),
	EventEmitter = require('events').EventEmitter;

var Different=function(args){
	EventEmitter.call(this);
	var self=this;

	var db=require('somewhere'),
		path=require('path');
	
	var _saveScan=function(o){
		if(!!o.id){
			return db.update('files',o.id,o);
		}
		return db.save('files',o);
	}
	var _defaultScanObject=function(dir){
		return {dir:dir,lines:{}};
	}
	var _findOneScan=function(dir){
		var tmp;
		try{
			tmp=db.findOne('files',{dir:dir})||_defaultScanObject(dir);
		}catch(e){
			tmp=_defaultScanObject(dir);
		}
		return _saveScan(tmp);
	}

	var findMissing=function(store,from,to,as,onFound){
		var files=0;
		for(var x in from){
			files++;
			if(!to[x]){
				store[as].push(from[x]);
			}else if(!!onFound){
				onFound(from[x],to[x],x);
			}
		}
		return files;
	}

	var progress={task:0,tasks:['searching','processing'],at:0,total:0};
	var _prepare=function(news){
		for(var x in news){
			compareFiles(_findOneScan(x),news[x]);
		}
		progress.completed=true;
		self.emit('completed',{result:changes});
	}

	var changes=0;
	var compareFiles=function(o,lines){
		var diffs={dir:o.dir,created:[],updated:[],deleted:[],storage:args.id||0};
		progress.at+=findMissing(diffs,lines,o.lines,'created');
		findMissing(diffs,o.lines,lines,'deleted',function(x,y,name){
			if(x.size!=y.size || x.time!=y.time){
				diffs.updated.push(x);
			}
		});
		var change=diffs.created.length+diffs.updated.length+diffs.deleted.length;
		if(change>0){
			changes+=change;
			o.lines=lines;
			_saveScan(o);
			self.emit('found',{result:diffs});
		}
	}

	different.prototype.find = function(news) {
		db.connect(path.join(__dirname,'cache',args.name+'.json'));
		_prepare(news);
	};
}
util.inherits(different, EventEmitter);
exports = module.exports = function(args) {
  return new different(args);
};