// Copyright (c) 2020--2023 Nagravision SA. All rights reserved.
import { OTVSDK_LOGLEVEL } from "./common/enums";

let LoggerInstance = null;

export class Logger {
  public currentLogLevel: OTVSDK_LOGLEVEL;

  constructor() {
    if (LoggerInstance) {
      return LoggerInstance;
    }
    LoggerInstance = this;
    this.currentLogLevel = OTVSDK_LOGLEVEL.WARNING;
  }

  /**
   * @function
   * @summary logging the messages
   * @param {number} level
   * @param {array} logs
   */
  public log = (level: OTVSDK_LOGLEVEL, ...logs) => {
    let currentDateTime: string = "[" + new Date().toUTCString() + "] ";
    if (level <= this.currentLogLevel) {
      switch (level) {
        case OTVSDK_LOGLEVEL.ERROR:
          console.error(currentDateTime + " " + logs.join(" "));
          break;
        case OTVSDK_LOGLEVEL.WARNING:
          console.warn(currentDateTime + " " + logs.join(" "));
          break;
        case OTVSDK_LOGLEVEL.INFO:
          console.info(currentDateTime + " " + logs.join(" "));
          break;
        case OTVSDK_LOGLEVEL.DEBUG:
        case OTVSDK_LOGLEVEL.VERBOSE:
          console.log(currentDateTime + " " + logs.join(" "));
          break;
        default:
          console.warn(
            "Invalid OTVSDK_LOGLEVEL (" + "level" + ") requested for logging"
          );
      }
    }
  };
}
