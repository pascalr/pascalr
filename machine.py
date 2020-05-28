from gpiozero import Button
from time import sleep
import socket
import sys
import logging
import threading
import time
import json
from gpiozero import OutputDevice as stepper

#def move(name):
#    currentTime = time.time()
#    logging.info("Thread %s: starting", name)
#    time.sleep(2)
#    logging.info("Thread %s: finishing", name)

# Create a TCP/IP socket
sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)

# Bind the socket to the port
server_address = ('localhost', 10000)
print('starting up on %s port %s' % server_address)
sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
sock.bind(server_address)

# Listen for incoming connections
sock.listen(1)
                
#                format = "%(asctime)s: %(message)s"
#                logging.basicConfig(format=format, level=logging.INFO, datefmt="%H:%M:%S")
#                logging.info("Main    : before creating thread")
#                x = threading.Thread(target=move, args=(1,))
#                logging.info("Main    : before running thread")
#                x.start()
#                logging.info("Main    : wait for the thread to finish")
#                logging.info("Main    : all done")

##button = Button(15,pull_up=True)
#button = Button(15,pull_up=False)
#
#while True:
#    if button.is_pressed:
#        print("Pressed")
#    else:
#        print("Released")
#    sleep(1)


SLOW_SPEED_DELAY = 2000
CW = True
CCW = False
LOW = 0
HIGH = 1

def pretty(d, indent=0):
    str1 = ""
    for key, value in d.items():
        str1 += ('\t' * indent + str(key) + '\n')
        if isinstance(value, dict):
            return pretty(value, indent+1)
        else:
            str1 += ('\t' * (indent+1) + str(value) + '\n')
    return str1

def axisByName(name):
    for axis in axes:
        if axis.name == name:
            return axis
    return None

def digitalWrite(pin, value):
    if (value):
        pin.on()
    else:
        pin.off()

def numberLength(str1) :
    i = 0
    for e in str1:
        if (e < '0' or e > '9'):
            break
    return i

def parseSpeed(cmd):
    for i in range(0, len(cmd)):
        axis = axisByName(cmd[i])
        if (axis):
            nbLength = numberLength(cmd[i+1:])
            axis.speed = int(cmd[i+1:i+1+nbLength])

def parseMove(cmd):
    for i in range(0, len(cmd)):
        axis = axisByName(cmd[i])
        if (axis):
            nbLength = numberLength(cmd[i+1:])
            axis.setDestination(int(cmd[i+1:i+1+nbLength]))

class Axis:
    def __init__(self, name, speed, enabledPinNb, dirPinNb, stepPinNb, limitSwitchPinNb):
        self.name = name
        self.position = -1
        self.destination = -1
        self.maxPosition = 9999999
        self.previousStepTime = time.time()
        self.isStepHigh = False
        self.isMotorEnabled = False
        self.isClockwise = False
        self.isReferenced = False
        self.isReferencing = False
        self.speed = speed
        self.forceRotation = False

        self.enabledPinNb = enabledPinNb
        self.dirPinNb = dirPinNb
        self.stepPinNb = stepPinNb
        self.limitSwitchPinNb = limitSwitchPinNb

        self.enabledPin = stepper(enabledPinNb)
        self.dirPin = stepper(dirPinNb)
        self.stepPin = stepper(stepPinNb)
        self.limitSwitchPin = stepper(limitSwitchPinNb)

        self.setMotorEnabled(False)
        self.moveThread = None

    def __str__(self):
        #return str(self.__class__) + ": " + str(self.__dict__)
        #return str(self.__class__) + ": " + json.dumps(self.__dict__, sort_keys=True, indent=4)
        return str(self.__class__) + ": " + pretty(self.__dict__)

    def setMotorEnabled(self, value):
        #digitalWrite(axisY.enabledPin, value ? LOW : HIGH)
        digitalWrite(self.enabledPin, LOW) # FIXME: ALWAYS ENABLED
        self.isMotorEnabled = value

    def setMotorDirection(self, clockwise):
        digitalWrite(self.dirPin, LOW if clockwise else HIGH)
        self.isClockwise = clockwise

    def turnOneStep(self):
        digitalWrite(slef.stepPin, LOW if self.isStepHigh else HIGH)
        self.isStepHigh = not self.isStepHigh
        self.position = self.position + (1 if self.isClockwise else -1)

    def setDestination(self, destination):
        self.destination = destination
        if (self.destination > self.maxPosition):
            self.destination = self.maxPosition
        self.setMotorEnabled(True)
        self.setMotorDirection(self.destination > self.position)

    def doReference(self):
        self.isReferenced = False
        self.isReferencing = True
        self.setMotorDirection(CCW)
        self.setMotorEnabled(True)

