// Create a net tcp client
const net = require('net');

// Mettons les infos du serveur DAPNET dans des variables
const dapnetHost = 'db0dbn.ig-funk-siebengebirge.de';
const dapnetPort = 43434;
// Mettons les infos de l'émetteur dans des variables
const emitterCallsign = 'on4bcy2';
const emitterAUTH = 'x9gqcu89IrItzP0MgaA8';
// Mettons le nom de notre projet et la version dans des variables
const appName = 'esp32';
const appVersion = 'v0.1';

let string = `[${appName} ${appVersion} ${emitterCallsign} ${emitterAUTH}]\r\n`;
let array = [];
const client = new net.Socket();

// When data is 2:C580 make it 2:C580:0000


client.connect(dapnetPort, dapnetHost, function() {
    console.log("Connected");
    client.write(string);
    console.log('Sent: ' + string);

});

client.on('data', function(data) {
    console.log('Received: ' + data);
    if (data.toString().startsWith('2')) {
        // Remove data last character
        let dataString = data.toString().slice(0, -1)+':0000';
        client.write(dataString + '\r\n');
        // Envoie + au serveur
        client.write('+' + '\r\n');
    }
    if (data.toString().startsWith('3'))
    {
        client.write('+' + '\r\n');
    }
    if (data.toString().startsWith('4'))
    {
        // Delete the first two characters and the last one
        let dataString = data.toString().slice(2, -1).split('');
        array = dataString;
        client.write('+' + '\r\n');
    }
    // remove the first # and the first space and the last one
    if (data.toString().startsWith('#'))
    {
        let dataString = data.toString().slice(1, -1).split(' ');
        let struct = dataString[1].split(':');
        // datastring[0] = number of message
        // Send back #datastring[0] +
        client.write('#' + dataString[0] + ' +' + '\r\n');
        console.log(struct);
    }

});