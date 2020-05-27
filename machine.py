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
        self.isStepHigh = False;
        self.isMotorEnabled = False;
        self.isClockwise = False;
        self.isReferenced = False;
        self.isReferencing = False;
        self.speed = speed;
        self.forceRotation = False;
        self.enabledPin = enabledPin
        self.dirPin = dirPin
        self.stepPin = stepPin
        self.limitSwitchPin = limitSwitchPin
        self.setMotorEnabled(False)
        self.moveThread = None

    def setMotorEnabled(self, value):
        #digitalWrite(axisY.enabledPin, value ? LOW : HIGH);
        digitalWrite(axis.enabledPin, LOW) # FIXME: ALWAYS ENABLED
        self.isMotorEnabled = value

    def setMotorDirection(self, clockwise):
        digitalWrite(axis.dirPin, clockwise ? LOW : HIGH)
        self.isClockwise = clockwise;

    def turnOneStep(self):
        digitalWrite(slef.stepPin, self.isStepHigh ? LOW : HIGH)
        self.isStepHigh = !self.isStepHigh
        self.position = self.position + (self.isClockwise ? 1 : -1)

    def setDestination(self, destination):
        self.destination = destination
        if (self.destination > self.maxPosition):
            self.destination = self.maxPosition
        self.setMotorEnabled(True)
        self.setMotorDirection(self.destination > self.position)

#(name, speed, enabledPin, dirPin, stepPin, limitSwithPin)
axisX = Axis('X', 500, 2, 3, 4, 5)
axisY = Axis('Y', 500, 14, 15, 18, 6)
axisA = Axis('A', 500, 17, 27, 22, 13)
axisB = Axis('B', 500, 10, 9, 11, 19)
axisT = Axis('T', 500, 25, 8, 7, 26)

axes = {'X': axisX, 'Y': axisY, 'A': axisA, 'B': axisB, 'T': axisB}

def digitalWrite(foo, bar):
    print('digitalWrite')

def numberLength(str) :
    i = 0
    for e in str:
        if (e < '0' || e > '9'):
            break
    return i

def parseSpeed(cmd):
    for i in range(0, len(cmd)):
        axis = axes[cmd[i]]
        if (axis):
            nbLength = numberLength(cmd[i+1:]);
            axis.speed = int(cmd[i+1:i+1+nbLength])

def parseMove(cmd):
    for i in range(0, len(cmd)):
        axis = axes[cmd[i]]
        if (axis):
            nbLength = numberLength(cmd[i+1:]);
            axis.setDestination(int(cmd[i+1:i+1+nbLength]))

void handleAxis(Axis& axis) {
  if (axis.isReferencing) {
    //Serial.println(digitalRead(axis.limitSwitchPin));
    if (!digitalRead(axis.limitSwitchPin)) {
      Serial.print("Done referencing axis ");
      Serial.println(axis.name);
      axis.position = 0;
      setMotorEnabled(axis, False);
      axis.isReferenced = True;
      axis.isReferencing = False;
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
      //setMotorsEnabled(False);
      axisX.destination = axisX.position;
      axisY.destination = axisY.position;
      axisZ.destination = axisZ.position;
      axisW.destination = axisW.position;
      axisX.forceRotation = False;
      axisY.forceRotation = False;
      axisZ.forceRotation = False;
      axisW.forceRotation = False;
    } else if (input.charAt(0) == 'H' || input.charAt(0) == 'h') { // home reference (eg. H, or HX, or HY, ...)
      Serial.println("Referencing...");
      if (input.length() == 1) {
        axisX.isReferencing = True;
        axisY.isReferencing = True;
        axisZ.isReferencing = True;
        axisW.isReferencing = True;
        setMotorDirection(axisX, CCW);
        setMotorDirection(axisY, CCW);
        setMotorDirection(axisZ, CCW);
        setMotorEnabled(axisX, True);
        setMotorEnabled(axisY, True);
        setMotorEnabled(axisZ, True);
      } else {
        Axis& axis = axisByLetter(input.charAt(1));
        axis.isReferencing = True;
        setMotorDirection(axis, CCW);
        setMotorEnabled(axis, True);
      }
    } else if (input == "?") { // debug info
      printDebugInfo();
    } else if (input.charAt(0) == '+') {
      Axis& axis = axisByLetter(input.charAt(1));
      setMotorDirection(axis,CW);
      axis.forceRotation = True;
      setMotorEnabled(axis,True);
    } else if (input.charAt(0) == '-') {
      Axis& axis = axisByLetter(input.charAt(1));
      setMotorDirection(axis,CCW);
      axis.forceRotation = True;
      setMotorEnabled(axis, True);
    }
  }

  handleAxis(axisX);
  handleAxis(axisY);
  handleAxis(axisZ);
}
