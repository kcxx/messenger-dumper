const readline = require('readline');
const login = require("facebook-chat-api");
const fs = require("fs");

const rl = readline.createInterface(
{
  input: process.stdin,
  output: process.stdout
});

if(fs.existsSync('appstate.json'))
{
	console.log("Logging in with cookies...");
	login({appState: JSON.parse(fs.readFileSync('appstate.json', 'utf8'))}, (err, api) =>
	{
		api.setOptions({logLevel: "silent"});
		if(err) return console.error(err);
		fs.writeFileSync('appstate.json', JSON.stringify(api.getAppState()));
		fetchThreads(api);
	});
}
else
{
	rl.question('Enter email: ', (user) => 
	{
		rl.question('Enter password: ', (pass) => 
		{
			console.log("Logging in with email...");
			login({email: user, password: pass}, (err, api) =>
			{
				api.setOptions({logLevel: "silent"});
				if(err) return console.error(err);
				fs.writeFileSync('appstate.json', JSON.stringify(api.getAppState()));
				fetchThreads(api);
			});
		});
	});
}

function fetchThreads(api)
{
	console.log("Logged in!");	
}
