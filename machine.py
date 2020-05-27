from gpiozero import Button
from time import sleep
import socket
import sys
import logging
import threading
import time

def move(name):
    logging.info("Thread %s: starting", name)
    time.sleep(2)
    logging.info("Thread %s: finishing", name)

# Create a TCP/IP socket
sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)

# Bind the socket to the port
server_address = ('localhost', 10000)
print >>sys.stdout, 'starting up on %s port %s' % server_address
sock.bind(server_address)

# Listen for incoming connections
sock.listen(1)

while True:
    # Wait for a connection
    print >>sys.stdout, 'waiting for a connection'
    connection, client_address = sock.accept()

    try:
        print >>sys.stdout, 'connection from', client_address

        data = connection.recv(256).strip()
        print >>sys.stdout, 'received "%s"' % data
        if data:
            if (data == "move"):
                format = "%(asctime)s: %(message)s"
                logging.basicConfig(format=format, level=logging.INFO, datefmt="%H:%M:%S")
                logging.info("Main    : before creating thread")
                x = threading.Thread(target=move, args=(1,))
                logging.info("Main    : before running thread")
                x.start()
                logging.info("Main    : wait for the thread to finish")
                logging.info("Main    : all done")
            elif (data == "stop"):
                print >>sys.stdout, 'stop'

        connection.close()
        #connection.sendall(data)

    finally:
        # Clean up the connection
        connection.close()

#button = Button(15,pull_up=True)
button = Button(15,pull_up=False)

while True:
    if button.is_pressed:
        print("Pressed")
    else:
        print("Released")
    sleep(1)


SLOW_SPEED_DELAY = 2000
CW = True
CCW = False

class Axis:
    def __init__(self, name, speed, enabledPin, dirPin, stepPin, limitSwithPin):
        self.name = name
        self.position = -1
        self.destination = -1
        self.maxPosition = 9999999
        self.previousStepTime = time.time()
        self.isStepHigh = false;
        self.isMotorEnabled = false;
        self.isClockwise = false;
        self.isReferenced = false;
        self.isReferencing = false;
        self.speed = speed;
        self.forceRotation = false;
        self.enabledPin = enabledPin
        self.dirPin = dirPin
        self.stepPin = stepPin
        self.limitSwitchPin = limitSwitchPin

    def setMotorEnabled(self, value):
        digitalWrite(axis.enabledPin, LOW) # FIXME: ALWAYS ENABLED
        #digitalWrite(axisY.enabledPin, value ? LOW : HIGH);
        self.isMotorEnabled = value

        digitalWrite(ledPin, value ? HIGH : LOW);


void setMotorEnabled(Axis& axis, bool value) {
}

void setMotorDirection(Axis& axis, bool clockwise) {
  digitalWrite(axis.dirPin, clockwise ? LOW : HIGH);
  axis.isClockwise = clockwise;

  delayMicroseconds(SLOW_SPEED_DELAY);
}

void turnOneStep(Axis& axis) {
  digitalWrite(axis.stepPin, axis.isStepHigh ? LOW : HIGH);
  axis.isStepHigh = !axis.isStepHigh;
  axis.position = axis.position + (axis.isClockwise ? 1 : -1);
}

#(name, speed, enabledPin, dirPin, stepPin, limitSwithPin)
axisX = Axis('X', 500)
axisY = Axis('y', 500)
axisA = Axis('a', 500)
axisB = Axis('b', 500)
axisT = Axis('t', 500)
void setup() {

  //Initiate Serial communication.
  Serial.begin(9600);
  Serial.println("Setup...");

  // ************* PIN LAYOUT **************
  pinMode(ledPin, OUTPUT);

  axisX.enabledPin = 8;
  axisX.dirPin = 10;
  axisX.stepPin = 11;
  axisX.limitSwitchPin = 12;

  axisY.enabledPin = 8;
  axisY.dirPin = 2;
  axisY.stepPin = 3;
  axisY.limitSwitchPin = 12;

  axisZ.enabledPin = 8;
  axisZ.dirPin = 7;
  axisZ.stepPin = 6;
  axisZ.limitSwitchPin = 12;
  // ***************************************

  setupAxis(axisX, 'X', 500);
  setupAxis(axisY, 'Y', 500);
  setupAxis(axisZ, 'Z', 500);

  axisX.maxPosition = 999999;
  axisY.maxPosition = 999999;
  axisZ.maxPosition = 999999;

  setMotorEnabled(axisX,false);
  setMotorEnabled(axisY,false);
  setMotorEnabled(axisZ,false);

  Serial.println("Done");
}

