import * as XInput from 'xinput-ffi';

(async function() {
  try {
    // XInput-Device 0 (erstes Gamepad) abfragen
    const info = await XInput.getBatteryInformation(0);
    console.log('[SINGLE XINPUT]', info);
  } catch (err) {
    console.error('[XINPUT ERROR]', err);
  }
})();