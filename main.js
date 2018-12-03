const readline = require("readline");
const fs = require("fs");

const rl = readline.createInterface(
{
	input: process.stdin,
	output: process.stdout
});

const login = require("facebook-chat-api");

console.log("");

if(fs.existsSync("appstate.json"))
{
	console.log("Logging in with cookies...");
	login({appState: JSON.parse(fs.readFileSync("appstate.json", "utf8"))}, (err, api) =>
	{
		api.setOptions({logLevel: "silent"});
		if(err) return console.error(err);
		fs.writeFileSync("appstate.json", JSON.stringify(api.getAppState()));
		logged(api);
	});
}else
{
	rl.question("Enter email: ", (user) => 
	{
		rl.question("Enter password: ", (pass) => 
		{
			console.log("Logging in with email...");
			login({email: user, password: pass}, (err, api) =>
			{
				if(err)
				{			
					switch (err.error)
					{
						case 'login-approval':
							rl.question("\nEnter code: ", (code) => 
							{
								err.continue(code);
							});
							return;
						default:
							rl.close();
							return console.error(err.error);
					}
				}
				api.setOptions({logLevel: "silent"});
				fs.writeFileSync("appstate.json", JSON.stringify(api.getAppState()));
				logged(api);
			});
		});
	});
}

function logged(api)
{
	console.log("Logged in!");
	console.log("\nChoose the thread you want to dump\nEnter nothing to load next 20 threads");
	fetchThreads(api, null, 1);
}

function fetchThreads(api, timestamp, i)
{
	var start = i;
	api.getThreadList(20, timestamp, [], function(err, info)
	{
		if(err) return console.error(err);
		for(var thread of info)
		{
			var name = thread.name;
			if(name === null)
			{
				name = "";
				for(var user of thread.participants)
				{
					name += user.name + ", ";
				}
				name = name.substring(0, name.length - 2);
				thread.name = name;
			}
			console.log(i+". "+name);
			i++;
		}		
		rl.question("\nEnter thread id: ", (id) => 
		{
			var thread = info[id-start];
			if(id.length == 0 || thread === undefined)
			{
				fetchThreads(api, parseInt(info[info.length-1].lastMessageTimestamp), i);
			}else
			{
				dump(api, thread);
			}
		});
	});
}

async function dump(api, thread)
{
	console.log("\nDumping "+thread.name);
	console.log("Message count: "+thread.messageCount);
	var myID = api.getCurrentUserID();
	var timestamp = null;
	var i = 0;
	var arr = [];
	while(true)
	{
		var history = await fetchHistory(api, thread, timestamp);
		var oldtimestamp = timestamp;
		timestamp = parseInt(history[0].timestamp);
		if(oldtimestamp != null)
		{
			history = history.slice(0, history.length-1);
		}
		if(history.length == 0)
		{
			break;
		}
		history.reverse();
		for(h of history)
		{
			var obj = {};
			var id = h.senderID;
			if(id == myID)
			{
				id = "you";
			}
			obj.date = h.timestamp;
			obj.id = id;
			obj.body = h.body;
			obj.attachments = h.attachments;
			arr.push(obj);
		}
		i+=history.length;
		console.log("Fetching... "+i+"/"+thread.messageCount);
	}
	console.log("Done!");
	if(!fs.existsSync("dump"))
	{
		fs.mkdirSync("dump");
	}
	fs.writeFileSync("dump/"+thread.name.split(" ").join("_").toLowerCase()+".json", JSON.stringify(arr));
	rl.close();
}

async function fetchHistory(api, thread, timestamp)
{
	return new Promise((ret) =>
	{
		api.getThreadHistory(thread.threadID, 500, timestamp, (err, history) => 
		{
			if(err) return console.error(err);
			ret(history);
		});
	});
}

