fs = require "fs"

file = fs.readFileSync "ufos.json","utf8"
file = JSON.parse file

features = file.features
threshold = 1950
max_threshold = 2014

isEmpty = (obj)->
  empty = true
  for v of obj
    empty = false
  empty

for k, v of features
  year = v.properties["date sighted"]
  year = parseInt(year.slice(0, 4))
  if not(year >= threshold) or year > 2014
    delete features[k]
  delete features[k] if isEmpty(v.geometry)
  if v.geometry?.coordinates is undefined
    delete features[k]


features = features.filter (e)-> e

max = Number.MIN_VALUE
min = threshold
for k, v of features
  year = v.properties["date sighted"]
  year = parseInt(year.slice(0, 4))
  if year > max
    max = year
  v.properties["year"] = year.toString()

amounts = {}
for i in [min..max]
  amounts[i] = 0

console.log min
console.log max

for k, v of features
  year = parseInt(v.properties["date sighted"].slice(0, 4))
  amounts[year] = amounts[year] + 1

console.log amounts

results = []
for k in [min..max]
  v = amounts[k]
  results.push({"year": k.toString(), "amount": v})


file.features = features


file = JSON.stringify(file, null, 2)
fs.writeFileSync "new_ufos.json", file

fs.writeFileSync "ufobrush.json", JSON.stringify(results, null, 2)