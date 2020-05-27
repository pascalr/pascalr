onmessage = function(e) {
  console.log('Message received from main script');
  console.log(e.data)
  //postMessage(workerResult);
}

LED.unexport(); // Unexport GPIO to free resources

setTimeout(endBlink, 5000); //stop blinking after 5 seconds

// CONSTANTS
var SLOW_SPEED_DELAY = 2000
var FAST_SPEED_DELAY = 100

var CW = true
var CCW = false
var LOW = 0
var HIGH = 1

var axisX, axisY, axisA, axisB, axisT, oups;

var currentTime;

// This encapsulates for either arduino, raspberry or other
function writeIO = (pin, bit) => (pin.writeSync(bit))
function readIO = (pin) => (pin.readSync())
function createInput = (nb) => (new Gpio(nb, 'in')) 
function createOutput = (nb) => (new Gpio(nb, 'out'))
function micros = () => {var hrTime = process.hrtime(); return hrTime[0] * 1000000 + hrTime[1] / 1000}

function setMotorEnabled(axis, value) {
  writeIO(axis.enabledPin, LOW); // FIXME: ALWAYS ENABLED
  //writeIO(axisY.enabledPin, value ? LOW : HIGH);
  axis.isMotorEnabled = value;
  
  writeIO(ledPin, value ? HIGH : LOW);
}

function setMotorDirection(axis, clockwise) {
  writeIO(axis.dirPin, clockwise ? LOW : HIGH);
  axis.isClockwise = clockwise;
  
  delayMicroseconds(SLOW_SPEED_DELAY);
}

function turnOneStep(axis) {
  writeIO(axis.stepPin, axis.isStepHigh ? LOW : HIGH);
  axis.isStepHigh = !axis.isStepHigh;
  axis.position = axis.position + (axis.isClockwise ? 1 : -1);
}

function setupAxis(axis, name, speed) {
  axis.name = name;
  axis.position = -1;
  axis.destination = -1;
  axis.previousStepTime = micros();
  axis.isStepHigh = false;
  axis.isMotorEnabled = false;
  axis.isClockwise = false;
  axis.isReferenced = false;
  axis.isReferencing = false;
  axis.speed = speed;
  axis.forceRotation = false;
  
  axis.stepPin = createInput(axis.stepPinNb)
  axis.dirPin = createInput(axis.dirPinNb)
  axis.enabledPin = createInput(axis.enabledPinNb)
  axis.limitSwitchPin = createInput(axis.limitSwitchPinNb)
}

function setup() {
  // ************* PIN LAYOUT **************
  axisX.enabledPinNb = 8;
  axisX.dirPinNb = 10;
  axisX.stepPinNb = 11;
  axisX.limitSwitchPinNb = 12;

  axisY.enabledPinNb = 8;
  axisY.dirPinNb = 2;
  axisY.stepPinNb = 3;
  axisY.limitSwitchPinNb = 12;

  axisA.enabledPinNb = 8;
  axisA.dirPinNb = 7;
  axisA.stepPinNb = 6;
  axisA.limitSwitchPinNb = 12;
  // ***************************************

  setupAxis(axisX, 'X', 500);
  setupAxis(axisY, 'Y', 500);
  setupAxis(axisA, 'Z', 500);
  
  axisX.maxPosition = 999999;
  axisY.maxPosition = 999999;
  axisA.maxPosition = 999999;
  
  setMotorEnabled(axisX,false);
  setMotorEnabled(axisY,false);
  setMotorEnabled(axisA,false);
  
  Serial.println("Done");
}

numberLength(String str) {
  i;
  for (i = 0; i < str.length(); i++) {
    if (str[i] < '0' || str[i] > '9') {break;}
  }
  return i;
}

function parseSpeed(String cmd) {
  for (i = 0; i < cmd.length(); i++) {
    nbLength = numberLength(cmd.substring(i+1));
    axis = axisByLetter(cmd[i]);
    axis.speed = cmd.substring(i+1,i+1+nbLength).toInt();
    i = i+nbLength;
  }
}

function parseMove(String cmd) {
  for (i = 0; i < cmd.length(); i++) {
    nbLength = numberLength(cmd.substring(i+1));
    axis = axisByLetter(cmd[i]);
    axis.destination = cmd.substring(i+1,i+1+nbLength).toInt();
    if (axis.destination > axis.maxPosition) {axis.destination = axis.maxPosition;}
    setMotorEnabled(axis, true);
    setMotorDirection(axis, axis.destination > axis.position);
    i = i+nbLength;
  }
}

