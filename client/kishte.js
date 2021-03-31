const SerialPort = require("serialport")
const Readline = require("@serialport/parser-readline")
const midi = require("easymidi")

//setup a bluetooth connection to KISTHE
let port = new SerialPort('COM5', {
  baudRate: 115200
})

//send data to the KISTHE, (re-)initiating a connection
function ping(){
    port.write('start', function(err) {
        if (err) {
            console.log('Error on write: ', err.message);
            RISEFROMTHEDEAD();
        }
    })
}

//SPAWN A ZOMBIE PROCESS - THIS PROCESS WILL DIE AND RISE AGAIN AS MANY TIMES AS IT TAKES FOR BT TO RECONNECT
    // T O  V A L H A L L A !!!!!!
function RISEFROMTHEDEAD(){
    setTimeout(function () {
        process.on("exit", function () {
            require("child_process").spawn(process.argv.shift(), process.argv, {
                cwd: process.cwd(),
                detached : true,
                stdio: "inherit"
            });
        });
        process.exit();
    }, 1000);
}

//ping at the start and in regular intervals to ensure reconnection if disconnected
ping(true)
setInterval(ping, 500)


port.on('error', function(err) {
  console.log('Error: ', err.message)
})

//pipe incoming data to a handler function
const parser = port.pipe(new Readline({ delimiter: '\r\n' }))
parser.on('data', handler)

//emit midi signals to internal midi cable based on data piped in
var output = new midi.Output('LoopBe Internal MIDI 1');

function handler(data){
    console.log(data.split("-"))
    output.send('cc', {
      controller : data.split("-")[1],
      value: data.split("-")[2],
      channel: 0
    });
}
