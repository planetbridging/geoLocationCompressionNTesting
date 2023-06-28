//geo city locations = GeoLite2-City-Locations-en.csv
/*geoname_id	locale_code	continent_code	continent_name	country_iso_code	country_name	subdivision_1_iso_code	subdivision_1_name	subdivision_2_iso_code	subdivision_2_name	city_name	metro_code	time_zone	is_in_european_union
1392	en	AS	Asia	IR	Iran	2	Māzandarān			Shahr		Asia/Tehran	0
7240	en	AS	Asia	IR	Iran	28	North Khorasan			Jahan		Asia/Tehran	0
*/

//geo locaiton ip = GeoLite2-City-Blocks-IPv4.csv
/*
network	geoname_id	registered_country_geoname_id	represented_country_geoname_id	is_anonymous_proxy	is_satellite_provider	postal_code	latitude	longitude	accuracy_radius
1.0.0.0/24	2157065	2077456		0	0	3825	-38.0248	146.371	1000
1.0.1.0/24	1814991	1814991		0	0		34.7732	113.722	1000
*/
//ok

const fs = require("fs");
const csv = require("csv-parser");
const md5 = require("md5");
const createCsvWriter = require("csv-writer").createObjectCsvWriter;
var geoip = require("geoip-lite");

const objIpBinary = require("./objIpBinary");

var oIpBin = new objIpBinary();
var geoMap = new Map();

(async () => {
  console.log("Welcome to Geo location compression and testing");
  logMemoryUsage();

  var ip = "172.105.189.15";
  var geo = geoip.lookup(ip);

  console.log(geo);
  logMemoryUsage();
  //created geoCompress.json
  //var geoLocationIp = await readCSVtoArray("GeoLite2-City-Blocks-IPv4.csv");
  //processGeoIpv4(geoLocationIp);
  geoLocationCompressJsonLoad();
  await createGeoCityIdMap();
  logMemoryUsage();

  console.log(oIpBin.contains("192.0.2.50"));
  console.log(oIpBin.contains("172.105.189.15"));

  const start = process.hrtime();
  var ipTest = oIpBin.contains("172.105.189.15");

  if (ipTest != null) {
    if (geoMap.has(ipTest["data"])) {
      console.log(geoMap.get(ipTest["data"]));
    }
  }

  const diff = process.hrtime(start);
  const elapsed = diff[0] * 1000 + diff[1] / 1e6; // Time in milliseconds

  console.log(`Elapsed time: ${elapsed} ms`);

  // Wait for 10 seconds
  //await delay(10000);
  /*
oIpBin.insert('192.0.2.0/24', { name: 'Range 1', data: 'Some data' });
oIpBin.insert('203.0.113.0/24', { name: 'Range 2', data: 'Some other data' });
console.log(oIpBin.contains('192.0.2.50'));  // { range: '192.0.2.0/24', data: { name: 'Range 1', data: 'Some data' } }
console.log(oIpBin.contains('203.0.113.50'));  // { range: '203.0.113.0/24', data: { name: 'Range 2', data: 'Some other data' } }
console.log(oIpBin.contains('198.51.100.50'));*/
})();

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function logMemoryUsage() {
  const usage = process.memoryUsage();
  const rss = Math.round((usage.rss / 1024 / 1024) * 100) / 100;
  const heapTotal = Math.round((usage.heapTotal / 1024 / 1024) * 100) / 100;
  const heapUsed = Math.round((usage.heapUsed / 1024 / 1024) * 100) / 100;
  const external = Math.round((usage.external / 1024 / 1024) * 100) / 100;

  console.log(
    `Memory usage: rss ${rss}MB, heapTotal ${heapTotal}MB, heapUsed ${heapUsed}MB, external ${external}MB`
  );
}

async function createGeoCityIdMap() {
  var geocityIds = await readCSVtoArray("GeoLite2-City-Locations-en.csv");

  for (var c in geocityIds) {
    //console.log(geocityIds[c]);
    if (geoMap.has(geocityIds[c]["geoname_id"])) {
      console.log("found dup");
    }
    geoMap.set(geocityIds[c]["geoname_id"], geocityIds[c]);
  }
}

function geoLocationCompressJsonLoad() {
  var geoIpCompress = jsonFileToMap("geoCompress.json");
  //console.log(geoIpCompress);

  //load into ipBin testing
  for (let [key, value] of geoIpCompress) {
    for (var i in value) {
      oIpBin.insert(value[i], key);
    }
  }
}

function jsonFileToMap(filePath) {
  // Read the file
  const json = fs.readFileSync(filePath, "utf8");

  // Parse the JSON content
  const obj = JSON.parse(json);

  // Convert the object to a Map
  const map = new Map(Object.entries(obj));

  return map;
}

function readCSVtoArray(filePath) {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (data) => results.push(data))
      .on("end", () => resolve(results))
      .on("error", (error) => reject(error));
  });
}

