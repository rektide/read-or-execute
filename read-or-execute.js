#!/usr/bin/env node
"use strict"

var
  spawn= require( "mz/child_process").spawn,
  fs= require( "mz/fs")

function checkExecutable( stat){
	// could maybe should compute some kind of fancier "can this user execute"
	// instead accept any execute bits
	return stat.mode& 0x111
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
	if( options.encoding=== false|| options.encoding=== null){
		delete options.encoding
	}else if( !options.encoding){
		options.encoding= "utf8"
	}

	var
	  // get stats
	  stat= await fs.stat( options.path),
	  // check stats
	  executableCheck= options.checkExecutable|| checkExecutable,
	  isExecutable= executableCheck.call(options, stat)

	// fork
	if( isExecutable){
		// spawn child
		var child= spawn( options.path, options.arguments, options)
		child.stdout.readOrExecute= "execute"
		if( !options.childStart){
			// by default finish stdin
		}else{
			// allow `childStart` option to pass in custom init behavior
			options.childStart.call( options, child)
		}
		return child.stdout
	}else{
		var stream= fs.createReadStream( path, options)
		stream.readOrExecute= "read"
		return stream
	}
}

function main(){
	var file= process.argv[2]
	if( !file){
		throw new Error("Expected one argument: file")
	}
	readOrExecute( file).then( e=> e.on( "data", console.log))
}

module.exports= readOrExecute
module.exports.checkExecutable= checkExecutable

if( typeof( require)!== "undefined"&& require.main=== module){
	main()
}
