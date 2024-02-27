// Copyright (c) 2020--2023 Nagravision SA. All rights reserved.
import React from 'react';
import CustomPicker from './common/CustomPicker';

type ResolutionPickerProps = {
    resolutions: any[];
    selectedResolution: any;
    selectResolution: (index: any) => void;
    focusedControl :any,
    setFocusedControl : any;
    focusOnEnter :any,
    setFocusOnEnter :any;
};

const ResolutionPicker: React.FC<ResolutionPickerProps> = ({
    resolutions,
    selectedResolution,
    selectResolution,
    focusedControl,
    setFocusedControl,
    focusOnEnter,
    setFocusOnEnter
}) => {
    return Boolean(resolutions && resolutions.length) ? (
            <CustomPicker
              data={resolutions}
              onSelect={selectResolution}
              selected={selectedResolution}
              label = {'Select Resolution'}
              focusedControl={focusedControl}
              setFocusedControl={setFocusedControl}
              focusOnEnter={focusOnEnter}
              setFocusOnEnter = {setFocusOnEnter}
            />
        ) : null;
};

export default ResolutionPicker;
