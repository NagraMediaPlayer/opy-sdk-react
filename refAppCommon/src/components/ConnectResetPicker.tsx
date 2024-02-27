// Copyright (c) 2020--2023 Nagravision SA. All rights reserved.
import React from 'react';
import CustomPicker from './common/CustomPicker';

type ConnectResetPickerProps = {
    setConnectResetType: any;
    resetTypes: string[];
    selectedResetType: string;
    focusOnEnter:string;
};

const ConnectResetPicker: React.FC<ConnectResetPickerProps> = ({
    setConnectResetType,
    resetTypes,
    selectedResetType,
    focusedControl,
    setFocusedControl,
    focusOnEnter,
    setFocusOnEnter
}) => (
    <CustomPicker
        label={ 'Select Connect Reset Type'}
        focusedControl = {focusedControl}
        setFocusedControl={setFocusedControl}
        data={resetTypes.map((type) => { return { name: type }; })}
        onSelect={setConnectResetType}
        selected={selectedResetType}
        focusOnEnter={focusOnEnter}
        setFocusOnEnter = {setFocusOnEnter}
    />
);

export default ConnectResetPicker;