function handleAxis(axis) {
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

axisByLetter(letter) {
  if (letter == 'X' || letter == 'x') {
    return axisX;
  } else if (letter == 'Y' || letter == 'y') {
    return axisY;
  } else if (letter == 'Z' || letter == 'z') {
    return axisA;
  } else if (letter == 'W' || letter == 'w') {
    return axisW;
  } else {
    return oups;
  }
}

function loop() {
  currentTime = micros();

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
      axisA.destination = axisA.position;
      axisW.destination = axisW.position;
      axisX.forceRotation = false;
      axisY.forceRotation = false;
      axisA.forceRotation = false;
      axisW.forceRotation = false;
    } else if (input.charAt(0) == 'H' || input.charAt(0) == 'h') { // home reference (eg. H, or HX, or HY, ...)
      Serial.println("Referencing...");
      if (input.length() == 1) {
        axisX.isReferencing = true;
        axisY.isReferencing = true;
        axisA.isReferencing = true;
        axisW.isReferencing = true;
        setMotorDirection(axisX, CCW);
        setMotorDirection(axisY, CCW);
        setMotorDirection(axisA, CCW);
        setMotorEnabled(axisX, true);
        setMotorEnabled(axisY, true);
        setMotorEnabled(axisA, true);
      } else {
        axis = axisByLetter(input.charAt(1));
        axis.isReferencing = true;
        setMotorDirection(axis, CCW);
        setMotorEnabled(axis, true);
      }
    } else if (input == "?") { // debug info
      printDebugInfo();
    } else if (input.charAt(0) == '+') {
      axis = axisByLetter(input.charAt(1));
      setMotorDirection(axis,CW);
      axis.forceRotation = true;
      setMotorEnabled(axis,true);
    } else if (input.charAt(0) == '-') {
      axis = axisByLetter(input.charAt(1));
      setMotorDirection(axis,CCW);
      axis.forceRotation = true;
      setMotorEnabled(axis, true);
    }
  }

  handleAxis(axisX);
  handleAxis(axisY);
  handleAxis(axisA);
}

function printDebugInfo() {
  printDebugAxis(axisX);
  printDebugAxis(axisY);
  printDebugAxis(axisA);
}

function printDebugAxis(axis) {
  Serial.print("-Pos ");
  Serial.print(axis.name);
  Serial.print(": ");
  Serial.println(axis.position);
  
  Serial.print("-Dest ");
  Serial.print(axis.name);
  Serial.print(": ");
  Serial.println(axis.destination);
  
  Serial.print("-Speed ");
  Serial.print(axis.name);
  Serial.print(": ");
  Serial.println(axis.speed);

  Serial.print("-CW ");
  Serial.print(axis.name);
  Serial.print(": ");
  Serial.println(axis.isClockwise);
  
  Serial.print("-Referenced ");
  Serial.print(axis.name);
  Serial.print(": ");
  Serial.println(axis.isReferenced);
  
  Serial.print("-Referencing ");
  Serial.print(axis.name);
  Serial.print(": ");
  Serial.println(axis.isReferencing);
  
  Serial.print("-Enabled ");
  Serial.print(axis.name);
  Serial.print(": ");
  Serial.println(axis.isMotorEnabled);
  
  Serial.print("-Step ");
  Serial.print(axis.name);
  Serial.print(": ");
  Serial.println(axis.isStepHigh);

  Serial.print("-Force ");
  Serial.print(axis.name);
  Serial.print(": ");
  Serial.println(axis.forceRotation);

  Serial.print("-PIN enabled ");
  Serial.print(axis.name);
  Serial.print(": ");
  Serial.println(digitalRead(axis.enabledPin));
  
  Serial.print("-PIN dir ");
  Serial.print(axis.name);
  Serial.print(": ");
  Serial.println(digitalRead(axis.dirPin));
  
  Serial.print("-PIN step ");
  Serial.print(axis.name);
  Serial.print(": ");
  Serial.println(digitalRead(axis.stepPin));
  
  Serial.print("-PIN limit switch ");
  Serial.print(axis.name);
  Serial.print(": ");
  Serial.println(digitalRead(axis.limitSwitchPin));
}

function printAxis(axis) {
  Serial.print(axis.position);
  Serial.print(",");
  Serial.print(digitalRead(axis.limitSwitchPin));
}
