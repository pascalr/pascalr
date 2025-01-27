#! /usr/bin/env python3
#2019_10_11
"""
Read all GPIO
"""
import sys, os, time
import pigpio

MODES=["IN", "OUT", "ALT5", "ALT4", "ALT0", "ALT1", "ALT2", "ALT3"]
HEADER = ('3.3v', '5v', 2, '5v', 3, 'GND', 4, 14, 'GND', 15, 17, 18, 27, 'GND', 22, 23, '3.3v', 24, 10, 'GND', 9, 25, 11, 8, 'GND', 7, 0, 1, 5, 'GND', 6, 12, 13, 'GND', 19, 16, 26, 20, 'GND', 21)
GPIOPINS = 40

FUNCTION = {
'Pull': ('High', 'High', 'High', 'High', 'High', 'High', 'High', 'High', 'High', 'Low', 'Low', 'Low', 'Low', 'Low', 'Low', 'Low', 'Low', 'Low', 'Low', 'Low', 'Low', 'Low', 'Low', 'Low', 'Low', 'Low', 'Low', 'Low'),
'ALT0': ('SDA0', 'SCL0', 'SDA1', 'SCL1', 'GPCLK0', 'GPCLK1', 'GPCLK2', 'SPI0_CE1_N', 'SPI0_CE0_N', 'SPI0_MISO', 'SPI0_MOSI', 'SPI0_SCLK', 'PWM0', 'PWM1', 'TXD0', 'RXD0', 'FL0', 'FL1', 'PCM_CLK', 'PCM_FS', 'PCM_DIN', 'PCM_DOUT', 'SD0_CLK', 'SD0_XMD', 'SD0_DATO', 'SD0_DAT1', 'SD0_DAT2', 'SD0_DAT3'),
'ALT1': ('SA5', 'SA4', 'SA3', 'SA2', 'SA1', 'SAO', 'SOE_N', 'SWE_N', 'SDO', 'SD1', 'SD2', 'SD3', 'SD4', 'SD5', 'SD6', 'SD7', 'SD8', 'SD9', 'SD10', 'SD11', 'SD12', 'SD13', 'SD14', 'SD15', 'SD16', 'SD17', 'TE0', 'TE1'),
'ALT2': ('PCLK', 'DE', 'LCD_VSYNC', 'LCD_HSYNC', 'DPI_D0', 'DPI_D1', 'DPI_D2', 'DPI_D3', 'DPI_D4', 'DPI_D5', 'DPI_D6', 'DPI_D7', 'DPI_D8', 'DPI_D9', 'DPI_D10', 'DPI_D11', 'DPI_D12', 'DPI_D13', 'DPI_D14', 'DPI_D15', 'DPI_D16', 'DPI_D17', 'DPI_D18', 'DPI_D19', 'DPI_D20', 'DPI_D21', 'DPI_D22', 'DPI_D23'),
'ALT3': ('SPI3_CE0_N', 'SPI3_MISO', 'SPI3_MOSI', 'SPI3_SCLK', 'SPI4_CE0_N', 'SPI4_MISO', 'SPI4_MOSI', 'SPI4_SCLK', '_', '_', '_', '_', 'SPI5_CE0_N', 'SPI5_MISO', 'SPI5_MOSI', 'SPI5_SCLK', 'CTS0', 'RTS0', 'SPI6_CE0_N', 'SPI6_MISO', 'SPI6_MOSI', 'SPI6_SCLK', 'SD1_CLK', 'SD1_CMD', 'SD1_DAT0', 'SD1_DAT1', 'SD1_DAT2', 'SD1_DAT3'),
'ALT4': ('TXD2', 'RXD2', 'CTS2', 'RTS2', 'TXD3', 'RXD3', 'CTS3', 'RTS3', 'TXD4', 'RXD4', 'CTS4', 'RTS4', 'TXD5', 'RXD5', 'CTS5', 'RTS5', 'SPI1_CE2_N', 'SPI1_CE1_N', 'SPI1_CE0_N', 'SPI1_MISO', 'SPIl_MOSI', 'SPI1_SCLK', 'ARM_TRST', 'ARM_RTCK', 'ARM_TDO', 'ARM_TCK', 'ARM_TDI', 'ARM_TMS'),
'ALT5': ('SDA6', 'SCL6', 'SDA3', 'SCL3', 'SDA3', 'SCL3', 'SDA4', 'SCL4', 'SDA4', 'SCL4', 'SDA5', 'SCL5', 'SDA5', 'SCL5', 'TXD1', 'RXD1', 'CTS1', 'RTS1', 'PWM0', 'PWM1', 'GPCLK0', 'GPCLK1', 'SDA6', 'SCL6', 'SPI3_CE1_N', 'SPI4_CE1_N', 'SPI5_CE1_N', 'SPI6_CE1_N')
}

def pin_state(g):
    mode = pi.get_mode(g)
    if(mode<2):
        name = 'GPIO{}'.format(g)
    else:
        name = FUNCTION[MODES[mode]][g]
    return name, MODES[mode], pi.read(g)

if len(sys.argv) > 1:
    pi = pigpio.pi(sys.argv[1])
else:
    pi = pigpio.pi()

if not pi.connected:
    sys.exit(1)
rev = pi.get_hardware_revision()
if rev < 16 :
    GPIOPINS = 26

print('+-----+------------+------+---+----++----+---+------+-----------+-----+')
print('| BCM |    Name    | Mode | V |  Board   | V | Mode | Name      | BCM |')
print('+-----+------------+------+---+----++----+---+------+-----------+-----+')
for h in range(1, GPIOPINS, 2):
# odd pin
    hh = HEADER[h-1]
    if(type(hh)==type(1)):
        print('|{0:4} | {1[0]:<10} | {1[1]:<4} | {1[2]} |{2:3} '.format(hh, pin_state(hh), h), end = "|| ")
    else:
        print('|     |  {:18}   | {:2}'.format(hh, h), end=' || ')
# even pin
    hh = HEADER[h]
    if(type(hh)==type(1)):
        print('{0:2} | {1[2]:<2}| {1[1]:<5}| {1[0]:<10}|{2:4} |'.format(h+1, pin_state(hh), hh))
    else:
        print('{:2} |             {:9}|     |'.format(h+1, hh))
print('+-----+------------+------+---+----++----+---+------+-----------+-----+')
print('| BCM |    Name    | Mode | V |  Board   | V | Mode | Name      | BCM |')
print('+-----+------------+------+---+----++----+---+------+-----------+-----+')
