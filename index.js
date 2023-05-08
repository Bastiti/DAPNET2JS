// Import net module.
const net = require('net');

// Import config.json file.
const config = require('./config.json');

// Create a net socket object.
const socket = new net.Socket();

// Connect to server.

let TXTimeSlot = [];
let messages = [];

// Make a async loop for timeslot in a new Thread
function getTimeSlot() {
    t = Math.floor(Date.now() / 100);
    slot = (t >> 6) & 0b1111;
    // Encode slot to hex
    slot = slot.toString(16);
    // If it's a letter put it in caps
    slot = slot.toUpperCase();
    return slot;
}
async function timeslotLoop() {
    while (true)
    {
        // delay 1 second
        await new Promise(resolve => setTimeout(resolve, 300));

        // If GetTimeSlot() is equal to one of TXTimeSlot, send a message
        if (TXTimeSlot.includes(getTimeSlot())) {
            // Check if there is a message to send
            if (messages.length > 0) {
                // Send message
                let message = messages.shift();
                console.log(`Sending message: ${message[4]} to ${message[2]}`);
            }
        }
    }
}
timeslotLoop()

socket.connect(config.DAPNETport, config.DAPNEThost, function() {
    console.log(`Connected to ${config.DAPNEThost}:${config.DAPNETport}`);
    // We need to send a string like this: [APPName vAPPVersion EMITTERCall EMITTERAuth]\r\n to the server. We use \r\n to tell the server that we are done.
    // So we create a string with the data from config.json
    let authString = `[${config.APPName} v${config.APPVersion} ${config.EMITTERCall} ${config.EMITTERAuth}]\r\n`;
    // And send it to the server.
    socket.write(authString);
});

// When receive data, process it like descibed in the DAPNET WIKI.
socket.on('data', async function(data) {
    // We should receive a message like: 2:6116 where 6116 is the server time hex encoded. We need to answer with 2:6116:0000
    // For this, we'll check what's the first character of the received data.
    if (data.toString().charAt(0) == '2') {
        // We will remove the last character of the received data, because it's a \n
        let answer = data.toString().slice(0, -1);
        socket.write(answer+':0000\r\n'); // And send it to the server.
        // we also need to send a "+"
        socket.write('+\r\n');
    } // This action will be repeated 4 times at each connection to the server.
    // Now, we need to process the received data when it starts with a 3.
    if (data.toString().charAt(0) == '3') { // This data tells us how to set our clock. We mostly use NTP, so we don't need to do anything here.
        // We will remove the last character of the received data, because it's a \n
        let answer = data.toString().slice(0, -1);
        socket.write('+\r\n');
        // We just need to send a "+"
    }
    // Now, we need to process the received data when it starts with a 4.
    if (data.toString().charAt(0) == '4') { // This data tells us our timeslot
        // We will remove the last character of the received data, because it's a \n
        let answer = data.toString().slice(0, -1).split(':'); // We split the data at the ":" to get the timeslot
        let timeslot = answer[1].split(''); // We get the
        TXTimeSlot = timeslot;
        console.log(`Timeslot aquired: ${timeslot.join(' ')}`);
        socket.write('+\r\n');
        // We just need to send a "+" again
    }
    // Now we will process incoming messages.
    // We have to check if the first character is a #, because this is a message.
    if (data.toString().charAt(0) == '#') {
        // We will remove the first and last character of the received data, because it's a # and a \n
        let answer = data.toString().slice(1, -1).split(' '); // We split the data at the ":" to get the data
        if (answer.length > 2) {
            for (let i = 2; i < answer.length; i++) {
                answer[1] = answer[1] + ' ' + answer[i];
            }
        }
        // answer[0] is the message number, answer[1] is the data
        let messageStruct = answer[1].split(':'); // We split the data at the ":" to get the data
        // messageStruct[0] is the message type
        // messageStruct[1] is the pocsag speed (1 = 1200)
        // messageStruct[2] is the RIC (callsign of the pager) it is hex encoded
        // messageStruct[3] is the function bits
        // messageStruct[4] is the message
        // Add messageStruct[5] to messageStruct[4] if it exists, same for messageStruct[6] etc.
        if (messageStruct.length > 5) {
            for (let i = 5; i < messageStruct.length; i++) {
                messageStruct[4] = messageStruct[4] + ':' + messageStruct[i];
            }
        }

        // Now we need to decode the RIC
        messageStruct[2] = parseInt(messageStruct[2], 16);
        console.log(`Message received: ${messageStruct[4]} to ${messageStruct[2]}`);
        messages.push(messageStruct);
        // We send back #messageNumber to the server to tell it that we received the message.
        socket.write(`#${answer[0]} +\r\n`);
    }
});