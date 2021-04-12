#pragma once
#include "arduino.h"

void messengerInit();
void sendMIDI(byte command, byte data1, byte data2);
void updateBtBuffer();
void shiftInsert(int16_t val);
void circularInsert(int16_t val);
void insertUntilFull(int16_t val);

extern int16_t btBuffer[240];
