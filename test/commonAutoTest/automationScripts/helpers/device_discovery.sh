#!/bin/bash

# Discover xOS devices.
#
# This script uses two system tools - system_profiler and instruments to
# discover iOS and tvOS devices.
# The results are placed in this directory in a connected_devices.txt file.
#   - The list of connected devices is placed in connected_devices.txt. Each
#     line represents one device with UDID, type (iPad/iPhone), iOS version,
#     model and device name.
#   - The -p <platform> specifies whether to search for iOS or tvOS devices.
#   - This shell file must be executed in a separate bash process (i.e. it
#     cannot be 'source'd).
#
# This script does not take parameters, but assumes some shell variables are
# set. No 'export' is required, as the script expects to be 'source'd.
# The script also assumes it is executed from its own directory
#
# The following parameters are expected to be set.
# SCRIPT_PATH -            the directory in which this script resides
# PLATFORM -               the platform to test on ('iOS' or 'tvOS')
# CONNECTED_DEVICES_LIST - the path of the discovery ouput file

##############################################################

function display_help(){
  echo -e "\033[1mUSAGE:\033[0m"
  echo "  source device_discovery.sh [-h] [-p <platform>]"
  echo
  echo "Discover connected devices (results placed in "$SCRIPT_PATH"/connected_devices.txt"
  echo
  echo -e "\033[1mOptions\033[0m"
  echo "[-h] : Show this help"
  echo
  echo "[-p <platform>] : Specify iOS or tvOS  (default: iOS)"
  echo
}

# echo -e "\033[1mdevice_discovery.sh:\033[0m"

if [ "$SCRIPT_PATH" = "" ]; then
  echo -e "\033[1;31m    error: SCRIPT_PATH not defined.\033[0m" >&2
  return 10
fi

# Parse argument for platform (not recommended to use here.)
while [[ "$#" > 0 ]];
do
  case $1 in
    -p) PLATFORM=$2; shift ;;
    -h) display_help; return 11 ;;
    *)  display_help; return 12 ;;
  esac; shift;
done


# echo "Connected devices at: $CONNECTED_DEVICES_LIST"
# echo "Script path: "$SCRIPT_PATH
# echo "Platform: "$PLATFORM

shopt -s nocasematch
if [[ $PLATFORM == "tvOS" ]]; then
  PLATFORM_NAME=appletvos
  REQUIRED_DEVICE=AppleTV
elif [[ $PLATFORM == "iOS" ]]; then
  PLATFORM_NAME=iphoneos
  REQUIRED_DEVICE="iPad|iPhone"
elif [[ $PLATFORM == "iOSSimulator" ]]; then
  PLATFORM_NAME=iphonesimulator
  REQUIRED_DEVICE="iPad Simulator|iPhone Simulator"
elif [[ $PLATFORM == "tvOSSimulator" ]]; then
  PLATFORM_NAME=appletvsimulator
  REQUIRED_DEVICE="Apple TV Simulator"
fi
shopt -u nocasematch

echo "PLATFORM_NAME: "$PLATFORM_NAME
echo "REQUIRED_DEVICE: "$REQUIRED_DEVICE

if [[ $PLATFORM_NAME == "iphonesimulator" ]]; then
  echo "inside iphonesimulator"
  #Shutdown the device "myiossimulator" if was already created and booted.
  xcrun simctl shutdown myiossimulator
  
  #create again an iphone simulator with name "myiossimulator"
 
  SIM_DEVICE_MODEL="iPhone 14 Pro"
  SIM_DEVICE_MODEL_JOINED="iPhone_14_Pro"
  SIM_DEVICE_TYPE="iPhone-14"
  SIM_DEVICE_OS_VERSION=`xcrun -sdk iphonesimulator --show-sdk-version`
  SIM_DEVICE_NAME="myiossimulator"
  SIM_DEVICE_ID=`xcrun simctl create $SIM_DEVICE_NAME  "$SIM_DEVICE_MODEL" iOS$SIM_DEVICE_OS_VERSION`

  echo "SIM_DEVICE_ID: $SIM_DEVICE_ID"
  # Remove the connected_devices.txt file if exists.
  rm -f $CONNECTED_DEVICES_LIST
  # write the details to file.
  echo "ios simulator version: $SIM_DEVICE_OS_VERSION"
  echo "$SIM_DEVICE_ID $SIM_DEVICE_TYPE $SIM_DEVICE_OS_VERSION $SIM_DEVICE_MODEL_JOINED $SIM_DEVICE_NAME" >> $CONNECTED_DEVICES_LIST

