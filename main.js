// Coucou
// Path: main.js
// On va faire un test, le but est d'envoyer un message via TCP vers un serveur DAPNET
// DAPNET est un réseau de radioamateurs qui permet d'envoyer des messages vers des récepteurs

// On va utiliser le module net pour faire du TCP
const net = require('net');
const {execSync} = require('child_process');

// Mettons les infos du serveur DAPNET dans des variables
const dapnetHost = 'db0dbn.ig-funk-siebengebirge.de';
const dapnetPort = 43434;
// Mettons les infos de l'émetteur dans des variables
const emitterCallsign = 'on4bcy-2';
const emitterAUTH = 'x9gqcu89IrItzP0MgaA8';
// Mettons le nom de notre projet et la version dans des variables
const appName = 'esp32';
const appVersion = '001';
// Protocol DAPNET:
let string = `[PyPager-Audio v0.1 on4bcy1 k9a7PM7bGWFA0PtIVgjc]\r\n`;
// string vers buffer
let buffer = Buffer.from(string);

// On va créer un client TCP
const client = new net.Socket();
// On va se connecter au serveur DAPNET
client.connect(dapnetPort, dapnetHost, function() {
    console.log('Connected');
    // On va envoyer le buffer
    // mettre un delay de 5 secondes

    const date = Date.now();
    let currentDate = null;
    client.write(string);
    do {
        currentDate = Date.now();
    } while (currentDate - date < 2000);
    client.write(string);
    client.write(string);
    client.write(string);
    client.write(string);
    console.log('Sent: ' + string);
    // On attends la réponse du serveur
    client.on('data', function(data) {
        console.log('Received: ' + data);
        // On ferme la connexion
        client.destroy();
    });
    // On gère les erreurs
    client.on('error', function(err) {
        console.log(err);
    });
    // On ferme la connexion
    client.on('close', function() {
        console.log('Connection closed');
    });
})