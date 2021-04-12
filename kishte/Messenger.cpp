#include "Messenger.h"
#include "BluetoothSerial.h"
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

void updateBtBuffer(){
    while (SerialBT.available()) {
        int16_t newReading = (int16_t) SerialBT.read();
        //look for flag bytes sent from client
        if (newReading == 200){ btPointer = 0;} //flag byte 200 => new waveform, reset btPointer
        else{
            //if no flag byte is found, handle data
            insertUntilFull(newReading);
            // shiftInsert();
            // circularInsert((int16_t) SerialBT.read());
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
