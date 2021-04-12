/*
 *    GRAPHICS
 *
 *  (C) 2021 Julian Karrer, licensed under the MIT license
*/


#include "Graphics.h"
#include "Messenger.h"

#include "arduino.h"
#include <TFT_eSPI.h> // Graphics and font library for ST7735 driver chip
#include <SPI.h>

TFT_eSPI tft = TFT_eSPI();

#define BLACK 0x0000
#define WHITE 0xFFFF



    //  PUBLIC METHODS

Graphics::Graphics(int16_t a, int16_t b, int8_t c, int8_t d, int16_t e){
    h = a;              //display height
    w = b;              //display width
    micIn = c;          //microphone input pin
    draw_every = d;     //draw every n-th frame
    SAMPLE_TIME = e;     //time to collect samples in µs
    fc = 0;
};

void Graphics::init() {
  tft.init();
  tft.setRotation(1); //use screen horizontally
  tft.fillScreen(BLACK);
}

void Graphics::update() {
  //getEnvelope();  //gets audio signal by analog-reading the micIn pin
  if (fc%draw_every==0){
    drawCentred(true);
  }
  fc++;
}




    //  PRIVATE METHODS

float Graphics::normalize(uint16_t val, uint16_t mini, uint16_t maxi){
    return (float)(val - mini) / (float)(maxi - mini);
}

void Graphics::drawCentred(bool bt){
    //draws contents of the buffer[] to the screen
    for(int i=0; i<w; i++){
        int16_t b = bt ? (btBuffer[i]==0?1:btBuffer[i]) : (buffer[i]==0?1:buffer[i]);
        int16_t rim = (h-b)/2;
        tft.drawFastVLine(i, 0, rim, BLACK);
        tft.drawFastVLine(i, rim, b, WHITE);
        tft.drawFastVLine(i, h-rim, rim, BLACK);
    }
}



void Graphics::getEnvelope(){
    //fills the buffer[] with normalized measurements to draw
    static uint16_t raw_buffer[240] = {0};
    static uint16_t smooth_maxi = 4095;
    static const float max_smth_fctr = 0.95;
    uint16_t maxi = 0;
    uint16_t mini = 4095;
    uint16_t delta = 0;

    //sample the voltage at the adc
    //amplitude = max-min
    unsigned long int ts = micros();
    while (micros() - ts < SAMPLE_TIME){
        int16_t val = analogRead(micIn);
        if (val > maxi) {maxi = val;}
        if (val < mini) {mini = val;}
    }

    delta = maxi-mini;

    //shift buffer and make new entry
    //meanwhile calculate the max and min of the entire buffer to normalize values
    mini = 4095;
    maxi = 0;
    for (int i = 0; i<w-1; i++){
        raw_buffer[i] = raw_buffer[i+1];
        if (raw_buffer[i] > maxi) {maxi = raw_buffer[i];}
        if (raw_buffer[i] < mini) {mini = raw_buffer[i];}
    }

    raw_buffer[w-1] = delta;
    if (delta > maxi) {maxi = delta;}
    if (delta < mini) {mini = delta;}

    //apply exponential smoothing on the maximum
    smooth_maxi = round( ((float)smooth_maxi*max_smth_fctr + (float)maxi*(1.-max_smth_fctr)) );

    //normalize the updated raw buffer and push it to the draw buffer
    for (int i = 0; i<w; i++){
        buffer[i] = round(h * normalize(raw_buffer[i], mini, smooth_maxi));
    }
}
