/*
 *    COMPONENTS
 *
 *  (C) 2021 Julian Karrer, licensed under the MIT license
*/

#ifndef Components_h
#define Components_h

#include "arduino.h"

class Knob {
    private:
        float _val = 0.;
        uint16_t _lastSent = 0;
        uint8_t _ptr = 0;
    public:
        uint8_t pin;
        uint16_t command;
        uint8_t channel;
        bool inverted;
        //constructor
        Knob(uint8_t a, uint16_t b, uint8_t c, bool d);
        //function to be called every frame
        void update();
};

class Button {
    private:
        bool state = false;
        uint16_t threshold = 1000;
    public:
        uint8_t pin;
        uint16_t command;
        uint8_t channel;
        //constructor
        Button(uint8_t a, uint16_t b, uint8_t c, uint16_t d);
        //function to be called every frame
        void update();
};

#endif
