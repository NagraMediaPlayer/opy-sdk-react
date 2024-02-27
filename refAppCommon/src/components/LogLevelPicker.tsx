// Copyright (c) 2020--2023 Nagravision SA. All rights reserved.
import { OTVSDK_LOGLEVEL } from '@nagra/react-otvplayer';
import React from 'react';
import CustomPicker from './common/CustomPicker';

enum LOG_PICKER_OFF {
    OFF = -1
}

type logState =  typeof OTVSDK_LOGLEVEL | LOG_PICKER_OFF

type LogLevelPickerProps = {
    levels: number[];
    selectedLevel: number;
    selectLogLevel: (index: number) => void;
    focusedControl :any,
    setFocusedControl : any;
    focusOnEnter :any,
    setFocusOnEnter :any;
};

const LogLevelPicker: React.FC<LogLevelPickerProps> = ({
    levels,
    selectedLevel,
    selectLogLevel,
    focusedControl,
    setFocusedControl,
    focusOnEnter,
    setFocusOnEnter
}) => (
    <CustomPicker
        label={'Select Log Level'}
        focusedControl = {focusedControl}
        setFocusedControl={setFocusedControl}
        data={levels && levels.map(level => {
            return { name: isValid(level) ? getLabel(level) : 'INVALID' };
        })}
        onSelect={selectLogLevel}
        selected={selectedLevel}
        focusOnEnter={focusOnEnter}
        setFocusOnEnter = {setFocusOnEnter}
    />
);

const isValid = (level: number) => {
    return !isNaN(level)
}

export const getLabel = (level: logState) => {
    switch (level) {
        case LOG_PICKER_OFF.OFF:
            return 'OFF';
        case OTVSDK_LOGLEVEL.ERROR:
            return 'ERROR';
        case OTVSDK_LOGLEVEL.WARNING:
            return 'WARNING';
        case OTVSDK_LOGLEVEL.INFO:
            return 'INFO';
        case OTVSDK_LOGLEVEL.DEBUG:
            return 'DEBUG';
        case OTVSDK_LOGLEVEL.VERBOSE:
            return 'VERBOSE';
        default:
            return 'INVALID';
    }
}

export default LogLevelPicker;
