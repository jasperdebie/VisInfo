fs = require "fs"

file = fs.readFileSync "UfoGeojson_old.json", "utf8"
file = JSON.parse file

threshhold = 1950
for val, key in file.features
  year = val.properties.year
  delete file.features[key] if year < threshhold

file.features = file.features.filter (e)-> e

fs.writeFileSync "newUfoGeojson.json", JSON.stringify(file, null, 2)

