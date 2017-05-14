#!/usr/bin/env node
"use strict"

var
  spawn= require( "mz/child_process").spawn,
  fs= require( "mz/fs")

var execMode= fs.constants.S_IXUSR| fs.constants.S_IXGRP| fs.constants.S_IXOTH

function checkExecutable( stat){
	// could maybe should compute some kind of fancier "can this user execute"
	// instead accept any execute bits
	return stat.mode& execMode
}

function childErr( child){
	return new Promise(( resolve, reject)=>{
		child.on( "error", function(err){
			reject( err)
		})
	})
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
		var child = spawn( options.path, options.arguments, options)
		// node instructs us to asynchronously wait for "error" event
		// but offers no way to check success for a program that for ex starts and sleeps
		// i grok this, we're rolling with it:
		if( !child.pid){
			// promise that will throw with the error
			var err= childErr( child)

			// allow users to opt out of this "enhacement"
			if( options.noLocalSpawn){
				// return a promise that will throw with the error
				return err
			// by default, act like a createReadFile and try ./[filename] too
			} else{
				// try again, doing what createReadFile would do for us
				child = spawn( "./" + options.path, options.arguments, options)
				// again synchronously check for immediate failure
				if( !child.pid){
					// consume new error
					child.on("error", x=> null)

					// promise throwing original error
					return err
				}else{
					err.catch(x=> undefined)
				}
			}
		}

		// fix up encoding if encoding set
		if( options.encoding){
			child.stdout.setEncoding( options.encoding)
		}
		// decorate fact that this is an executable
		child.stdout.readOrExecute= "execute"
		//  end stdin (or allow caller to deal with this)
		if( !options.childStart){
			// by default finish stdin
			child.stdin.end()
		}else{
			// allow `childStart` option to pass in custom init behavior
			options.childStart.call( options, child)
		}

		// return output
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
