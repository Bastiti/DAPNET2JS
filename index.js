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
let timeslot = [];
let messagetoSend = [];
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
        timeslot = dataString;
        client.write('+' + '\r\n');
    }
    // remove the first # and the last "character"
    if (data.toString().startsWith('#'))
    {
        let dataString = data.toString().slice(1, -1).split(' '); // dataString[0] = number of message, dataString[1] = data
        let struct = dataString[1].split(':');
        // datastring[0] = number of message
        // Send back #datastring[0] +
        // struct[0] = message type
        // struct[1] = POCSAG SPEED (1200 or 2400) 1 is 1200 and 2 is 2400
        // struct[2] = RIC (Recipient Identity Code) in HEX, we need to convert it to decimal
        // struct[3] = Function bits
        // struct[4] = Message

        // Convert struct[2] to decimal
        struct[2] = parseInt(struct[2], 16);

        client.write('#' + dataString[0] + ' +' + '\r\n'); // Send back the message number
        messagetoSend.push(struct);
    }

});