elif [[ $PLATFORM_NAME == "appletvsimulator" ]]; then
  echo "inside appletvsimulator"

  #Shutdown the device "mytvossimulator" if was already created and booted.
  xcrun simctl shutdown mytvossimulator

  #create again an tvos simulator with name "mytvossimulator"
  
  SIM_DEVICE_MODEL="Apple TV 4K (3rd generation)"
  SIM_DEVICE_MODEL_JOINED="Apple_TV_4K_(3rd generation)"
  SIM_DEVICE_TYPE="AppleTV-4K"
  SIM_DEVICE_OS_VERSION=`xcrun -sdk appletvsimulator --show-sdk-version`
  SIM_DEVICE_NAME="mytvossimulator"
  SIM_DEVICE_ID=`xcrun simctl create $SIM_DEVICE_NAME  "$SIM_DEVICE_MODEL" tvOS$SIM_DEVICE_OS_VERSION`
  
  echo "SIM_DEVICE_ID: $SIM_DEVICE_ID"
  
  rm -f $CONNECTED_DEVICES_LIST
  # write the details to file.
  echo "tvos simulator version: $SIM_DEVICE_OS_VERSION"
  echo "$SIM_DEVICE_ID $SIM_DEVICE_TYPE $SIM_DEVICE_OS_VERSION $SIM_DEVICE_MODEL_JOINED $SIM_DEVICE_NAME" >> $CONNECTED_DEVICES_LIST
else  #else part executed for ios & tvos
  echo "########platform $PLATFORM"

  # Find connected devices
  if [ -x /opt/homebrew/bin/ios-deploy ]; then
    /opt/homebrew/bin/ios-deploy -c > $SCRIPT_PATH/profiler_output.txt
  else
    /usr/local/bin/ios-deploy -c > $SCRIPT_PATH/profiler_output.txt
  fi

  # Find connected devices
  # Use system_profiler to list all devices
  # system_profiler SPUSBDataType > $SCRIPT_PATH/profiler_output.txt
  # Use instruments to find more data about discovered devices
  xcrun xctrace list devices  > $SCRIPT_PATH/instruments_output.txt

  # Populate DEVICE_LIST with UDIDs of discovered devices
  DEVICE_LIST=`grep $PLATFORM_NAME $SCRIPT_PATH/profiler_output.txt | grep -oE 'Found ([0-9A-Za-z\-]+)' | sed 's/Found //g'`
  if [ "$DEVICE_LIST" = "" ]; then
    echo -e "\033[1;31m    Couldn't find any connected device.\033[0m" >&2
    return 13
  fi

  # Populate connected_devices.txt with list of all connected devices
  rm -f $CONNECTED_DEVICES_LIST
  echo -e "\n\033[1;33mDevice discovery...\033[0m"
  echo
  for DEVICE_ID in $DEVICE_LIST; do
    # iPhone XR and later report their DEVICE_ID differently between system_profiler and instruments (instruments has a dash at the 9th character)
    # so create the alternative form of the ID (with the dash included) in case we can't find the original DEVICE_ID in instruments_output.txt
    ALT_DEVICE_ID="${DEVICE_ID:0:8}-${DEVICE_ID:8}"
    CORRECT_DEVICE_ID=$DEVICE_ID
    echo "Device: "$DEVICE_ID
    DEVICE_MODEL=`grep -i $DEVICE_ID $SCRIPT_PATH/profiler_output.txt | awk -F\, {'print $2'} | sed 's/^.//' | sed 's/ /_/g'`
    echo "Model:  "$DEVICE_MODEL
    DEVICE_TYPE=`grep -i $DEVICE_ID $SCRIPT_PATH/profiler_output.txt | awk -F\, {'print $2'} | sed 's/^.//' | awk {'print $1"-"$2'}`
    echo "Type:   "$DEVICE_TYPE
    DEVICE_OS_VERSION=`grep -i $DEVICE_ID $SCRIPT_PATH/profiler_output.txt | awk -F\, {'print $5'} | sed 's/^.//'`
    if [ "$DEVICE_OS_VERSION" = "" ]; then
      CORRECT_DEVICE_ID=$ALT_DEVICE_ID
      DEVICE_OS_VERSION=`grep -i $ALT_DEVICE_ID $SCRIPT_PATH/instruments_output.txt | sed 's/^.*(//g' | sed 's/).*$//g'`
    fi
    if [ "$DEVICE_TYPE" = "AppleTV" ]; then
      echo "tvOS:   "$DEVICE_OS_VERSION
    else
      echo "iOS:    "$DEVICE_OS_VERSION
    fi
    DEVICE_NAME=`grep -i $DEVICE_ID $SCRIPT_PATH/profiler_output.txt | awk -F\' {'print $2'}`
    if [ "$DEVICE_NAME" = "" ]; then
      DEVICE_NAME=`grep -i $ALT_DEVICE_ID $SCRIPT_PATH/instruments_output.txt | sed "s/ ($DEVICE_OS_VERSION).*//g"`
    fi
    echo "Name:   "$DEVICE_NAME
    if [[ $DEVICE_OS_VERSION != "null" ]] ; then
      echo "$CORRECT_DEVICE_ID $DEVICE_TYPE $DEVICE_OS_VERSION $DEVICE_MODEL $DEVICE_NAME" >> $CONNECTED_DEVICES_LIST
    else
      echo -e "\033[1;31m(Device not added as it is not available for testing)\033[0m"
      fi
    echo
  done

  rm -f $SCRIPT_PATH/profiler_output.txt
  rm -f $SCRIPT_PATH/instruments_output.txt
fi

return 0
