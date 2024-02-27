// Copyright (c) 2020--2023 Nagravision SA. All rights reserved.
import React from 'react';
import CustomPicker from './common/CustomPicker';

type VideoPickerProps = {
  setVideoContent: any;
  sourceList: any;
  selectedStream: any;
  focusedControl :any,
  setFocusedControl : any;
  focusOnEnter :any,
  setFocusOnEnter :any;
};

const VideoPicker: React.FC<VideoPickerProps> = ({
  setVideoContent,
  sourceList,
  selectedStream,
  focusedControl,
  setFocusedControl,
  focusOnEnter,
  setFocusOnEnter
}) => {
  return(
      <CustomPicker
        label={'Select Stream'}
        focusedControl = {focusedControl}
        setFocusedControl={setFocusedControl}
        data={sourceList}
        onSelect={setVideoContent}
        selected={selectedStream}
        focusOnEnter = {focusOnEnter}
        setFocusOnEnter = {setFocusOnEnter}
      />
);}

export default VideoPicker;
