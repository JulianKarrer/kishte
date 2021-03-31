/*
 *    GRAPHICS
 *
 *  (C) 2021 Julian Karrer, licensed under the MIT license
*/

#ifndef Graphics_h
#define Graphics_h

#include "arduino.h"

class Graphics
{
  public:
    Graphics(int16_t a, int16_t b, int8_t c, int8_t d, int16_t e);
    void init();
    void update();
  private:
      int16_t h;
      int16_t w;
      int8_t micIn;
      int8_t draw_every;
      int16_t SAMPLE_TIME;
      unsigned long long int fc;
      int16_t buffer[240] = {10};

      float normalize(uint16_t val, uint16_t mini, uint16_t maxi);
      void drawCentred();
      void getEnvelope();
};

#endif
