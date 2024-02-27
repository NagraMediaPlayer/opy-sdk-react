// Copyright (c) 2020--2023 Nagravision SA. All rights reserved.
import React from 'react';
import CustomPicker from './common/CustomPicker';

type BitratePickerProps = {
    bitrates: number[];
    selectedBitrate: number;
    selectBitrate: (index: any) => void;
    focusedControl :any,
    setFocusedControl : any;
    focusOnEnter :any,
    setFocusOnEnter :any;
};

const BitratePicker: React.FC<BitratePickerProps> = ({
    bitrates,
    selectedBitrate,
    selectBitrate,
    focusedControl,
    setFocusedControl,
    focusOnEnter,
    setFocusOnEnter
}) => {
    return Boolean(bitrates && bitrates.length) ? (
        <CustomPicker
        data={bitrates}
        onSelect={selectBitrate}
        selected={selectedBitrate}
        label = {'Select Bitrate (kbps)'}
        focusedControl={focusedControl}
        setFocusedControl={setFocusedControl}
        focusOnEnter={focusOnEnter}
        setFocusOnEnter = {setFocusOnEnter}
        extraData = {[{name: 'null'}, {name: 'undefined'}]}
      />
  ) : null;
};

export default BitratePicker;