function saveAsCsv(data, path) {
  // Get the headers from the keys of the first object in the data
  const headers = Object.keys(data[0]).map((key) => ({ id: key, title: key }));

  const csvWriter = createCsvWriter({
    path: path,
    header: headers,
  });

  csvWriter
    .writeRecords(data)
    .then(() => console.log("The CSV file was written successfully"))
    .catch((err) => console.error("Error writing CSV file:", err));
}

function jsonToMd5(json) {
  const string = JSON.stringify(json);
  const hash = md5(string);
  return hash;
}

function mapToJsonFile(map, filePath) {
  // Convert the Map to an object
  const obj = Object.fromEntries(map);

  // Convert the object to a JSON string
  const json = JSON.stringify(obj, null, 2); // 2nd argument null means we're not replacing any values, 3rd argument means we're using 2 spaces for indentation

  // Write the JSON string to a file
  fs.writeFile(filePath, json, (err) => {
    if (err) {
      console.error("Error writing file:", err);
    } else {
      console.log("File written successfully");
    }
  });
}

function processGeoIpv4Attempt1(lst) {
  var uniqLidsTestingLatitude = new Map();
  console.log("city ip current length:", lst.length);
  for (var c1 in lst) {
    //console.log(lst[c1]);
    var tmpKey =
      lst[c1]["latitude"] +
      "," +
      lst[c1]["longitude"] +
      "," +
      lst[c1]["postal_code"];
    var tmpValue = {
      network: lst[c1]["network"],
      geoname_id: lst[c1]["geoname_id"],
    };

    if (uniqLidsTestingLatitude.has(tmpKey)) {
      var tmpLstGeo = uniqLidsTestingLatitude.get(tmpKey);
      tmpLstGeo.push(tmpValue);
      uniqLidsTestingLatitude.set(tmpKey, tmpLstGeo);
    } else {
      uniqLidsTestingLatitude.set(tmpKey, [tmpValue]);
    }
  }

  console.log("long/lat possible size:", uniqLidsTestingLatitude.size);
  mapToJsonFile(uniqLidsTestingLatitude, "geoCompress.json");
  /*
  city ip current length:  3,763,331
    long/lat possible size: 146,835
    down to 3.901729611%
  */

  /*
    csv data example
    const data = [
  { name: 'John Doe', age: 30, email: 'john@example.com' },
  { name: 'Jane Doe', age: 25, email: 'jane@example.com' },
  // More data...
];

    example of csv but need to do json
    need to save two files
    lstIpRangeCsv   1: item example {ipRange:ipRange,geoname_id,geoLongLatMd5Id}
    lstGeoMd5       2: item example {geoLongLatMd5Id,latitude,longitude,postal_code}

*/

  /*var lstIpRangeCsv = [];
  var lstGeoMd5 = [];
  var processCount = 0;
  var totalSize = uniqLidsTestingLatitude.size;
  for (let [key, value] of uniqLidsTestingLatitude) {
    //console.log(`Key: ${key}, Value: ${value}`);
    console.log("processCount: " + processCount, "/" + totalSize);

    var tmpSplit = key.split(",");
    var tmpLat = tmpSplit[0];
    var tmpLon = tmpSplit[1];
    var tmpPost = tmpSplit[2];

    for (var tVal in value) {
      //console.log(value[tVal]);
      var tmpMd5id = jsonToMd5(value[tVal]);

      lstGeoMd5.push({
        geoLongLatMd5Id: tmpMd5id,
        latitude: tmpLat,
        longitude: tmpLon,
        postal_code: tmpPost,
      });

      lstIpRangeCsv.push({
        ipRange: value[tVal]["network"],
        geoname_id: value[tVal]["geoname_id"],
        geoLongLatMd5Id: tmpMd5id,
      });
    }

    //break;

    processCount += 1;
  }

  saveAsCsv(lstIpRangeCsv, "lstIpRange.csv");
  saveAsCsv(lstGeoMd5, "lstGeoMd5.csv");*/
}

function processGeoIpv4(lst) {
  var uniqLidsTestingLatitude = new Map();
  console.log("city ip current length:", lst.length);
  for (var c1 in lst) {
    if (uniqLidsTestingLatitude.has(lst[c1]["geoname_id"])) {
      var tmpLstGeo = uniqLidsTestingLatitude.get(lst[c1]["geoname_id"]);
      tmpLstGeo.push(lst[c1]["network"]);
      uniqLidsTestingLatitude.set(lst[c1]["geoname_id"], tmpLstGeo);
    } else {
      uniqLidsTestingLatitude.set(lst[c1]["geoname_id"], [lst[c1]["network"]]);
    }
  }

  console.log("long/lat possible size:", uniqLidsTestingLatitude.size);
  mapToJsonFile(uniqLidsTestingLatitude, "geoCompress.json");

  /* notes

  234.9mb to 89.6mb = 38.143891017% of original size

  */
}
