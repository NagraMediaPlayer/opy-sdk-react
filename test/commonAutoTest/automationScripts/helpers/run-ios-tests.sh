#!/bin/bash

# Functionality to create and use a filtered list of UDIDs of devices and then
# execute tests and capture the results.
# The actual test is performed in execute_cucumber_tests.sh and the Cucumber
# results for each device are produced by it.
#
# The script uses some generic scripts (using 'source'), each relies on some
# pre-configuration of this script, and running on the directory this sprint
# resides in:
#   device_discovery.sh     - finds (USB-) connected devices
#                             output - in ./connected_devices.txt
#   device_filtering.sh     - tools to identify and select one or more
#                             connected devices based on filtering criteria
#                             input - -n <max_devices>, -f <filter_criteria>
#                             output - in ./filtered_device_list_<testtype>.txt
#   run_tests_on_devices.sh - manage execution of one test on one or more
#                             devices, and collect logs and results. If the
#                             test should be run on multiple devices, tests are
#                             launched in a staggered manner and run in the
#                             background
#   run_script_with_params.sh - manage execution of one test on one device.
#                             input: $1 - testtype
#                                    $2 - device_udid
#                                    $3 - extra parameters
#                             output:
#                                    logs and results stored in
#                                    test_result_<testtype> directory
#
# The input for this script is a Cucumber filter string and device filtering
# criteria (e.g. "type=iPad ios<=12 model=5.01").
# Based on the Cucumber tag string, this script generates a template script
# 'run_cucumber_script.sh' which is then executed in the background - once for each
# device, where execution is staggered.
# If only one device is to be tested on, the execution is in the foreground.
#
# This script uses a few files to store persistent multi-line data
#   - The list of connected devices is placed in connected_devices.txt. Each
#     line represents one device with UDID, type (iPad/iPhone), iOS version,
#     model and device name.
#   - The list of filter criteria is placed in filtered_criteria_<testtype>.txt.
#     Criteria on the same line are 'AND'ed, whereas criteria on separate lines
#     are 'OR'ed.
#   - The list of filtered devices (that match the filter for devices to test)
#     is placed in filtered_device_list_<testtype>.txt. Each line contains the
#     UDID of one device.
#   - The test logs are generated separately for a run on each device, and
#     stored in logs_<device-udid>.txt files under the
#     <testtype>_test_results directory.
#   - The result integer for a run on each device is stored in
#     res_<device-udid>.txt under the same <testtype>_test_results directory

function display_help(){
  echo -e "\033[1mUSAGE:\033[0m"
  echo "  $(basename "$0") [-h] [-f <device_filter>] [-p <platform>] [-a <application>] [-n <max_devices>] [-t <execution_folder>]"
  echo
  echo "Build the Cucumber test application and execute tests"
  echo
  echo -e "\033[1mOptions\033[0m"
  echo "[-h] : Show this help"
  echo
  echo "[-p <platform>] : Specify iOS or tvOS  (default: iOS)"
  echo
  echo "[-a <application>] : Specify refAppCommon.app or refAppCommonTV.app (default: refAppCommon.app)"
  echo
  echo "[-n <max_devices>] : Specify maximum number of devices to pick (default: 0 - all devices)"
  echo
  echo "[-t <execution_folder>] : Specify the excecution folder from where tests are running (e.g. - commonAutoTest-0.63.4)"
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
  echo "    ios [ = | == | != | <= | >= | < | > ] ... iOS version in the format major[.minor[.revision]]"
  echo
  echo -e "\033[1mExamples:\033[0m"
  echo "    $(basename "$0")  -t \"@fps/@play_pause_seek,@subtitles/@high_priority/~@ignore,~@eme,~@das\" -f \"type=iPhone ios>9\""
  echo "    (execute only high-priority tests for FPS product,"
  echo "     with  play-pause-seek and subtitle test suites,"
  echo "     with only on iPhones with iOS version above 9.0.0)"
  echo
  echo "    $(basename "$0")  -t \"@fps/@play_pause_seek/@high_priority/~@ignore,~@eme,~@dash\" -f \"type=iPhone\" -f \"ios>=10.3\""
  echo "    (execute only high-priority play-pause-seek tests with FPS streams,"
  echo "     on any iPhone or an iPad with iOS version of 10.3 or above)"
  echo
  echo "    $(basename "$0") -f \"any\" -n 2"
  echo "    (of all devices found, pick first two and execute default tests on them)"
  echo
}

