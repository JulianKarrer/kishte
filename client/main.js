const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const SerialPort = require("serialport")
const Readline = require("@serialport/parser-readline")
const midi = require("easymidi")

let win;
function createWindow () {
    win = new BrowserWindow({
        width: 725,
        height: 510,
        frame: false,
        icon:"./resources/icon.png",
        title: "KISTHE",
        show: false,
        webPreferences: {
            // devTools: false,
            plugins: true,
            nodeIntegration: true,
            contextIsolation: false,
            backgroundThrottling: false,
        }
    })
    win.loadFile('index.html')
    win.once('ready-to-show', () => {
        win.show()
    })
}



const { powerSaveBlocker } = require('electron')
powerSaveBlocker.start('prevent-app-suspension');
app.commandLine.appendSwitch('disable-renderer-backgrounding');

app.whenReady().then(() => {
    powerSaveBlocker.start('prevent-app-suspension');
    createWindow()

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow()
        }
    })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

//connection status
let CONNECTION = {};
function setConnection(change, p=portname, reset=false){
    if(reset){
        CONNECTION = {}
    }
    CONNECTION[p] = change;

}
ipcMain.on('getConnection', (event, arg) => {
    event.sender.send('getConnection_reply', CONNECTION[portname] || "disconnected");
})


//handle connection request
ipcMain.handle('connect', (event, ...args) => {
    connect().catch(e => console.log(err));
})

//manage currently selected serial port
let portname = "COM5";
ipcMain.on('getPorts', (event, arg) => {
    SerialPort.list().then(function (data) {
        let reply = []
        for (var entry of data) {
            reply.push(entry.path)
        }
        event.sender.send('getPorts_reply', reply)
    })
})

let port = null;

ipcMain.handle('setPort', (event, arg) => {
    if(portname != arg){
        try {
            port.close().then(()=>{portname = arg;})
        } catch (e) {} finally {
            portname = arg;
        }
    }
})

//connect to serial port
async function connect(){
    let tryport = portname;
    setConnection("connecting", tryport, true);
    try {
        uiLog("Trying to connect on port " + tryport)
        port = await new SerialPort(portname, {baudRate: 115200})
        port.on('error', function(err) {
          uiLog("ERROR " + tryport)
          setConnection("disconnected",tryport)
        })
        parser = await port.pipe(new Readline({ delimiter: '\r\n' }))
        parser.on('data', handler)
    } catch (e) {
        uiLog("ERROR STARTING " + tryport)
        setConnection("disconnected",tryport)
    }
}

//write waveform to the serial port
const NEW_DATA_FLAG = new Uint8Array([200]);
ipcMain.handle('writeData', (event, arg) => {
    if(port != null){
        writeToPort(NEW_DATA_FLAG) //send flag byte
        writeToPort(preProcessWaveform(arg)) //write 240 bytes of data for 240 pixels
    }
})

function normalizeVal(val, min, max){
    return (val-min)/(max-min)
}


function preProcessWaveform(data){
    data = data.slice(0,240);
    const max = Math.max.apply(null, data);
    const min = Math.min.apply(null, data);
    return data.map(num => Math.round(normalizeVal(num, min, max) * 135 * .6 ));
}

function writeToPort(data){
    if(port != null){
        try {
            port.write(data, function(err) {
                if (err) {
                    uiLog("FAILED TO WRITE " + portname)
                    setConnection("disconnected",portname)
                }
            })
        } catch (e) {console.log(e)}
    }
}

//manage colour slider
const SET_COLOUR_FLAG = new Uint8Array([201]);
function hslToHex(h, s, l) {
  l /= 100;
  const a = s * Math.min(l, 1 - l) / 100;
  const f = n => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

function rgb24ToRgb16(input) {
    let rgb24 = parseInt(input.replace(/^#/, ''), 16);
    let r = (rgb24 & 0xFF0000) >> 16;
    let g = (rgb24 & 0xFF00) >> 8;
    let b = rgb24 & 0xFF;

    r = (r * 249 + 1014) >> 11;
    g = (g * 253 + 505) >> 10;
    b = (b * 249 + 1014) >> 11;
    let rgb16 = 0;
    rgb16 = rgb16 | (r << 11);
    rgb16 = rgb16 | (g << 5);
    rgb16 = rgb16 | b;

    return new Uint8Array(rgb16.toString(16).match(/(..?)/g).map(b => parseInt(b,16)));
}

ipcMain.on('setColour', (event, arg) => {
    let reply = arg=="0" ? "#ffffff" : hslToHex(parseInt(arg), 80, 60);
    writeToPort(SET_COLOUR_FLAG);
    writeToPort(rgb24ToRgb16(reply));
    event.sender.send('setColour_reply', reply)
})

//manage draw style selector
const SET_DRAWSTYLE_LINE = new Uint8Array([202]);
const SET_DRAWSTYLE_CENTRE = new Uint8Array([203]);
const SET_DRAWSTYLE_BAR = new Uint8Array([204]);
ipcMain.handle('setDrawStyle', (event, arg) => {
    switch (arg) {
        case "line":
            writeToPort(SET_DRAWSTYLE_LINE);
            break;
        case "centred":
            writeToPort(SET_DRAWSTYLE_CENTRE);
            break;
        case "bar":
            writeToPort(SET_DRAWSTYLE_BAR);
            break;
    }
})

//manage available midi outputs
const midiout = new midi.Output("LoopBe Internal MIDI 1");

ipcMain.on('getMidiOuts', (event, arg) => {
    event.sender.send('getMidiOuts_reply', [...midi.getOutputs()].reverse()) //non-destrucitve
})

ipcMain.handle('setMidi', (event, arg) => {
    if(midiout.name != arg){
        try {
            midiout = new midi.Output(arg);
        } catch (e) {}
    }
})

//handle incoming data and pipe to midi
function handler(data){
    setConnection("connected")
    uiLog(data)
    midiout.send('cc', {
      controller : data.split("-")[1],
      value: data.split("-")[2],
      channel: 0
    });
}

//handle custom log
let newLog = [];
function uiLog(text){
    newLog.push(text)
}
ipcMain.on('retrieveLog', (event, arg) => {
    event.sender.send('retrieveLog_reply', newLog)
    newLog = [];
})


// custom UI bar
ipcMain.on('app:quit', () => { app.quit() })
ipcMain.on('app:minimize', () => { win.minimize() })
