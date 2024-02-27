// Copyright (c) 2020--2023 Nagravision SA. All rights reserved.
import { View, Text, ScrollView, Pressable } from 'react-native';
import React from 'react';
import videoStyles from '../assets/styles/videoStyles';

// types to be updated
type StatisticsLoggingProps = {
  statisticsData: any;
};

function renderValue(name: string, value: any) {
  if (name === 'Resolution') {
    return value.resolutionWidth !== null &&
      value.resolutionWidth !== undefined ? (
      <Text style={{ color: '#ffffff', paddingLeft: 10, paddingTop: 10 }}>
        {name}: {value.resolutionWidth}x{value.resolutionHeight}
      </Text>
    ) : null;
  }
  return value !== null && value !== undefined ? (
    <Text style={{ color: '#ffffff', paddingLeft: 10, paddingTop: 10 }}>
      {name}: {value}
    </Text>
  ) : null;
}

const StatisticsLogging: React.FC<StatisticsLoggingProps> = ({
  statisticsData
}) => {
  return statisticsData ? (
    <View style={videoStyles.logsStyles}>
      <Text style={videoStyles.logTitle}>Statistics</Text>
      <ScrollView>
        <Pressable>
          {renderValue('URL', statisticsData.network.contentServer.url)}
          {renderValue('Final URL', statisticsData.network.contentServer.finalURL,)}
          {renderValue('Final IP Address:', statisticsData.network.contentServer.finalIPAddress,)}
          {renderValue('Number Of ServerAddressChanges:', statisticsData.network.contentServer.numberOfServerAddressChanges,)}
          {renderValue('Available Bitrates:', JSON.stringify(statisticsData.network.adaptiveStreaming.availableBitrates,),)}
          {renderValue('Selected Bitrate:', statisticsData.network.adaptiveStreaming.selectedBitrate,)}
          {renderValue('Bitrate Switches', statisticsData.network.adaptiveStreaming.bitrateSwitches,)}
          {renderValue('Bitrate Downgrade', statisticsData.network.adaptiveStreaming.bitrateDowngrade,)}
          {renderValue('Average Bitrate', statisticsData.network.adaptiveStreaming.averageBitrate,)}
          {renderValue('Average Video Bitrate', statisticsData.network.adaptiveStreaming.averageVideoBitrate,)}
          {renderValue('Average Audio Bitrate', statisticsData.network.adaptiveStreaming.averageAudioBitrate,)}
          {renderValue('Download Bitrate', statisticsData.network.networkUsage.downloadBitrate,)}
          {renderValue('Average Download Bitrate', statisticsData.network.networkUsage.downloadBitrateAverage,)}
          {renderValue('Bytes Downloaded', statisticsData.network.networkUsage.bytesDownloaded,)}
          {renderValue('Number Of MediaRequests', statisticsData.network.networkUsage.numberOfMediaRequests,)}
          {renderValue('Transfer Duration', statisticsData.network.networkUsage.transferDuration,)}
          {renderValue('Downloads Overdue', statisticsData.network.networkUsage.downloadsOverdue,)}
          {renderValue('Buffered Duration', statisticsData.playback.bufferedDuration,)}
          {renderValue('Resolution', statisticsData.playback.selectedResolution)}
          {renderValue('availableResoloutions', JSON.stringify(statisticsData.playback.availableResoloutions,),)}
          {renderValue('startUpTime', statisticsData.playback.startUpTime,)}
          {renderValue('playbackStartDate', statisticsData.playback.playbackStartDate,)}
          {renderValue('Number Of Stalls', statisticsData.playback.numberOfStalls,)}
          {renderValue('PlaybackType', statisticsData.playback.playbackType,)}
          {renderValue('Playback StartOffset', statisticsData.playback.playbackStartOffset,)}
          {renderValue('Frame Drops', statisticsData.rendering.frameDrops,)}
          {renderValue('Frame Drops/s', statisticsData.rendering.frameDropsPerSecond,)}
          {renderValue('Frames/s', statisticsData.rendering.framesPerSecond,)}
          {renderValue('Frames/s Nominal', statisticsData.rendering.framesPerSecondNominal,)}
        </Pressable>
      </ScrollView>
    </View>
  ) : <View style={videoStyles.logsStyles}>
    <Text style={videoStyles.logTitle}>Statistics</Text>
    <Text style={{ color: 'white', textAlign: 'center', marginTop: 10 }}>No data available</Text>
  </View>
};



export default StatisticsLogging;