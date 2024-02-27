import React from 'react';
import CustomPicker from './common/CustomPicker';

// types to be updated
type PreferredAudioPickerProps = {
    preferredAudioTracks: any;
    selectedPreferredAudio: number;
    onPreferredAudioChange: any;
    focusedControl :any,
    setFocusedControl : any;
    focusOnEnter :any,
    setFocusOnEnter :any;
};

const PreferredAudioPicker: React.FC<PreferredAudioPickerProps> = ({
    preferredAudioTracks,
    selectedPreferredAudio,
    onPreferredAudioChange,
    focusedControl,
    setFocusedControl,
    focusOnEnter,
    setFocusOnEnter
}) => {
    return Boolean(preferredAudioTracks && preferredAudioTracks.length) ? (
        <CustomPicker
            data={preferredAudioTracks.map((track) => { return { name: track.title }; })}
            onSelect={onPreferredAudioChange}
            selected={selectedPreferredAudio}
            label={'Select Preferred Audio'}
            focusedControl={focusedControl}
            setFocusedControl={setFocusedControl}
            focusOnEnter={focusOnEnter}
            setFocusOnEnter = {setFocusOnEnter}
        />
    ) : null;
};

export default PreferredAudioPicker;
