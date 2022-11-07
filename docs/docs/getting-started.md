---
description: Getting started for etcherPro 
slug: /
---

# EtcherPro User manual

## 1. Features

![EtcherPro-manual-01](img/etcher-pro-top-view.jpeg)
![EtcherPro-manual-02](img/etcher-pro-slots.jpeg)
![EtcherPro-manual-03](img/etcher-pro-rear-view.jpeg)

| Specifications |  |
| --- | --- |
| Voltage in | 100 to 240 V AC - 10A -  50 to 60 Hz |
| Voltage out | 100 to 240 V AC - 10A -  50 to 60 Hz |
| Ports | 16 x USB 3.0, 16 X SD, 16 x mSD |
| Flashing capacity | 16 x targets when using an online image or, 15 x target drives and 1 x local source drive |
| Daisy-chaining | Up to 10 EtcherPro devices supported (160 x targets) |
| Language support | English |
| Software | balenaEtcher on balenaOS with auto-updates  |
| Display | 7in RGB touch screen |
| Network connectivity | WiFi 2.4GHz, 5GHz |
| Working temperature | 5°C ~ 30°C |
| Certifications | CE, FCC |

## 2. Getting started

### 2.1 Setup
### Powering up the device

- EtcherPro is supplied with a mains power cable according to your region's plug standards
- On the back of the device, there are two groups of sockets, labelled as **IN** and **OUT**
- Plug the AC power cable to the socket labelled **POWER IN**, and then to the mains outlet
- The device should boot up automatically; wait until you see the Etcher interface show up
- [Warning] Please avoid using adaptors or extension leads, as this may damage the device or cause it to malfunction

### Connecting to WiFi

- The device will prompt you to connect to a local network the first time it boots (you can skip this step if you are not connecting to WiFi)
- Select the network to which you want to connect, type the password and select **OK**
- You can access the WiFi settings by selecting the WiFi icon at the top left corner of the screen

### 2.2 Etcher functions

### Flash from file

Using an image file as source to flash to one or multiple targets

- From the Etcher menu, select **Flash from file**
- Plug a drive that contains the image you would like to flash into the slot with the blue-colored blinking LED
- Select the image you want to flash from the file browser and select **OK**
- Plug at least one drive or device into an available slot. The plugged target(s) will be selected automatically and the LEDs will turn white
- Select **Flash**, to begin the flashing process
- The LED of each slot will first blink purple for flashing and then green for validating
- Once the flashing is complete, the LEDs will turn green for successfully flashed drives, and red for the failed ones
- You may safely unplug the drives when flashing is complete

### Flash from URL

Using an online image file as source to flash to one or multiple targets

- From the Etcher menu, select **Flash from URL**
- Enter the image URL of you would like to flash in the input field, and select **OK**
- Plug at least one drive or device into an available slot. The plugged target(s) will be selected automatically, and the LEDs will turn white
- Select **Flash**, to begin the flashing process
- The LED of each slot will first blink purple for flashing and then green for validating
- Once the flashing is complete, the LEDs will turn green for successfully flashed drives, and red for the failed ones
- You may safely unplug the drives when flashing is complete

### Clone drive

Using a drive as source, and cloning it to multiple drives

- From the Etcher menu, select **Clone drive**
- Plug a drive you would like to clone into the slot with the blue-colored blinking LED
- The drive will be selected automatically and the LED will stop blinking
- Plug at least one drive into an available slot. The plugged targets will be selected automatically, and the LEDs will turn white
- Select **Flash**, to begin the flashing process
- The LED of each slot will first blink purple for flashing and then green for validating
- Once the flashing is complete, the LEDs will turn green for successfully flashed drives, and red for the failed ones
- You may safely unplug the drives when flashing is complete

### Backup drive

Backing up one or multiple drives into another drive

- From the Etcher menu, select **more options**, then **Backup drive**
- Plug one or more drives you would like to backup into the slot(s) with the blue-colored blinking LED
- The drives will be autoselected and the LED will stop blinking
- Select **OK** to move on to the next step
- Plug the backup drive into the slot with the white-colored blinking LED. The plugged target will be automatically selected and the LED will stop blinking
- Select **Flash**, to begin the flashing process
- The LED of the target slot will first blink purple for flashing, and then green for validating
- Once the flashing is complete, the LED will turn green for a successful flash, and red for a failed one
- You may safely unplug the drive when flashing is complete

