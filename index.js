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

const objIpBinary = require("./objIpBinary");

var oIpBin = new objIpBinary();

(async () => {
  console.log("Welcome to Geo location compression and testing");

  //created geoCompress.json
  //var geoLocationIp = await readCSVtoArray("GeoLite2-City-Blocks-IPv4.csv");
  //processGeoIpv4(geoLocationIp);

  var geocityIds = await readCSVtoArray("GeoLite2-City-Locations-en.csv");
})();

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
