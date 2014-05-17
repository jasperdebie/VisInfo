fs = require "fs"

file = fs.readFileSync "realufos.json","utf8"
file = JSON.parse file

fs.writeFileSync "ufos.json", JSON.stringify(file, null, 2)