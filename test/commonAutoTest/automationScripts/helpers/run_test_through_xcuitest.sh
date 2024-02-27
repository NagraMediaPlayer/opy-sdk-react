#!/bin/bash

function display_help(){
  echo -e "\033[1mUSAGE:\033[0m"
  echo "  $(basename "$0") [--help | -h] [--device=|-d <device_uuid>] [--platform=|-p <platform>] [--scheme=|-s <scheme>] [--testdir=| -t <execution_folder>]"
  echo "      [-P<property_name>=<property_value> [-P<property_name>=<property_value>]]"
  echo
  echo "Run the Cucumber test XCUITest application"
  echo
  echo -e "\033[1mOptions\033[0m"
  echo "[-h] : Show this help"
  echo
  echo "[-d <device_uuid>] : specify target device"
  echo
  echo "[-p <platform>] : Specify iOS or tvOS"
  echo
  echo "[-s <scheme>] : Specify refAppCommon or refAppCommonTV"
  echo
  echo "[-t <testDir>] : Specify the test execution directory"
  echo
}

echo "#####run_test_through_xcuitest.sh $@"
[ ${0:0:1} = / ] && SCRIPT_PATH=$0 || SCRIPT_PATH=$PWD/$0
SCRIPT_PATH=${SCRIPT_PATH%/*}

#parse options
while [[ "$#" > 0 ]];
do
  case $1 in
    -h|--help) display_help; exit 0 ;;
    -d|--device) DEVICE_ID=$2; shift ;;
    -p|--platform) PLATFORM=$2; shift ;;
    -s|--scheme) SCHEME=$2; shift ;;
    -t|--execution_folder)  EXECUTION_FOLDER=$2 shift ;;
    *) echo -e "\033[1;31m Try again. See Usage Below:  If you need spaces in the tags, use enclosing quotes on the whole tag string. \033[0m"; display_help; exit 0 ;;
  esac; shift;
done

echo "Platform: $PLATFORM"
echo "Scheme: $SCHEME"
echo "DeviceID: $DEVICE_ID"
echo "execution_folder: $EXECUTION_FOLDER"
if [ "$PLATFORM" = "iOSSimulator" ] ; then
  DESTINATION="-destination 'platform=iOS Simulator,id=$DEVICE_ID'"
elif [ "$PLATFORM" = "tvOSSimulator" ] ; then
  DESTINATION="-destination 'platform=tvOS Simulator,id=$DEVICE_ID'"
else
  DESTINATION="-destination 'platform=$PLATFORM,id=$DEVICE_ID'"
fi

echo "############Ecexution Path: $EXECUTION_FOLDER"
pushd $SCRIPT_PATH/../../$EXECUTION_FOLDER/ios/
# build project
buildCommand="xcodebuild -workspace refAppCommon.xcworkspace -scheme $SCHEME  -parallel-testing-enabled NO -allowProvisioningUpdates -derivedDataPath 'build' $DESTINATION test"
eval $buildCommand

if [ $? -ne 0 ]; then 
   echo "Looks like testing failed."
   popd
   exit 1
fi

popd
