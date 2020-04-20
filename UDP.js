const dgram = require('dgram');
const server = dgram.createSocket('udp4');

server.on('error', (err) => {
  console.log(`server error:\n${err.stack}`);
  server.close();
});

server.on('message', (msg, rinfo) => {
  //console.log(`server got: ${msg} from ${rinfo.address}:${rinfo.port}`);
  console.log('message:')
  for (let i = 0; i < 6; i++) {
    console.log(msg.readDoubleLE(i*8))
    console.log('\n')
  }
});

server.on('listening', () => {
  const address = server.address();
  console.log(`server listening ${address.address}:${address.port}`);
});

server.bind({
  address: '192.168.0.10',
  port: 4243
});
