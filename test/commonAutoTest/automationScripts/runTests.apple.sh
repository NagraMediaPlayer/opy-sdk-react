#!/bin/bash

display_help(){
  echo "Usage"
  echo "  $(basename "$0") --tvos|--ios|--iOSPRM [-h--help][-f <device_filter>] [-n <max_devices>] [-a <test_app>]"
  echo
  echo "Run cucumber tests and report results."
  echo
  echo -e "\033[1mOptions\033[0m"
  echo "[-h|--help] : Show this help"
  echo
  echo "--tvos : run on Apple TV with iOSnTest application"
  echo "--ios  : run on iDevices with tvOS Test application"
  echo
  echo "[-n <max_devices>] : specify maximum number of devices to pick (default: 0 - all devices)"
  echo
  echo "[-puc <0/1>] : Specify whether to run the popup checker before tests  (default: 0)"
  echo
  echo "[-f <device_filter>] : specify filter criteria for target device(s) (default: any)"
  echo -e "\033[1mNote:\033[0m place all criteria parameters between a single pair of double-quotes"
  echo -e "\033[1mNote:\033[0m the script performs a logical AND on all criteria"
  echo "      for a logical OR, use the -f flag multiple times"
  echo -e "\033[1mCriteria parameters:\033[0m"
  echo "    any ... all devices. Overrides all other criteria"
  echo "    device= ... UDID of device"
  echo "    type= ... [iPad|iPhone]"
  echo "    model= ... model number (e.g. 5.01 is iPad Mini 4)"
  echo "    ios [ ~= | = | == | != | <= | >= | < | > ] ... iOS version in the format major[.minor[.revision]]"
  echo
  echo -e "\033[1mExamples:\033[0m"
  echo "    $(basename "$0") --ios -f \"type=iPhone ios>9\""
  echo "    (execute only high-priority tests for FPS product,"
  echo "     with only on iPhones with iOS version above 9.0.0)"
  echo
  echo "    $(basename "$0") --ios -f \"type=iPhone\" -f \"ios>=10.3\""
  echo "     on any iPhone or an iPad with iOS version of 10.3 or above)"
  echo
  echo "    $(basename "$0")  -f \"type=iPhone\" -f \"ios~=10\""
  echo "     on any iPhone or an iPad with iOS version of 10.x.x)"
  echo
  echo "    $(basename "$0") --ios -f \"any\" -n 2"
  echo "    (of all devices found, pick first two and execute default tests on them)"
  echo
}


[ ${0:0:1} = / ] && SCRIPT_PATH=$0 || SCRIPT_PATH=$PWD/$0
SCRIPT_PATH=${SCRIPT_PATH%/*}
echo "SCRIPT_PATH: $SCRIPT_PATH"
EXECUTION_FOLDER=$(basename $PWD)
echo "EXECUTION_FOLDER: $EXECUTION_FOLDER"
pushd $SCRIPT_PATH > /dev/null
  SCRIPT_PATH=`pwd -P`
popd > /dev/null

PLATFORM=ios
APPLICATION=refAppCommon.app
RESULT=0

if [ $# -ge 1 ]; then
  shopt -s nocasematch
  if [[ $1 = "--ios" ]]; then
    PLATFORM=iOS
  elif [[ $1 = "--tvos" ]]; then
    PLATFORM=tvOS
    APPLICATION=refAppCommon-tvOS.app
  elif [[ $1 = "--iossimulator" ]]; then
    PLATFORM=iOSSimulator
  elif [[ $1 = "--tvossimulator" ]]; then
    PLATFORM=tvOSSimulator
    APPLICATION=refAppCommon-tvOS.app

  elif [ "$1" = "--help" ] || [ "${1:0:2}" = "-h" ]; then
    shopt -u nocasematch
    display_help
    exit 0
  else
    shopt -u nocasematch
    echo -e "\033[1;31m Try again. See Usage Below.\033[0m"
    display_help
    exit 0
  fi
  shopt -u nocasematch
else
    echo -e "\033[1;31mPlease specify --iOS or --tvOS or --iOSSimulator or --tvOSSimulator\033[0m"
    display_help
    exit 0
fi

if [ $# -gt 1 ]; then
  shift
  PARAMS="$@"
else
  PARAMS="-n 1"
fi

pushd $SCRIPT_PATH/helpers > /dev/null

echo "bash ./run-ios-tests.sh ""-p $PLATFORM -a $APPLICATION $PARAMS -t $EXECUTION_FOLDER"""
bash ./run-ios-tests.sh -p $PLATFORM -a $APPLICATION $PARAMS -t $EXECUTION_FOLDER
RESULT=$?
if [ $RESULT -ne 0 ]; then
  echo -e "\033[1;31m    Execution of Cucumber tests failed. Returned $RESULT\033[0m" >&2
fi
popd > /dev/null


exit $RESULT
