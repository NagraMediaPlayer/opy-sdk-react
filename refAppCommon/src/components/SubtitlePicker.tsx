// Copyright (c) 2020--2023 Nagravision SA. All rights reserved.
import React from 'react';
import CustomPicker from './common/CustomPicker';

// types to be updated
type SubtitlePickerProps = {
  textTracks: any;
  selectedTextTrack: number;
  focusedControl :any,
  setFocusedControl : any;
  focusOnEnter :any,
  setFocusOnEnter :any;
  onTextTrackChange: (index: string) => void;
};

const SubtitlePicker: React.FC<SubtitlePickerProps> = ({
  textTracks,
  selectedTextTrack,
  onTextTrackChange,
  focusedControl,
  setFocusedControl,
  focusOnEnter,
  setFocusOnEnter
}) => {
  const currentSelectedValue =
    selectedTextTrack === -1 ? 'Disabled' : textTracks[selectedTextTrack].title;
  return Boolean(textTracks && textTracks.length) ? (
      <CustomPicker
        data={textTracks}
        onSelect={onTextTrackChange}
        selected={currentSelectedValue}
        label = {'Select Subtitle'}
        extraData = {[{name: 'Disabled'}]}
        focusedControl ={focusedControl}
        setFocusedControl={setFocusedControl}
        focusOnEnter={focusOnEnter}
        setFocusOnEnter = {setFocusOnEnter}
      />
  ) : null;
};

export default SubtitlePicker;