int numberLength(String str) {
  int i;
  for (i = 0; i < str.length(); i++) {
    if (str[i] < '0' || str[i] > '9') {break;}
  }
  return i;
}

void parseSpeed(String cmd) {
  for (int i = 0; i < cmd.length(); i++) {
    int nbLength = numberLength(cmd.substring(i+1));
    Axis& axis = axisByLetter(cmd[i]);
    axis.speed = cmd.substring(i+1,i+1+nbLength).toInt();
    i = i+nbLength;
  }
}

void parseMove(String cmd) {
  for (int i = 0; i < cmd.length(); i++) {
    int nbLength = numberLength(cmd.substring(i+1));
    Axis& axis = axisByLetter(cmd[i]);
    axis.destination = cmd.substring(i+1,i+1+nbLength).toInt();
    if (axis.destination > axis.maxPosition) {axis.destination = axis.maxPosition;}
    setMotorEnabled(axis, true);
    setMotorDirection(axis, axis.destination > axis.position);
    i = i+nbLength;
  }
}

void handleAxis(Axis& axis) {
  if (axis.isReferencing) {
    //Serial.println(digitalRead(axis.limitSwitchPin));
    if (!digitalRead(axis.limitSwitchPin)) {
      Serial.print("Done referencing axis ");
      Serial.println(axis.name);
      axis.position = 0;
      setMotorEnabled(axis, false);
      axis.isReferenced = true;
      axis.isReferencing = false;
    } else {
      turnOneStep(axis);
      delayMicroseconds(SLOW_SPEED_DELAY);
    }
  } else if (axis.isReferenced && axis.isMotorEnabled && currentTime - axis.previousStepTime > axis.speed && (axis.forceRotation ||
            ((axis.isClockwise && axis.position < axis.destination) || (!axis.isClockwise && axis.position > axis.destination)))) {
    turnOneStep(axis);
    axis.previousStepTime = currentTime;
  }
}

Axis& axisByLetter(char letter) {
  if (letter == 'X' || letter == 'x') {
    return axisX;
  } else if (letter == 'Y' || letter == 'y') {
    return axisY;
  } else if (letter == 'Z' || letter == 'z') {
    return axisZ;
  } else if (letter == 'W' || letter == 'w') {
    return axisW;
  } else {
    return oups;
  }
}

void loop() {
  currentTime = time.time();

  if (Serial.available() > 0) {
    String input = Serial.readString();
    input.remove(input.length()-1);

    Serial.print("Cmd: ");
    Serial.println(input);
    if (input.charAt(0) == 'M' || input.charAt(0) == 'm') {
      parseMove(input.substring(1));
    } else if (input.charAt(0) == 'V' || input.charAt(0) == 'v') { // speed (eg. VX300 -> axis X speed 300 microseconds delay per step)
      parseSpeed(input.substring(1));
    } else if (input.charAt(0) == 's' || input.charAt(0) == 'S') { // stop
      //setMotorsEnabled(false);
      axisX.destination = axisX.position;
      axisY.destination = axisY.position;
      axisZ.destination = axisZ.position;
      axisW.destination = axisW.position;
      axisX.forceRotation = false;
      axisY.forceRotation = false;
      axisZ.forceRotation = false;
      axisW.forceRotation = false;
    } else if (input.charAt(0) == 'H' || input.charAt(0) == 'h') { // home reference (eg. H, or HX, or HY, ...)
      Serial.println("Referencing...");
      if (input.length() == 1) {
        axisX.isReferencing = true;
        axisY.isReferencing = true;
        axisZ.isReferencing = true;
        axisW.isReferencing = true;
        setMotorDirection(axisX, CCW);
        setMotorDirection(axisY, CCW);
        setMotorDirection(axisZ, CCW);
        setMotorEnabled(axisX, true);
        setMotorEnabled(axisY, true);
        setMotorEnabled(axisZ, true);
      } else {
        Axis& axis = axisByLetter(input.charAt(1));
        axis.isReferencing = true;
        setMotorDirection(axis, CCW);
        setMotorEnabled(axis, true);
      }
    } else if (input == "?") { // debug info
      printDebugInfo();
    } else if (input.charAt(0) == '+') {
      Axis& axis = axisByLetter(input.charAt(1));
      setMotorDirection(axis,CW);
      axis.forceRotation = true;
      setMotorEnabled(axis,true);
    } else if (input.charAt(0) == '-') {
      Axis& axis = axisByLetter(input.charAt(1));
      setMotorDirection(axis,CCW);
      axis.forceRotation = true;
      setMotorEnabled(axis, true);
    }
  }

  handleAxis(axisX);
  handleAxis(axisY);
  handleAxis(axisZ);
}
