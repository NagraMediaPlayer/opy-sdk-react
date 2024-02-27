// Copyright (c) 2020--2023 Nagravision SA. All rights reserved.
import React from 'react';
import CustomPicker from './common/CustomPicker';

// types to be updated
type ServerPickerProps = {
  serverList: any;
  selectedServer: number;
  onSelect: (index: number) => void;
};

const ServerPicker: React.FC<ServerPickerProps> = ({
  serverList,
  selectedServer,
  onSelect,
}) => {
  return Boolean(serverList && serverList.length) ? (
    <CustomPicker
      data={serverList}
      onSelect={onSelect}
      selected={selectedServer}
      label={'Select Server'}
    />
  ) : null;
};

export default ServerPicker;
