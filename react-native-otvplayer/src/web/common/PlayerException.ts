// Copyright (c) 2020--2023 Nagravision SA. All rights reserved.
export default class PlayerException {
  message: string;
  name: string;
  constructor(message: string) {
    this.message = message;
    this.name = "OTVPlayer Exception";
  }
}
