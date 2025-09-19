# 🎮⚡ Arduino Gaming Hardware Setup Guide

This guide explains how to set up physical hardware for the Revenue MUD gaming system.

## 📦 Required Components

### Arduino Uno/Nano
- **Arduino Uno R3** or **Arduino Nano** (preferred for compact builds)
- **USB cable** for programming and communication

### LED Effects
- **WS2812B LED Strip** (16 LEDs minimum, 60 LEDs maximum)
- **470Ω resistor** for LED data line protection
- **1000µF capacitor** for power filtering (optional but recommended)

### Servo Control
- **SG90 Micro Servo** (9g servo for lightweight applications)
- **External 5V power supply** (servos can draw significant current)

### Audio Feedback
- **Passive buzzer** (for tones and sound effects)
- **100Ω resistor** for buzzer protection

### Input Controls
- **Tactile push button** (for emergency stop)
- **10kΩ pull-up resistor** for button
- **10kΩ potentiometer** (optional, for manual intensity control)

### Power Supply
- **5V 3A DC adapter** (for powering LED strips and servos)
- **DC barrel jack** or **terminal blocks**
- **Breadboard jumper wires**

## 🔌 Wiring Diagram

```
Arduino Uno Connections:
=====================

Digital Pins:
• Pin 2  → Emergency Button (with 10kΩ pullup to 5V)
• Pin 6  → LED Data (WS2812B) + 470Ω resistor
• Pin 8  → Buzzer + 100Ω resistor
• Pin 9  → Servo Signal (orange/yellow wire)

Analog Pins:
• Pin A0 → Potentiometer wiper (optional)

Power Connections:
• 5V     → LED Strip 5V + Servo 5V (via external power)
• GND    → All ground connections (LED, Servo, Button)
```

### Detailed Wiring

#### WS2812B LED Strip
```
Arduino Pin 6 → [470Ω Resistor] → LED Data Input
5V Power      → LED 5V+ (RED wire)
Ground        → LED GND (WHITE/BLACK wire)
```

#### SG90 Servo
```
Arduino Pin 9 → Servo Signal (ORANGE/YELLOW wire)  
5V Power      → Servo 5V+ (RED wire)
Ground        → Servo GND (BROWN/BLACK wire)
```

#### Emergency Button
```
Arduino Pin 2 → Button Pin 1
5V            → [10kΩ Resistor] → Button Pin 1 (pullup)
Ground        → Button Pin 2
```

#### Buzzer
```
Arduino Pin 8 → [100Ω Resistor] → Buzzer +
Ground        → Buzzer -
```

## 💻 Arduino IDE Setup

### 1. Install Required Libraries
Open Arduino IDE and install these libraries via Library Manager:

```cpp
// Required libraries:
#include <FastLED.h>        // LED control
#include <Servo.h>          // Servo control  
#include <ArduinoJson.h>    // JSON parsing
```

Install via **Tools → Manage Libraries**:
- Search "FastLED" by Daniel Garcia
- Search "ArduinoJson" by Benoit Blanchon
- Servo library is built-in

### 2. Board Configuration
- **Board**: Arduino Uno (or Arduino Nano if using Nano)
- **Port**: Select appropriate COM port (Windows) or /dev/ttyUSB* (Linux/Mac)
- **Programmer**: AVRISP mkII

### 3. Upload Firmware
1. Open `arduino-gaming-firmware.ino`
2. Connect Arduino via USB
3. Click **Upload** button
4. Monitor Serial output at 9600 baud

## 🎮 Node.js Integration Setup

### 1. Install Required Packages
```bash
npm install robotjs serialport johnny-five
```

**Note**: RobotJS requires native compilation:
- **Windows**: Install Visual Studio Build Tools
- **macOS**: Install Xcode Command Line Tools  
- **Linux**: Install build-essential

### 2. Hardware Permissions (Linux/macOS)
```bash
# Add user to dialout group for serial access
sudo usermod -a -G dialout $USER

# Set udev rules for Arduino (Linux)
echo 'SUBSYSTEM=="tty", ATTRS{idVendor}=="2341", MODE="0666"' | sudo tee /etc/udev/rules.d/99-arduino.rules

# Reload udev rules
sudo udevadm control --reload-rules
```

### 3. Test Connection
```bash
node -e "
const HardwareOrchestrator = require('./hardware-orchestrator.js');
const hw = new HardwareOrchestrator();
setTimeout(() => {
    hw.executePhysicalAction('arduino_command', {
        deviceId: 'arduino_*',
        command: 'LED_PULSE',
        commandParams: { color: 'blue', intensity: 255 }
    });
}, 3000);
"
```

