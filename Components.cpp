/*
 *    COMPONENTS
 *
 *  (C) 2021 Julian Karrer, licensed under the MIT license
*/

#include "Components.h"
#include "arduino.h"
#include "Messenger.h"


    //KNOBS

Knob::Knob(uint8_t a, uint16_t b, uint8_t c, bool d){
    pin = a;
    command = b;
    channel = c;
    inverted = d;
};

void Knob::update(){
    //take voltage reading
    int reading = analogRead(pin)*127/4095;
    //apply exponential smoothing
    _val = 0.95*_val + 0.05*(float)reading;
    //send midi command only if the value change is above threshold
    if(abs(float(_lastSent) - _val) > 1.3){
        sendMIDI(command, channel, inverted?127-int(_val) : int(_val));
        _lastSent = uint16_t(_val);
    }
};

    //BUTTONS
Button::Button(uint8_t a, uint16_t b, uint8_t c, uint16_t d){
    pin = a;
    command = b;
    channel = c;
    threshold = d;
    sendMIDI(command, channel, 0);
};

void Button::update(){
    int reading = analogRead(pin);
    bool newState = (reading > threshold);
    if (newState != state){
        state = newState;
        sendMIDI(command, channel, state ? 0 : 1);
    }
};
