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

class ButtonMatrix {
    private:
        int *rows;
        int row_num;
        int *cols;
        int col_num;
        int threshold;
        bool state[8] = {false};
        int commands[8] = {
            186,
            187,
            188,
            189,
            190,
            191,
            192,
            193
        };
        int channels[8] = {
            9,
            10,
            11,
            12,
            13,
            14,
            15,
            16
        };
    public:
        //constructor
        ButtonMatrix(int threshold, int *rows, int row_num, int *cols, int col_num);
        //function to be called every frame
        void update();
};

#endif
