#!/usr/bin/env node
const express = require('express');
const app = express();
const mode = process.argv[2];

// dev. mode
// this code block is unnecessary for normal usage of the component
if (mode){
	//enable cors
	app.use(require('cors')())
	// server static samples
	app.use(express.static('./'));
}




require("./common")(app, express);
require("./saverename")(app, express);

app.listen(3000, () => console.log('run on port 3000'));




// dev. mode
// this code block is unnecessary for normal usage of the component
if (mode && mode !== "site"){
	// open samples in browser
	require('opn')(process.argv[2]);
}