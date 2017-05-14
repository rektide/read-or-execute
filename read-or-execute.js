#!/usr/bin/env node
"use strict"

var
  spawn= require( "mz/child_process").spawn,
  createReadStream= require( "mz/fs").createReadStream

function checkExecutable( stat){
	// could maybe should compute some kind of fancier "can this user execute"
	// instead accept any execute bits
	return stat& 0x111
}

async function readOrExecute( path, options){
	options= options|| {}

	// fold optional path arg onto options
	var pathIsString= typeof( path)=== "string"
	if( pathIsString){
		options.path= path
	}else if( path&& !options){
		options= path
	}
	// we are now done with path

	// default encoding
	if( options.encoding=== False|| options.encoding=== null){
		delete options.encoding
	}else if( !options.encoding){
		options.encoding= "utf8"
	}

	var
	  // get stats
	  stat= await fs.stat( this.path),
	  // check stats
	  executableCheck= this.checkExecutable|| checkExecutable,
	  isExecutable= executableCheck.call(this, stat)

	// fork
	if( isExecutable){
		// spawn child
		var child= spawn( path, options.arguments, options)
		child.stdout.readOrExecute= "execute"
		if( !options.childStart){
			// by default finish stdin
		}else{
			// allow `childStart` option to pass in custom init behavior
			options.childStart.call( this, child)
		}
		return child.stdout
	}else{
		var stream= createReadStream( path, this)
		stream.readOrExecute= "read"
		return stream
	}
}

module.exports= readOrExecute
