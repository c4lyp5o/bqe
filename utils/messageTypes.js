const MESSAGE_TYPES = {
  IDENTIFY_NUMBER_CALLER: 'identifynumbercaller',
  IDENTIFY_TVQR_DISPLAY: 'identifytvqrdisplay',
  IDENTIFY_TVNUMBER_DISPLAY: 'identifytvnumberdisplay',
  IDENTIFY_PUBLIC: 'identifypublic',
  NUMBER_CALLER: 'numbercaller',
  LOGOUT_NUMBER_CALLER: 'logout-numbercaller',
  LOGOUT_TVNUMBER_DISPLAY: 'logout-tvnumberdisplay',
  SET_UUID: 'set-uuid',
  SET_FACILITY_ID: 'set-facility-id',
  ALREADY_CONNECTED: 'already-connected',
  NO_VALID_ID: 'no-valid-id',
  CURRENT_Q: 'currentq',
  OPEN_QUEUE_SCREEN: 'open-queue-screen',
  // ping
  PING_NUMBER_CALLER: 'ping-numbercaller',
  PING_TVNUMBER_DISPLAY: 'ping-tvnumberdisplay',
  PONG_NUMBER_CALLER: 'pong-numbercaller',
  PONG_TVNUMBER_DISPLAY: 'pong-tvnumberdisplay',
  KILLSWITCH: 'killswitch',
};

export default MESSAGE_TYPES;
