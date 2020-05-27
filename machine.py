from gpiozero import Button
from time import sleep

#button = Button(15,pull_up=True)
button = Button(15,pull_up=False)

while True:
    if button.is_pressed:
        print("Pressed")
    else:
        print("Released")
    sleep(1)
