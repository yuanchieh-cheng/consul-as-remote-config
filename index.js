const express = require('express');
const app = express();

const staticConfig = require('./config');

app.get('/static-config', (req, res) => {
    return res.json({
        result: staticConfig.hello
    })
})

let remoteConfig = {};
function fromCallback(fn) {
  return new Promise(function(resolve, reject) {
    try {
      return fn(function(err, data, res) {
        if (err) {
          err.res = res;
          return reject(err);
        }
        return resolve([data, res]);
      });
    } catch (err) {
      return reject(err);
    }
  });
}
 
const consul = require('consul')({ promisify: fromCallback });
app.get('/remote-config', (req, res) => {
    return res.json({
        result: remoteConfig.hello
    })
})

var watch = consul.watch({
  method: consul.kv.get,
  options: { key: 'api-server' },
  backoffFactor: 1000,
});
 
watch.on('change', function(data, res) {
    console.log('data:', data);
    remoteConfig = JSON.parse(data.Value)
});

app.listen('3001', async ()=>{
    const result = await consul.kv.get('api-server')
    console.log(result[0]);
    remoteConfig = JSON.parse(result[0].Value)
})