### Format drive

Formatting one or multiple drives

- From the Etcher menu, select **more options**, then **Format drive**
- Plug one or more drives you would like to format on the slots with the white-colored blinking LEDs
- The drives will be selected automatically, and the LED will stop blinking
- Select **Flash**, to begin the flashing process
- The LED of the target slot will first blink purple for flashing, and then green for validating
- Once the formatting is complete, the LEDs will turn green for successfully formatted drives, and red for the failed ones
- You may safely unplug the drive when formatting is complete

### 2.3 Daisy-chaining (power only)

Connecting up to 10 EtcherPro devices and power them from one socket.

- EtcherPro allows you to chain power (data chaining will be released later). To do this, you will need a male to female IEC C13/C14 power extension lead (min 10A rated) to connect one EtcherPro to another
- Plug the power extension lead to the 'POWER IN' side of the leading EtcherPro, and then to the 'POWER OUT' side of the successive EtcherPro
- The last EtcherPro of the stack should be plugged directly to the mains power socket

### 2.4 Sleep, wake and power off

- EtcherPro is set to automatically go into sleep mode after a few minutes
- You may change this setting by selecting the settings icon on the top right corner of the screen
- You may put the device to sleep manually by selecting the sleep button on the top left corner of the screen
- To wake up your device, just tap anywhere on the screen
- It is not necessary to power off your device, but if you would like to, you may simply unplug the power-in cable

### 3. Safety and handling

WARNING: Make sure you read and follow the safety and handling instructions before using EtcherPro in order to avoid the potential risk of causing damage to the device, electrical shock, fire, or damage to any other property. If EtcherPro gets physically damaged in any way, or you suspect liquid has leaked into the enclosure, unplug the power cable from the socket and avoid using the device before contacting support (pro@etcher.io).
Handling
It is important not to block the air vents on the back and bottom of the device. As such, we suggest setting up EtcherPro on a well supported desk, with plenty of surrounding space to ensure the device is properly ventilated while in use.
Liquid exposure
EtcherPro’s enclosure is not waterproof. It is important to keep liquids away from the device to avoid spillages. High humidity environments, rain or snow may also cause damage to the device.
Power
EtcherPro does not have an on/off switch. If you would like to power on the device, you need to plug the power cable into the mains socket. If you would like to power off the device, you need to unplug the power cable. Be sure to unplug the power cable from the socket if you suspect either the cable or the device is physically damaged in some way.

For your own protection and protection of the device, EtcherPro comes with a grounded AC power cable which only fits a grounded mains socket. If you don’t have a grounded socket installed, you should contact a specialist who can safely install an appropriate grounded socket. Do not attempt to power on the device without a connected grounding wire or with a power cable that does not meet the original specifications.
Repairing
EtcherPro is not meant to be serviced or repaired by the user. If your device has any issues you should contact support (pro@etcher.io). Attempting to disassemble the device will void the warranty, and could also cause injury or harm.
Radio interference
EtcherPro contains components and radios that emit electromagnetic fields. These electromagnetic fields may interfere with medical devices, such as pacemakers and defibrillators. Consult your physician and medical device manufacturer for information specific to your medical device and whether you need to maintain a safe distance of separation between your medical device(s) and EtcherPro. If you suspect EtcherPro is interfering with your medical device, stop using EtcherPro immediately.

EtcherPro emits electromagnetic fields due to the usage of components and radios. These fields can interfere with other devices and potentially cause them to malfunction. If you suspect EtcherPro is interfering with another device, unplug EtcherPro from the power and contact support (pro@etcher.io).

This equipment is not suitable for use in locations where children are likely to be present.

Atmospheric conditions (dust and vapor)
The EtcherPro enclosure is not sealed. Using the device in an environment that has increased amounts of dust, powder, vapors, corrosive substances, or other contaminants can cause malfunction, injury, and/or fire.