#(name, speed, enabledPin, dirPin, stepPin, limitSwithPin)
axisX = Axis('X', 500, 2, 3, 4, 5)
axisY = Axis('Y', 500, 14, 15, 18, 6)
axisA = Axis('A', 500, 17, 27, 22, 13)
axisB = Axis('B', 500, 10, 9, 11, 19)
axisT = Axis('T', 500, 25, 8, 7, 26)

axes = [axisX, axisY, axisA, axisB, axisT]

#void handleAxis(Axis& axis) {
#  if (axis.isReferencing) {
#    //Serial.println(digitalRead(axis.limitSwitchPin))
#    if (!digitalRead(axis.limitSwitchPin)) {
#      Serial.print("Done referencing axis ")
#      Serial.println(axis.name)
#      axis.position = 0
#      setMotorEnabled(axis, False)
#      axis.isReferenced = True
#      axis.isReferencing = False
#    } else {
#      turnOneStep(axis)
#      delayMicroseconds(SLOW_SPEED_DELAY)
#    }
#  } else if (axis.isReferenced && axis.isMotorEnabled && currentTime - axis.previousStepTime > axis.speed && (axis.forceRotation or
#            ((axis.isClockwise && axis.position < axis.destination) or (!axis.isClockwise && axis.position > axis.destination)))) {
#    turnOneStep(axis)
#    axis.previousStepTime = currentTime
#  }
#}
#
#
#
#void loop() {
#  
#}


while True:
    # Wait for a connection
    print('waiting for a connection')
    connection, client_address = sock.accept()

    try:
        print('connection from', client_address)

        data = connection.recv(256).decode("utf-8").strip()
        print('received', data)
        if data:
            if (data[0] == "M" or data[0] == "m"):
                parseMove(input.substring(1))
            elif (data[0] == "V" or data[0] == "v"):
                parseSpeed(input.substring(1))
            elif (data[0] == "s" or data[0] == "S"):
                print('stop')
                for axis in axes:
                    axis.setMotorEnabled(False)
                    axis.destination = axis.position
                    axis.forceRotation = False
            elif (data[0] == "H" or data[0] == "h"):
                print('Referencing...')
                if (len(data) == 1):
                    for axis in axes:
                        axis.doReference()
                else:
                    axis = axisByName[data[1]]
                    if axis:
                        axis.doReference()
            elif (data[0] == "?"):
                if (len(data) == 1):
                    for axis in axes:
                        print(axis)
                else:
                    axis = axisByName(data[1])
                    if axis:
                        print(axis)
    #} else if (input == "?") { // debug info
    #} else if (input.charAt(0) == '+') {
    #  Axis& axis = axisByLetter(input.charAt(1))
    #  setMotorDirection(axis,CW)
    #    axis.forceRotation = True
    #    setMotorEnabled(axis,True)
    #  } else if (input.charAt(0) == '-') {
    #    Axis& axis = axisByLetter(input.charAt(1))
    #    setMotorDirection(axis,CCW)
    #    axis.forceRotation = True
    #    setMotorEnabled(axis, True)
    #  }
    #}

  #handleAxis(axisX)
  #handleAxis(axisY)
  #handleAxis(axisZ)

        #connection.close()
        #connection.sendall(data)

    finally:
        # Clean up the connection
        connection.close()


