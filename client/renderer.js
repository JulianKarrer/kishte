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
    document.getElementById("drawStyleSelect").addEventListener("change", (e)=> {
        ipcRenderer.invoke('setDrawStyle', document.getElementById("drawStyleSelect").value)
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

function updatePortSelector(selector, reply, setCmd){
    //get current options
    let currentOptions = [];
    for (var option of selector.options) {
        currentOptions.push(option.innerText)
    }

    //loop through currently available ports, add missing options
    let currentPorts = []
    for (var port of reply) {
        currentPorts.push(port)
        if(!currentOptions.includes(port)){
            var option = document.createElement("option");
            option.text = port;
            selector.add(option);
        }
    }
    //loop through options again, removing unavailable ports
    for (var i=0; i<selector.length; i++) {
        if (!currentPorts.includes(selector.options[i].value)){
            selector.remove(i);
        }
    }

    ipcRenderer.invoke(setCmd, selector.value)
}

ipcRenderer.on('getPorts_reply', (event, reply) => {
    updatePortSelector( document.getElementById("serialSelect"), reply, "setPort");
})

    //MIDI SETTINGS
ipcRenderer.on('getMidiOuts_reply', (event, reply) => {
    updatePortSelector( document.getElementById("midiSelect"), reply, "setMidi");
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
            startDrawing(stream)
        } catch (e) {console.log}
        }
      }
    })

    //setup the audio analyser node the desktop audio capture is piped into
    var audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    var analyser = audioCtx.createAnalyser();
    analyser.fftSize = 512;
    var fftSize = analyser.frequencyBinCount;

    var dataArray = new Uint8Array(fftSize);
    var fftArray = new Uint8Array(fftSize);


    function startDrawing (stream) {
        //pipe captured audio into the analyser and start drawing
        var source = new MediaStreamAudioSourceNode(audioCtx, {mediaStream:stream});
        source.connect(analyser);
        requestAnimationFrame(draw);
        setInterval(()=>{ipcRenderer.invoke('writeData', toDraw);}, 40) //send drawBuffer to KISHTE every 40ms
    }

    //prepare envelope follower using the normalozed average of the array for each frame
    var rawEnvelopeArray = new Uint8Array(fftSize);    //fft Array => loudness graph
    var envelopeArray = new Uint8Array(fftSize);

    var rawWaveFollower = new Uint8Array(fftSize);    //data array => wave follower
    var waveFollower = new Uint8Array(fftSize);
    function updateEnvelope(inArray, rawArray, outArray){
        //shift the buffer
        for (var i = 0; i < fftSize-1; i++) {
            rawArray[i] = rawArray[i+1]
        }
        //add new average to buffer
        rawArray[fftSize-1] = Math.floor(inArray.reduce((a,b) => a + b, 0) / fftSize);
        //normalize the envelope from the raw average values
        outArray = rawArray.map(num => Math.floor(num / Math.max(...rawArray) * 255))
        return [inArray, rawArray, outArray]
    }

    //visualization
    const canvas = document.getElementById("waveform");
    const canvasCtx = canvas.getContext("2d");
    const selector = document.getElementById("visualizerSelect");
    let toDraw;
    function draw(){
        analyser.getByteTimeDomainData(dataArray);
        analyser.getByteFrequencyData(fftArray);
        [dataArray, rawWaveFollower, waveFollower] = updateEnvelope(dataArray, rawWaveFollower, waveFollower);
        [fftArray, rawEnvelopeArray, envelopeArray] = updateEnvelope(fftArray, rawEnvelopeArray, envelopeArray);

        //decide what to draw
        switch(selector.value) {
            case "waveform":
                toDraw = dataArray;
                break;
            case "fourier":
                toDraw = fftArray;
                break;
            case "level":
                toDraw = envelopeArray;
                break;
            case "wavefollower":
                toDraw = waveFollower;
                break;
        }



        canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
        canvasCtx.lineWidth = 2;
        canvasCtx.strokeStyle = 'rgb(0, 0, 0)';

        canvasCtx.beginPath();

        const sliceWidth = canvas.width * 1.0 / fftSize;
        var x = 0;
        for(var i = 0; i < fftSize; i++) {
               var v = toDraw[i] / 128.0;
               var y = v * (canvas.height)/2;
               y = canvas.height - y;
               if(i === 0) {canvasCtx.moveTo(x, (canvas.height)/2);}
               else {canvasCtx.lineTo(x, y);}
               x += sliceWidth;
         }
         canvasCtx.lineTo(canvas.width, canvas.height/2);
         canvasCtx.stroke();

        requestAnimationFrame(draw);
    }
}
