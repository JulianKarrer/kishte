const { ipcRenderer } = require('electron');

document.getElementById("gobutton").addEventListener("click", ()=> {
    ipcRenderer.invoke('connect', "go");
})

window.addEventListener("DOMContentLoaded", ()=>{
    //setup all ipc callbacks polling the main function
    ipcRenderer.send('getPorts');
    ipcRenderer.send('getMidiOuts');

    setInterval(()=>{ipcRenderer.send('getPorts');}, 500);
    setInterval(()=>{ipcRenderer.send('getMidiOuts');}, 500);
    setInterval(()=>{ipcRenderer.send('getConnection');}, 100);
    setInterval(()=>{ipcRenderer.send('retrieveLog');}, 50);

    //eventlisteners for UI interactions
    document.getElementById("serialSelect").addEventListener("change", (e)=> {
        ipcRenderer.invoke('setPort', document.getElementById("serialSelect").value)
    })
    document.getElementById("colourSlider").addEventListener("input", (e)=> {
        ipcRenderer.send('setColour', document.getElementById("colourSlider").value)
    })
    document.getElementById("quit").addEventListener("click", (e)=>{
        ipcRenderer.send('app:quit')
    })
    document.getElementById("minimize").addEventListener("click", (e)=>{
        ipcRenderer.send('app:minimize')
    })

    //start services pushing data to UI / MIDI Controller
    startAudioCapture();
})

    //PORT SETTINGS

ipcRenderer.on('getPorts_reply', (event, reply) => {
    const selector = document.getElementById("serialSelect")
    //get current options
    let currentOptions = [];
    for (var option of selector.options) {
        currentOptions.push(option.innerText)
    }

    for (var port of reply) {
        var option = document.createElement("option");
        option.text = port.path;
        if(!currentOptions.includes(port.path)){
            selector.add(option);
        }
    }
    ipcRenderer.invoke('setPort', selector.value)
})

    //MIDI SETTINGS
ipcRenderer.on('getMidiOuts_reply', (event, reply) => {
    const selector = document.getElementById("midiSelect")
    //get current options
    let currentOptions = [];
    for (var option of document.getElementById("midiSelect").options) {
        currentOptions.push(option.innerText)
    }

    for (var port of reply) {
        var option = document.createElement("option");
        option.text = port;
        if(!currentOptions.includes(port)){
            selector.add(option);
        }
    }
    ipcRenderer.invoke('setMidi', document.getElementById("midiSelect").value)
})

    //CONNECTION STATUS

const connectionColours = {
    "disconnected":"red",
    "connecting":"yellow",
    "connected":"green",
}
ipcRenderer.on('getConnection_reply', (event, reply) => {
    document.getElementById("connectionIndicator").style.background = connectionColours[reply];
})

    //COLOUR SLIDER
ipcRenderer.on('setColour_reply', (event, reply) => {
    Array.from(document.styleSheets[0].cssRules).filter(
        rule => rule.cssText.includes("#colourSlider::-webkit-slider-thumb")
    )[0].style.background = reply;
})

    //LOG
ipcRenderer.on('retrieveLog_reply', (event, reply) => {
    for (var line of reply) {
        document.getElementById("log").appendChild(document.createTextNode(line));
        document.getElementById("log").appendChild(document.createElement("br"));
    }
})

    //CAPTURE AUDIO
async function startAudioCapture(){
    const { desktopCapturer } = require('electron')
    desktopCapturer.getSources({ types: ['window', 'screen'] }).then(async sources => {
      for (const source of sources) {
        if (source.name === 'Entire Screen') {
          try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    mandatory: {
                        chromeMediaSource: 'desktop'
                    }
                },
                video: {
                  mandatory: {
                    chromeMediaSource: 'desktop',
                    maxWidth: 1,
                    maxHeight: 1,
                  }
                }
            })
            handleStream(stream)
        } catch (e) {console.log}
        }
      }
    })

    //setup the audio analyser node the desktop audio capture is piped into
    var audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    var analyser = audioCtx.createAnalyser();
    analyser.fftSize = 512;
    var bufferLength = analyser.frequencyBinCount;
    var dataArray = new Uint8Array(bufferLength);

    function handleStream (stream) {
        //pipe captured audio into the analyser and start drawing
        var source = new MediaStreamAudioSourceNode(audioCtx, {mediaStream:stream});
        source.connect(analyser);
        requestAnimationFrame(draw);
    }


    //waveform visualization
    const canvas = document.getElementById("waveform");
    const canvasCtx = canvas.getContext("2d");
    function draw(){
        analyser.getByteTimeDomainData(dataArray);
        ipcRenderer.invoke('writeData', dataArray);
        canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
        canvasCtx.lineWidth = 2;
        canvasCtx.strokeStyle = 'rgb(0, 0, 0)';

        canvasCtx.beginPath();

        const sliceWidth = canvas.width * 1.0 / bufferLength;
        var x = 0;
        for(var i = 0; i < bufferLength; i++) {
               var v = dataArray[i] / 128.0;
               var y = v * (canvas.height)/2;
               if(i === 0) {canvasCtx.moveTo(x, (canvas.height)/2);}
               else {canvasCtx.lineTo(x, y);}
               x += sliceWidth;
         }
         canvasCtx.lineTo(canvas.width, canvas.height/2);
         canvasCtx.stroke();

        requestAnimationFrame(draw);
    }
}