## 🏗️ Physical Build Suggestions

### Enclosure Design
```
Recommended Case Dimensions: 15cm x 10cm x 5cm

Layout:
┌─────────────────────────────────┐
│  [Arduino]     [Power Jack]     │
│                                 │  
│  ●●●●●●●●●●●●●●●●  [Button]    │ ← LED Strip
│                                 │
│  [Servo Mount]  [Buzzer]        │
└─────────────────────────────────┘
```

### 3D Printed Parts (Optional)
- **Servo horn extensions** for physical dials/indicators
- **LED diffuser strips** for even light distribution  
- **Button caps** with gaming-themed designs
- **Mounting brackets** for secure installation

### Professional PCB Design (Advanced)
Use KiCad to design custom PCB with:
- Arduino Nano socket
- LED driver circuits  
- Servo power management
- Audio amplifier
- Multiple input buttons
- Status indicator LEDs

## ⚡ Advanced Hardware Additions

### 1. Vibration Motors
```cpp
// Add tactile feedback
#define VIBRATION_PIN 10
pinMode(VIBRATION_PIN, OUTPUT);

// In handleVibrate():
analogWrite(VIBRATION_PIN, intensity);
delay(duration);
analogWrite(VIBRATION_PIN, 0);
```

### 2. RGB LED Matrix (8x8)
```cpp
#include <LedControl.h>
#define MATRIX_DIN 12
#define MATRIX_CS 11  
#define MATRIX_CLK 10

LedControl matrix = LedControl(MATRIX_DIN, MATRIX_CLK, MATRIX_CS, 1);

// Display boss health as pixel art
```

### 3. Rotary Encoders
```cpp
// For sonar direction control
#define ENCODER_A 3
#define ENCODER_B 4

volatile int encoderPos = 0;

void encoderISR() {
    if (digitalRead(ENCODER_A) == digitalRead(ENCODER_B)) {
        encoderPos++;
    } else {
        encoderPos--;
    }
}
```

### 4. Temperature Sensor
```cpp
// Add environmental effects
#include <DHT.h>
#define DHT_PIN 7
#define DHT_TYPE DHT22

DHT dht(DHT_PIN, DHT_TYPE);

// Read temperature for boss battle intensity
float temp = dht.readTemperature();
```

## 🔧 Troubleshooting

### Common Issues

**"Port not found" Error**
```bash
# Check available ports
ls /dev/tty*    # Linux/macOS
# Look for /dev/ttyUSB* or /dev/ttyACM*
```

**LEDs not working**
- Check 5V power connection (LEDs need external power for >10 LEDs)
- Verify data wire connection and 470Ω resistor
- Test with single LED first

**Servo jittery**
- Use external 5V power supply (Arduino 5V insufficient)
- Add large capacitor (1000µF) across servo power  
- Check servo signal wire connection

**Commands not received**
- Verify baud rate (9600)
- Check JSON format in serial monitor
- Ensure newline character termination

### Debug Commands
```bash
# Test serial connection
echo '{"command":"PING"}' > /dev/ttyUSB0

# Monitor Arduino output  
screen /dev/ttyUSB0 9600

# Test LED pattern
echo '{"command":"LED_PULSE","params":{"color":"red","intensity":255}}' > /dev/ttyUSB0
```

## 🎯 Integration Testing

### Full System Test
```javascript
// test-hardware-integration.js
const HardwareOrchestrator = require('./hardware-orchestrator.js');
const hw = new HardwareOrchestrator();

async function testSequence() {
    console.log('🧪 Starting hardware test sequence...');
    
    // Test 1: Basic LED
    await hw.executePhysicalAction('arduino_command', {
        deviceId: 'arduino_*',
        command: 'LED_PULSE',
        commandParams: { color: 'green', intensity: 200 }
    });
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Test 2: Servo movement  
    await hw.executePhysicalAction('arduino_command', {
        deviceId: 'arduino_*', 
        command: 'SERVO_MOVE',
        commandParams: { angle: 45, duration: 1000 }
    });
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Test 3: Boss battle effect
    await hw.executePhysicalAction('boss_battle_effect', {
        effectType: 'spawn',
        boss: { name: 'Test Boss', health: 100, maxHealth: 100 },
        intensity: 1.0
    });
    
    console.log('✅ Hardware test completed!');
}

testSequence().catch(console.error);
```

This creates a complete physical hardware system that bridges the digital game world with real, controllable hardware! 🎮⚡