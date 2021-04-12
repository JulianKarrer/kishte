
/*
 *    KISHTE
 *
 *  kishte - (C) Julian Karrer 2021 under the MIT License
 *  used with the TTGO T-Display Dev Board for the ESP32
 *
*/



#include "Graphics.h"
#include "Components.h"
#include "Messenger.h"



//    CONFIGURATION

    //  MIDI
    //instancing components used in setup

//Knobs
Knob knobs[10] = {
    Knob(
        36,     //input pin
        177,    //midi command
        0,      //midi channel
        true   //invert the knobs direction
    ),
    Knob(37,178,1,true),
    Knob(38,179,2,true),
    Knob(39,180,3,true),
    Knob(32,181,4,true),
    Knob(33,182,5,false),
    Knob(25,183,6,false),
    Knob(26,184,7,false),
    Knob(27,185,8,false),

    Knob(0,0,0,false), //this "knob" is part of tricking the ESP32 into using ADC2 while bluetooth is enabled, see Components.cpp
};

//Button Matrix
int ROWS[2] = {21,22};
int COLUMNS[4] = {12,13,15,2};
ButtonMatrix button = ButtonMatrix(
    700,            //voltage threshold for on/off with analogRead
    ROWS, 2,        //pins of the rows and columns of the keymatrix in an array and the array size
    COLUMNS, 4
);

//  GRAPHICS
Graphics gfx = Graphics(
    135,    //display height
    240,    //display width
    21,     //microphone input pin
    5,      //draw every n-th frame
    100     //time to collect samples in µs
);


//      SETUP AND LOOP

void setup(void) {
    Serial.begin(115200);
    gfx.init();
    messengerInit();
    delay(2000);

}


void loop() {
    updateBtBuffer();
    gfx.update();

    for(int i = 0; i < sizeof(knobs)/sizeof(knobs[0]); i++){
        knobs[i].update();
    }
    button.update();



    delay(0);
}