# echo -e "\033[1m$(basename "$0"):\033[0m"
echo "################# run-ios-tests.sh ################ $@"
# Get script path
[ ${0:0:1} = / ] && SCRIPT_PATH=$0 || SCRIPT_PATH=$PWD/$0
SCRIPT_PATH=${SCRIPT_PATH%/*}
pushd $SCRIPT_PATH > /dev/null
  export SCRIPT_PATH=`pwd -P`
popd > /dev/null

# A variable identifying the nature of the tests
TESTTYPE="reactNative"
# The output of the device discovery
CONNECTED_DEVICES_LIST=$SCRIPT_PATH"/connected_devices.txt"
# A temporary file to store multiple criteria
FILTER_CRITERIA_FILE=$SCRIPT_PATH"/filter_criteria_"$TESTTYPE".txt"
# The output of the device filtering
FILTERED_DEVICE_LIST=$SCRIPT_PATH"/filtered_device_list_$TESTTYPE.txt"
# The script that executes the test on each device
RUN_SCRIPT_PATH=$SCRIPT_PATH"/run_script_with_params.sh"
# Where to expect to find the raw test results extracted from the device
TEST_RESULTS_DIR=$SCRIPT_PATH"/reactNativeTests/Documents"
# Where the test logs and results are placed
TEST_LOGS_PATH=$SCRIPT_PATH"/test_results_"$TESTTYPE

# The default platform is iOS but can be overridden with the -p <platform> switch
PLATFORM=iOS
# The default application is cucumberTest.app but can be overridden with the -a <application> switch
APPLICATION=refAppCommon.app
# Maximum number of devices to test on (0 = unlimited)
MAX_DEVICES=0

TESTTAGS=
TESTPARAMS=
# An array of filtering arguments (e.g. -f "iOS>=11" -n 2 has 4 elements in the array)
FILTERING_ARGS=()


# Parse argument for cucumber test tags and device filter
while [[ "$#" > 0 ]];
do
  case "$1" in
    -p) PLATFORM=$2; shift ;;
    -a) APPLICATION=$2; shift ;;
    -t) EXECUTION_FOLDER=$2; shift ;; 
    -h) display_help; exit 0 ;;
    -n) FILTERING_ARGS+=("$1"); FILTERING_ARGS+=("$2"); shift;;
    -f) FILTERING_ARGS+=("$1"); FILTERING_ARGS+=("$2"); shift;;
    -puc) RUN_POPUP_CHECKER=$2; shift;;
    *)  echo $1; display_help; exit 0;;
  esac; shift;
done

# echo
# echo "Connected devices at: "$CONNECTED_DEVICES_LIST
# echo "Filtering criteria in: "$FILTER_CRITERIA_FILE
# echo "Filtered devices at: "$FILTERED_DEVICE_LIST
# echo "Per-device Executable: "$RUN_SCRIPT_PATH
# echo "Results from: "$TEST_RESULTS_DIR
# echo "Logs at: "$TEST_LOGS_PATH
# echo "Test type: "$TESTTYPE
# echo "Platform: "$PLATFORM
# echo "Filter params:" "${FILTERING_ARGS[@]}"
# echo

# Let's get to work
pushd $SCRIPT_PATH > /dev/null

# Discover connected device
source $SCRIPT_PATH/device_discovery.sh
RESULT=$?; (( RESULT != 0 )) && ( popd > /dev/null; exit $RESULT )

# Set filtering parameters in filtering tool
source $SCRIPT_PATH/device_filtering.sh "${FILTERING_ARGS[@]}"
RESULT=$?; (( RESULT != 0 )) && ( popd > /dev/null; exit $RESULT )

# Prepare execution parameters specific for running Cucumber tests
EXECUTION_PARAMS=()
EXECUTION_PARAMS+=("-p");
EXECUTION_PARAMS+=("$PLATFORM");
EXECUTION_PARAMS+=("-a");
EXECUTION_PARAMS+=("$APPLICATION");

echo $EXECUTION_PARAMS
# Now run the test on each of the selected connected devices
echo "#######run-ios-tests.sh:  $SCRIPT_PATH/run_tests_on_devices.sh $EXECUTION_FOLDER"
source $SCRIPT_PATH/run_tests_on_devices.sh $EXECUTION_FOLDER
RESULT=$?

popd > /dev/null
echo "End of tests. Result = "$RESULT
exit $RESULT
