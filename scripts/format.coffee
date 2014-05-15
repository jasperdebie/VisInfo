fs = require "fs"

file = fs.readFileSync "airports.json","utf8"
file = JSON.parse file

fs.writeFileSync "new_airports.json", JSON.stringify(file, null, 2)