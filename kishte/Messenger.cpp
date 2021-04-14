#include "Messenger.h"
#include "BluetoothSerial.h"
#include "Graphics.h"
BluetoothSerial SerialBT;

void messengerInit()
{
	SerialBT.begin("KISHTE");
    Serial.println("initializing Bluetooth...");
};

//function for sending midi commands via USB and Bluetooth
void sendMIDI(byte command, byte data1, byte data2)
{
    //USB
    Serial.print(command);
    Serial.print("-");
    Serial.print(data1);
    Serial.print("-");
    Serial.println(data2);
    //Bluetooth
    SerialBT.print(command);
    SerialBT.print("-");
    SerialBT.print(data1);
    SerialBT.print("-");
    SerialBT.println(data2);
};

//global btBuffer
int16_t btBuffer[240] = {50};
int16_t btPointer = 0;

unsigned char setColourBuffer[2] = {0};
int16_t bytesToAccept = 0;

int16_t state = 0;

void updateBtBuffer(){
    while (SerialBT.available()) {
        int16_t newReading = (int16_t) SerialBT.read();

        switch (state){

             //default state, accept waveform data and flag bytes

            case 0:
                switch(newReading) {    //look for flag bytes sent from client
                    case 200:    //flag byte 200 => new waveform data, reset btPointer
                        btPointer = 0;
                        break;
                    case 201:   //flag byte 201 => set colour, next two bytes are colour
                        bytesToAccept = 2;
                        state = 1;
                        break;
                    case 202:   //flag byte 202 => set drawMethod to drawLine
                        drawMethod = 0;
                        break;
                    case 203:   //flag byte 203 => set drawMethod to drawCentred
                        drawMethod = 1;
                        break;
                    case 204:   //flag byte 204 => set drawMethod to drawBars
                        drawMethod = 2;
                        break;

                    default:
                        //if no flag byte is found, incoming data is pushed to the draw buffer
                        insertUntilFull(newReading);
                        // shiftInsert(newReading);
                        // circularInsert(newReading);
                }
                break;

            //handle data made up of known-length byte sequences

            case 1: //accept 2 bytes for setColour
                switch(bytesToAccept){
                    case 2:
                        setColourBuffer[0] = (unsigned char) newReading;
                        bytesToAccept --;
                        break;
                    case 1:
                        setColourBuffer[1] = (unsigned char) newReading;
                        mainColour = (((uint32_t)(setColourBuffer[0]) << 8) | ((uint32_t)(setColourBuffer[1]) << 0));
                        bytesToAccept = 0;
                        state = 0;
                        break;
                }
                break;


        }
    }
};

void insertUntilFull(int16_t val){
    if(btPointer < 240){
        btBuffer[btPointer] = val;
        btPointer ++;
    }
}

void shiftInsert(int16_t val){
    //insert new data at the end, shifting array contents to the front
    for (int i = 0; i<239; i++){
        btBuffer[i] = btBuffer[i+1];
    }
    btBuffer[239] = val;
}

void circularInsert(int16_t val){
    btBuffer[btPointer] = val;
    btPointer = (btPointer + 1) % 240;
}
