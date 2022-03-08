# KISHTE 
<p align="center">
<img  src="https://user-images.githubusercontent.com/11961803/157150490-a9f107fa-cc3c-4d26-b643-3f46f077706a.png" width="100"  height="100"> 
</p>

An ESP32 with a small LCD display can be used to make a basic, battery powered, wireless MIDI Controller to satisfy your DJ and music production needs.

This project comes with a cross-platform companion app built with Electron that receives the Bluetooth signals sent by the Kishte and converts them into MIDI commands for a virtual MIDI cable (like [LoopBe1](https://www.nerds.de/en/loopbe1.html)) while sending a visualisation of the waveform currently playing on the computer back to the device for display.

<p align="center">
<img  src="https://user-images.githubusercontent.com/11961803/157147009-c12e4772-004e-4625-91bc-713942c69fac.jpg" width="300">  <img  src="https://user-images.githubusercontent.com/11961803/157147006-b1d26468-d879-4f64-a5b6-9fbe14c15875.jpg" width="300"> 
</p>

<p align="center">
<img  src="https://user-images.githubusercontent.com/11961803/157148351-6323e160-5fe5-4966-81b6-229a99e07c02.png" width="500"> 
</p>

## Features

+ 9 Knobs
+ 8 Buttons
+ Wireless and battery powered with 10h+ of runtime
+ Waveform is visualized on the display
+ Cross-platform client to connect with
+ Easy to build
+ Compact and portable design
+ Easily reconfigurable code for differing amounts and arrangements of buttons and knobs

## Why build your own?

Midi Controllers are easy to build and expensive to buy, making them perfect for a DIY project. Any microcontroller one can attach a bunch of knobs and buttons to and somehow connect to a computer can become a MIDI controller. In the most basic case, it doesn't do much more than reading voltages and sending a few bytes when they change. Add some smoothing to the values, a protocol to communicate via Bluetooth and a program to receive the signals with and the project is basically done.

# Building instructions

## Bill of materials

+ TTGO T-Dispay ESP32 with 1.14inch LCD display ([see the repo here](https://github.com/Xinyuan-LilyGO/TTGO-T-Display))
+ 9 potentiometers
	+ These are used as voltage dividers so the resistance doesn't matter much as long as it is not too small, 100k-500k Ohm linear potentiometers were used here. The lower the resistance, the more current will flow across the Potentiometer needlessly, draining the battery and potentially damaging the circuit.
+ 8 tactile push buttons
+ 8 LEDs
	+ any Diodes may be used instead, the LEDs just make it glow nicely in the dark and are unproblematic in terms of current drawn from the ESP32
+ 1 tactile switch for power OFF/ON
+ Rechargable battery packs
	+ 2x 3.7V 650mAh LiPo batteries in parallel were used in this case
+ A bunch of cables
	+ Using the female jumper wires normally used for breadboarding will make it easier to detach, reattach and reconfigure cables to the pins of your microcontroller
+ An enclosure
	+ A random acrylic box with holes drilled and melted in was used here but anything from a cardboard box to a custom 3D printed enclosure will do
+ Potentially: Perfboard to mount the buttons on and then attach to the inside of the box with the tips of the buttons poking through holes in the enclosure- this depends on what type of switches you have and how you plan on mounting them to the enclosure

Tools:

+ Any soldering iron and solder
+ Glue and a drill
	+ .. or anything else you need to attach things to the enclosure of your choice

## Building the hardware

A schematic of the project can be viewed here: [/kishte_schematic/schematic.pdf](https://github.com/JulianKarrer/kishte/blob/origin/kishte_schematic/schematic.pdf)

The most practical order of these steps may depend on your materials used, just read through the whole procedure and decide on the details as you see fit.

1. Attach the potentiometers to the enclosure

In my case, this was a case of drilling holes of matching sizes into the acrylic box (drill on high speeds with little pressure for acrylic!). The potentiometers could then be fixed to the holes by tightening a hex nut on the opposite side of the enclosure.

2. Create the button matrix

The button matrix is shown in the schematic. Just look up which pins of your buttons to use and wire them up as shown, using solder to make connections. As mentioned before, LEDs may be replaced with normal diodes but the current drawn by the LEDs doesn't matter much in terms of power consumption because the buttons are typically only pressed for short durations and the current drawn even if multiple buttons are pressed is less than the ESP32 can comfortably provide.

This schematic actually uses an inefficient layout, a 3x3 Matrix is more GPIO-pin efficient in comparison. However, for spatial and practical reasons 8 buttons were all i cared about for this project. Feel free to read up [guides](https://learn.sparkfun.com/tutorials/button-pad-hookup-guide/all) on how button matrices can reduce the amount of GPIO pins used and adjust the design to your needs.

Use female jumper wire connectors for the connection to the pins of the ESP32 to make the setup more easily rewireable.

3. Attach the buttons to the enclosure

In my case, the buttons were small but long tactile buttons that i could solder to a piece of perfboard, stick the tips of the buttons through holes in the enclosure from the inside and then glue the perfboard to the enclosure via a plastic spacer. 

It took a couple hours of applying pressure with a screw clamp and waiting for the glue to dry before it became robust enough to push the buttons without risking the perfboard falling off on the inside. 

Actually glue is not the preferred way to attach things in these projects because it is permanent, use screws or other mechanical solutions if your enclosure allows it.

4. Wire up the potentiometers

The potentiometers, as mentioned before, act as voltage dividers. This means that we connect all the left legs of the potentiometers together and connect them to +3V while connecting the right legs to GND. The order of which side you attach to which voltage doesn't matter, it just changes whether turning left or right increases or decreases the voltage.

You can still change this property later by changing the Code in the `.ino` Sketch provided in the `/kishte` directory to flip the readings before sending them off to the computer.

Because we chose high resistance potentiometers, little to no current flows across the outer legs of the potentiometers - if we just connected +3V and GND with too little resistance in between we would short the circuit and potentially destroy our microcontroller.

The middle legs of the potentiometers now have a voltage that depends on how far you twist the knob each way and range from +3V to 0V compared to GND.

We attach each of these middle legs via female jumper wire connector to a ADC-enabled pin on our ESP32. ADC stands for analog to digital converter and means that we can apply any voltage between 0V-3V to the pins and receive a reading on the ESP32 that measures the voltage. This is in contrast to digital input pins, which can only read "on" or "off" depending on whether the voltage applied is above or below a threshold (we use these for buttons).

5. Attach the batteries through an ON/OFF switch to the ESP32

The particular microcontroller and batteries recommended above can be set up simply by connecting all red wires and all black wires together. This puts the battery packs in parallel, charges them when the ESP32 is connected via USB-C and uses them as a power source when not plugged in. 

However, we also want to include a switch somewhere between our batteries and the ESP32 on either the red or black cable to cut the power supply and turn the device off and back on anytime. The microcontroller can handle cutting the power suddenly, we don't need to worry about gracefully shutting down or booting up with this design.

6. Attach your ESP32 and upload the software

Open the `kishte.ino` sketch in the `/kishte` directory using an Arduino IDE and install any libraries you might be missing in order to get it to compile (eg. `TFT_eSPI` might need to be [installed](https://github.com/Bodmer/TFT_eSPI))
The sketch should be well documented enough for you to make changes to the pins used or change the arrangements of knobs and buttons easily.

Complie and upload the sketch to your ESP32.

Fun fact: when using Bluetooth, some of the ADCs are used internally to process the signals and we are supposed to have less ADCs available to us. After much frustration, i found that this can for some reason be circumvented by using `adc2_config_channel_atten` and `adc2_get_raw` on a "Pin 0" which I'm not even sure physically exists. I don't know exactly why this works but it doesn't seem to have noticeable repercussions, so we can use 9 Knobs AND Bluetooth! If you have any idea why this hack works, let me know
7. See if it works
Congratulations, you have built a MIDI Controller!
# Modifying the software

## Developing the Electron App

The client app in [/client](https://github.com/JulianKarrer/kishte/tree/origin/client) was built using [Electron](https://www.electronjs.org/) so it is basically an executable version of a website built with HTML, Javascript and CSS that interacts with a Node JS backend handling the communication with the Kishte, the conversion of the signals to actual MIDI commands and the audio capture and analysis used to display a visualizer on the device.

1. If you have not installed NodeJS and Yarn yet, do so. Use `yarn install` in the /client directory to install required packages. You might have to use `$(npm bin)/electron-rebuild` or `.\node_modules\.bin\electron-rebuild.cmd` on Windows to adjust the packages to the version of Node on your system.

2. Start the application with `yarn start` or modify the source code for the backend in `main.js`, the frontend in `renderer.js` or change `index.html` and `index.css` to change the look of the app.
