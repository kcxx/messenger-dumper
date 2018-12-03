const readline = require("readline");
const fs = require("fs");

const rl = readline.createInterface(
{
	input: process.stdin,
	output: process.stdout
});

console.log("");

const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function daysInMonth(month, year)
{
	return new Date(year, month, 0).getDate();
}

function ljust(str, l)
{
	str = "" + str;
	while(str.length < l)
	{
		str += " ";
	}
	return str;
}

function reverseForIn(obj, f)
{
	var arr = [];
	
	for (var key in obj)
	{
		arr.push(key);
	}
	
	for (var i=arr.length-1; i>=0; i--)
	{
		f.call(obj, arr[i]);
	}
}

rl.question("Select json file: ", (file) =>
{
	if(!file.startsWith("dump/")) file = "dump/"+file;
	if(!file.endsWith(".json")) file += ".json";
	
	if(fs.existsSync(file))
	{
		fs.readFile(file, "utf8", function (err, data)
		{
			if(err) throw err;
			obj = JSON.parse(data);
			parse(obj);
		});
	}else
	{
		console.log("File "+file+" doesn't exist");
		rl.close();
	}
});

function parse(obj)
{
	var j = 0;
	var stats = {};
	var monthstats = {};
	for(var msg of obj)
	{
		var date = new Date(parseInt(msg.date));
		var key = monthNames[date.getMonth()] + " " + date.getFullYear();
		var k = 1;
		if(msg.id === "you")
		{
			k = 0;
		}
		if(!stats[key])
		{
			monthstats[key] = [];
			monthstats[key][0] = 0;
			monthstats[key][1] = 0;
			stats[key] = [];
			for(var i=1; i<=daysInMonth(date.getMonth()+1, date.getFullYear()); i++)
			{
				stats[key][i] = [];
				stats[key][i][0] = 0;
				stats[key][i][1] = 0;
			}
		}
		monthstats[key][k]++;
		stats[key][date.getDate()][k]++;
		j++;
	}
	
	reverseForIn(stats, function(month)
	{
		var you = monthstats[month][0];
		var her = monthstats[month][1];
		var ratio = Math.floor(you/her*100)/100;		
		console.log("_______________________________________________________________________________");
		console.log(month + "   " + ljust(you+her, 10) + "  you: "+ljust(you,5)+" him/her: "+ljust(her,5)+" ratio: "+ratio + "\n");
		for(var i=1; i<stats[month].length; i++)
		{
			you = stats[month][i][0];
			her = stats[month][i][1];
			ratio = Math.floor(you/her*100)/100;
			if(isNaN(ratio) || !isFinite(ratio))
			{
				ratio = 0;
			}
			console.log(ljust(i,2)+": "+ljust(you+her, 10)+"   you: "+ljust(you,5)+"  him/her: "+ljust(her,5)+"  ratio: "+ratio);
		}
	});
	//console.log(j);
	rl.close();
}