### 4. Warranty

**Limited Product Warranty**
Balena warrants that, for a period of one (1) year after the date of shipment, the Products will be free from defects in materials and workmanship under normal use.  As Balena’s sole liability and Customer’s sole and exclusive remedy for any breach of the limited warranty set forth herein, Balena will, at its option and expense, repair or replace any Product returned to Customer during the warranty period that does not comply with such warranty, as confirmed by Balena.  Replacement Products will be warranted for the remainder of the original warranty period or ninety (90) days, whichever is longer. All Products that are replaced become the property of Balena. Balena will have no obligation to the extent that any failure of a Product to comply with the limited warranty set forth in this limited product warranty results from or is otherwise attributable to: (i) negligence, misuse, or abuse of the Product; (ii) use of the Product other than in accordance with Balena’s published specifications or user manual; (iii) modifications, alterations or repairs to the Product made by a party other than Balena or a party authorized by Balena; (iv) any failure by Customer or a third party to comply with environmental and storage requirements for the Product specified by Balena, including, but not limited to, temperature or humidity ranges; or (v) use of the Product in combination with any third-party devices or products that have not been provided or recommended by Balena. The parties agree that Balena’s RMA Policy shall apply to Products returned pursuant to this limited product warranty for a breach of warranty.

THE LIMITED WARRANTY SET FORTH HEREIN IS IN LIEU OF, AND BALENA SPECIFICALLY DISCLAIMS, ANY AND ALL OTHER WARRANTIES AND CONDITIONS, WHETHER EXPRESS, IMPLIED OR STATUTORY, INCLUDING, BUT NOT LIMITED TO, ANY IMPLIED WARRANTIES OR CONDITIONS OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE OR NON-INFRINGEMENT, AND ANY WARRANTIES ARISING OUT OF COURSE OF DEALING OR USAGE OF TRADE.  NO ADVICE OR INFORMATION, WHETHER ORAL OR WRITTEN, OBTAINED FROM BALENA OR ELSEWHERE, WILL CREATE ANY WARRANTY NOT EXPRESSLY STATED IN THESE TERMS.

The limited warranty does not apply to:

- Returned items that failed due to an accident, purchaser’s abuse, neglect or failure to operate in accordance with instructions provided in this refund policy.
- Returned items that failed due to incorrect voltage or improper wiring.
- Returned items that failed due to rain, excessive humidity, corrosive environments, or other contaminants.
- Any item damaged in shipment.
- Any product failure caused by installing or operating product under conditions not in accordance with installation and operation guidelines, or damaged by contact with tools or surroundings.
- Returned items with cosmetic defects that do not interfere with product functionality.
- Returned items that are incomplete or defaced.
- Returned items with a different serial number from what was authorized for return.
- Freight damaged items. If your shipment arrives damaged, you must note the damage on the carrier's delivery record in accordance with the carrier's policy, save the merchandise in the original box and packing it arrived in, and arrange for a carrier inspection of damaged merchandise.

**Initiating a warranty claim**
To initiate a warranty claim, please contact support (pro@etcher.io) to receive a copy of the RMA form. When filling the form, make sure you describe the issue as accurately as possible since it will be used as a basis for determining if the warranty claim is valid or not.

After Balena’s evaluation of the return item, Warranty or Out-of-Warranty status will be determined. If the description of the problem is the same as listed on Page 1 of the RMA form, the product will be repaired or replaced under warranty at no charge and shipped back, prepaid, to the customer.

If the description of the problem is different from the problem listed on Page 1 of the RMA form we will contact the customer. At such time, the customer must issue a written confirmation to proceed with the repair(s), agree to cover the costs of the repair and return freight, or authorize the product to be shipped back as is, at the customer’s expense. Failure to obtain written confirmation within thirty (30) days of notification will result in the product being returned as is, at the customer’s expense.

If the product has no identifiable problem, we reserve the right to charge for testing and return shipping costs.

For any product returned to balena for reasons other than warranty, a 20% restocking fee and round-trip shipping costs will be deducted from the credit refund. All returned items must be in their original box or crating and must include all packing material, manuals, and accessories.
