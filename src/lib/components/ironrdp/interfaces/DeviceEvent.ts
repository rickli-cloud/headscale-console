// Copyright (c) Devolutions & contributors
// GitHub: Devolutions/IronRDP
// Source: https://github.com/Devolutions/IronRDP/blob/bdde2c76ded7315f7bc91d81a0909a1cb827d870/web-client/iron-remote-desktop/src/interfaces/DeviceEvent.ts

export interface DeviceEvent {
  mouse_button_pressed(button: number): DeviceEvent;
  mouse_button_released(button: number): DeviceEvent;
  mouse_move(x: number, y: number): DeviceEvent;
  wheel_rotations(vertical: boolean, rotation_units: number): DeviceEvent;
  key_pressed(scancode: number): DeviceEvent;
  key_released(scancode: number): DeviceEvent;
  unicode_pressed(unicode: string): DeviceEvent;
  unicode_released(unicode: string): DeviceEvent;
}
