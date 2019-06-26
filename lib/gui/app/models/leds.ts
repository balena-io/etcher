import { delay } from 'bluebird';
import { Gpio } from 'pigpio';

class Led {
	private gpio: Gpio;

	constructor(gpioNumber: number) {
		this.gpio = new Gpio(gpioNumber, { mode: Gpio.OUTPUT });
	}

	public set intensity(value: number) {
		// TODO: check that 0 <= value <= 1
		this.gpio.pwmWrite(Math.round(value * 255));
	}
}

export type Color = [number, number, number];
export type AnimationFunction = (t: number) => Color;

export class RGBLed {
	private leds: [Led, Led, Led];
	private currentAnimation?: AnimationFunction;
	private static animations: Map<string, AnimationFunction> = new Map();

	constructor(gpioNumbers: [number, number, number], public frequency = 60) {
		this.leds = gpioNumbers.map(n => new Led(n)) as [Led, Led, Led];
	}

	private async loop() {
		while (this.currentAnimation !== undefined) {
			this.$setColor(...this.currentAnimation(new Date().getTime()));
			await delay(1000 / this.frequency);
		}
	}

	private $setColor(red: number, green: number, blue: number) {
		this.leds[0].intensity = red;
		this.leds[1].intensity = green;
		this.leds[2].intensity = blue;
	}

	public setColor(red: number, green: number, blue: number) {
		// stop any running animation
		this.setAnimation();
		this.$setColor(red, green, blue);
	}

	public static registerAnimation(name: string, animation: AnimationFunction) {
		RGBLed.animations.set(name, animation);
	}

	public setAnimation(name?: string) {
		const hadAnimation = this.currentAnimation !== undefined;
		this.currentAnimation = name ? RGBLed.animations.get(name) : undefined;
		// Don't launch the loop a second time
		if (!hadAnimation) {
			this.loop();
		}
	}
}

RGBLed.registerAnimation('breathe-white', (t: number) => {
	const intensity = Math.sin(t / 1000);
	return [intensity, intensity, intensity];
});

RGBLed.registerAnimation('blink-white', (t: number) => {
	const intensity = Math.floor(t / 1000) % 2;
	return [intensity, intensity, intensity];
});
