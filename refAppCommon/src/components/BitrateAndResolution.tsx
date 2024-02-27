// Copyright (c) 2020--2023 Nagravision SA. All rights reserved.
import { View, Text} from 'react-native';
import React from 'react';
import videoStyles from '../assets/styles/videoStyles';

// types to be updated
type BitrateAndResolutionProps = {
  availableBitrates: any;
  availableResolution: any;
  maxBitrate: any;
  selectedBitrate: any;
  selectedResolution: any;
  currentResolution: any;
};

const BitrateAndResolution: React.FC<BitrateAndResolutionProps> = ({
  availableBitrates,
  availableResolution,
  maxBitrate,
  selectedBitrate,
  selectedResolution,
  currentResolution,
}) => {
  return (
    <View style={videoStyles.logsStyles}>
        <Text style={videoStyles.logTitle}>Bitrate and Resolution</Text>
        <Text style={videoStyles.logText}>
          {' '}
          Available Bitrates (kbps) :{' '}
          {availableBitrates &&
            availableBitrates.map((b: number, idx: number, arr: Array<number>) => b / 1000 + (idx < arr.length - 1 ? ', ' : ''))}
        </Text>
        <Text style={videoStyles.logText}>
          {' '}
          Selected Bitrate (kbps) : {' '}
            {maxBitrate && !isNaN(maxBitrate) ? maxBitrate / 1000
              : getDisplayableValue(maxBitrate)
            }
        </Text>
        <Text style={videoStyles.logText}>
          {' '}
          Current Playing Bitrate (kbps) : {selectedBitrate / 1000}
        </Text>
        <Text style={videoStyles.logText}>
          {' '}
          Resolutions list:{' '}
          {availableResolution &&
            availableResolution.map((b: any, idx: number, arr: Array<any>) => b.resolution + (idx < arr.length - 1 ? ', ' : ''))}
        </Text>

        <Text style={videoStyles.logText}>
          {' '}
          Selected Resolution :{' '}
          {selectedResolution ?
              getDisplayableValue(selectedResolution.width) +
              ' x ' +
              getDisplayableValue(selectedResolution.height)
            : 'Unknown'}
        </Text>

        <Text style={videoStyles.logText}>
          {' '}
          Current Playing Resolution : {currentResolution.width} x{' '}
          {currentResolution.height}
        </Text>
      </View>
  );
};

const getDisplayableValue = (value: any) => {
  let displayableValue = value;
  if (value === null) {
    return "null";
  } else if (value === undefined) {
      return "undefined";
  } else if (isNaN(value)) {
    displayableValue = "Unknown";
  }
  return displayableValue;
}


export default BitrateAndResolution;
