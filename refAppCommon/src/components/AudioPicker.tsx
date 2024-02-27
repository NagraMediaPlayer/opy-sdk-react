// Copyright (c) 2020--2023 Nagravision SA. All rights reserved.
import React from 'react';
import CustomPicker from './common/CustomPicker';

// types to be updated
type AudioPickerProps = {
  audioTracks: any;
  selectedAudio: number;
  onAudioChange: (index: string) => void;
  focusedControl :any,
  setFocusedControl : any;
  focusOnEnter :any,
  setFocusOnEnter :any;
};

const AudioPicker: React.FC<AudioPickerProps> = ({
  audioTracks,
  selectedAudio,
  onAudioChange,
  focusedControl,
  setFocusedControl,
  focusOnEnter,
  setFocusOnEnter
}) => {
  return Boolean(audioTracks && audioTracks.length) ? (
      <CustomPicker
        data={audioTracks}
        onSelect={onAudioChange}
        selected={audioTracks[selectedAudio].title}
        label = {'Select Audio'}
        focusedControl = {focusedControl}
        setFocusedControl={setFocusedControl}
        focusOnEnter={focusOnEnter}
        setFocusOnEnter = {setFocusOnEnter}
      />
  ) : null;
};

export default AudioPicker;