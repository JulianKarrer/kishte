/*
 *    COMPONENTS
 *
 *  (C) 2021 Julian Karrer, licensed under the MIT license
*/

#include "Components.h"
#include "arduino.h"
#include "Messenger.h"
#include <driver/adc.h>


    //KNOBS

Knob::Knob(uint8_t a, uint16_t b, uint8_t c, bool d){
    pin = a;
    command = b;
    channel = c;
    inverted = d;
    pinMode(pin, INPUT);
};

void Knob::update(){
    //take voltage reading
    int reading = analogRead(pin)*127/4095;
    if(pin == 0){
        adc2_config_channel_atten( ADC2_CHANNEL_1, ADC_ATTEN_0db );
        esp_err_t r = adc2_get_raw( ADC2_CHANNEL_1, ADC_WIDTH_12Bit, &reading);
    };

    //apply exponential smoothing
    _val = 0.95*_val + 0.05*(float)reading;
    //send midi command only if the value change is above threshold
    if(abs(float(_lastSent) - _val) > 1.3){
        sendMIDI(command, channel, inverted?127-int(_val) : int(_val));
        _lastSent = uint16_t(_val);
    }
};

    //BUTTONS
ButtonMatrix::ButtonMatrix(int t, int *a, int b, int *c, int d){
    threshold = t;
    rows = a;
    row_num = b;
    cols = c;
    col_num = d;

    //initialization
    for (size_t i = 0; i < col_num; i++) {
        pinMode(cols[i], INPUT);
    }
    for (size_t i = 0; i < row_num; i++) {
        pinMode(rows[i], OUTPUT);
        digitalWrite(rows[i], HIGH);
    }

};

void ButtonMatrix::update(){
    for (size_t j = 0; j < col_num; j++) {
        for (size_t i = 0; i < row_num; i++) {
            //get voltage reading for current row and column
            digitalWrite(rows[i], LOW);
            bool newState = (analogRead(cols[j]) > threshold);
            digitalWrite(rows[i], HIGH);
            //update state[] & send message if state has changed
            if (state[j+4*i] != newState) {
                state[j+4*i] = newState;
                Serial.print(j+4*i);
                Serial.println(newState);
                sendMIDI(commands[j+4*i], channels[j+4*i], newState?1:0);
            }
        }
    }
};
