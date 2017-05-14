# Read Or Execute

> Read or execute a file to get a content stream

If a file is executable, run it, otherwise read it's contents.

Typically this is used for config files that can be either static or executable.

* Options passed in are forwarded to the underlying `child_process.spawn` or `fs.createReadFile`.
* Defaults to "utf8" encoding (unless set to null).
* Async-function implementation. Underlying platform promisification via standard `mz` dependency.

