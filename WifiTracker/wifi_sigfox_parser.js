// BIG ENDIAN TO LITTLE ENDIAN
function rev(v) {
  let s = v.replace(/^(.(..)*)$/, '0$1'); // add a leading zero if needed
  let a = s.match(/../g);             // split number in groups of two
  a.reverse();                        // reverse the groups
  let s2 = a.join('');                // join the groups back together
  return s2;
}

// STRING TO FLOAT
function parseF(s) {
  let intData = new Uint32Array(1);
  intData[0] = s;
  let dataAsFloat = new Float32Array(intData.buffer);
  return dataAsFloat[0];
}

// STRING TO MAC ADDRESS
function stringToMac(string) {
  return rev(string).match(/.{1,2}/g).reverse().join(':');
}

let GOOGLE_API_KEY = 'YOUR GOOGLE API KEY';

function main(params, callback){
  var number = '';
  var mac, mac2;
  var result = [

  ];
  if (params.data.length == 24) {
    var checksum = parseInt('0x'+ params.data.substring(0,2));
    var calculatedChecksum = 0;
    for(var i = 1; i < 12; i++) {
      calculatedChecksum ^= parseInt('0x', params.data.substring(i*2, 2*i+2));
    }

    if (checksum === calculatedChecksum) {
      result = [{
        "key": "temperature",
        "value": - 40.0 + parseInt('0x' + params.data.substring(4,6)) / 2.0
      },
        {
          "key": "batteryLevel",
          "value": 3.4 * parseInt('0x' + params.data.substring(2,4)) / 255.0
        },
        {
          "key": "temperatureAlert",
          "value": parseInt('0x' + params.data.substring(6,8))
        },
        {
          "key": "movementStatus",
          "value":parseInt('0x' + params.data.substring(8,10))
        }];

      return callback(null, result);
    }

    else {
      mac = stringToMac(params.data.substring(0, 12));
      mac2 = stringToMac(params.data.substring(12, 24));

      let body = {
        'considerIp': 'false',
        'wifiAccessPoints': [
          {'macAddress': mac},
          {'macAddress': mac2}]
      };

      httpRequest({
        host: 'www.googleapis.com',
        path: '/geolocation/v1/geolocate?key=' + GOOGLE_API_KEY,
        method: 'POST',
        secure: true,
        headers: {'Content-Type': 'application/json'}
      }, body, function (err, res) {
        if (err) return callback(err);

        result = result.concat([
          {
            'key': 'geolocation',
            'value': 'googlewifi',
            'geo': {
              'lat': JSON.parse(res.result).location.lat,
              'long': JSON.parse(res.result).location.lng
            }
          },
          {
            'key': 'googleAccuracy',
            'value': JSON.parse(res.result).accuracy
          },
          {
            'key': '$geo',
            'value': [JSON.parse(res.result).location.lng, JSON.parse(res.result).location.lat]
          }]);
        return callback(null, result);
      });
    }
  }
}
