fs = require "fs"

file = fs.readFileSync "meteorites.json","utf8"
file = JSON.parse file

features = file.features
threshold = 1950
max_threshold = 2014

for k, v of features
  year = parseInt(v.properties.year)
  if not(year >= threshold) or year > 2014
    delete features[k]
  if v.geometry.coordinates is undefined
    delete features[k]


features = features.filter (e)-> e

max = Number.MIN_VALUE
min = Number.MAX_VALUE
for k, v of features
  year = parseInt(v.properties.year)
  if year < min
    min = year
  if year > max
    max = year

amounts = {}
for i in [min..max]
  amounts[i] = 0

console.log min
console.log max

for k, v of features
  year = parseInt(v.properties.year)
  amounts[year] = amounts[year] + 1

console.log amounts

results = []
for k in [min..max]
  v = amounts[k]
  results.push({"year": k, "amount": v})


file.features = features


file = JSON.stringify(file, null, 2)
fs.writeFileSync "new_meteorites.json", file

fs.writeFileSync "meteoritesbrush.json", JSON.stringify(results, null, 2)