#include "Messenger.h"
#include "BluetoothSerial.h"
BluetoothSerial SerialBT;

void messengerInit()
{
	SerialBT.begin("KISHTE");
    Serial.println("initializing Bluetooth...");
}

//function for sending midi commands via USB and Bluetooth
void sendMIDI(byte command, byte data1, byte data2)
{
    //USB
    Serial.write(command);
    Serial.write(data1);
    Serial.write(data2);
    //Bluetooth
    if(SerialBT.available()){
        SerialBT.print(command);
        SerialBT.print("-");
        SerialBT.print(data1);
        SerialBT.print("-");
        SerialBT.println(data2);
    }
};
