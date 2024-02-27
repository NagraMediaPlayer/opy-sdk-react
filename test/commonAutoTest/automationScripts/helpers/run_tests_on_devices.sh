#!/bin/bash

# Functionality to launch tests and gather results on one or multiple devices.
# This script does not take parameters, but assumes some shell variables are
# set. No 'export' is required, as the script expects to be 'source'd.
# The script also assumes it is executed from its own directory
#
# The following parameters are expected to be set.
# SCRIPT_PATH -          the directory in which this script resides
# PLATFORM -             the platform to test on ('iOS' or 'tvOS')
# APPLICATION -          the application to test on ('refAppCommon.app' or 'refAppCommonTV.app')
# TESTTYPE -             the nature of the tests (e.g. 'cucumber')
# FILTERED_DEVICE_LIST - a path to a file containing UDIDs of connected devices
#                        designated for testing
# EXECUTION_PARAMS -     Additional pre-set execution parameters passed to
#                        other scripts as an array of parameters
# TEST_RESULTS_DIR -     the path to which test results were extracted from the
#                        device
# TEST_LOGS_PATH -       the directory in which results and logs will be placed
# RUN_SCRIPT_PATH -      A path to an executable that runs tests and accepts
#                        the following parameters:
#                          $1 - TESTTYPE - nature of the test (e.g. 'cucumber')
#                          $2 - DEVICE_UDID - the device under test's UDID

# echo ""
# echo "run_tests_on_devices.sh"
# echo TESTTYPE=$TESTTYPE
# echo PLATFORM=$PLATFORM
# echo APPLICATION=$APPLICATION
# echo TEST_RESULTS_DIR=$TEST_RESULTS_DIR
# echo TEST_LOGS_PATH=$TEST_LOGS_PATH
# echo RUN_SCRIPT_PATH=$RUN_SCRIPT_PATH
# echo Test params: "${EXECUTION_PARAMS[@]}"

echo "################### run_tests_on_devices.sh ############"
NUMBER_OF_DEVICES_TO_TEST=`wc -l $FILTERED_DEVICE_LIST | awk '{print $1}'`
if (( NUMBER_OF_DEVICES_TO_TEST < 1 )) ; then
  echo -e "\033[1;31m    No connected device found with matching criteria.\033[0m" >&2
  return 31
fi

DEVICES_TO_TEST=`cat $FILTERED_DEVICE_LIST`
echo -e "\033[1;33mon the following $NUMBER_OF_DEVICES_TO_TEST $PLATFORM device(s):\033[0m"
for DEV in $DEVICES_TO_TEST ; do
  echo "$DEV ($(get_device_name_from_udid $DEV))"
done
echo


# Clear test results directory
if [ -d $TEST_RESULTS_DIR ]; then
  if [ "$TEST_RESULTS_DIR" = "" ]; then
    echo -e "\033[1;31m    error: TEST_RESULTS_DIR not defined.\033[0m" >&2
    return 31
  fi
  rm -rf $TEST_RESULTS_DIR/*
else
  mkdir $TEST_RESULTS_DIR
fi

# Clear test logs directory
if [ -d $TEST_LOGS_PATH ]; then
  if [ "$TEST_LOGS_PATH" = "" ]; then
    echo -e "\033[1;31m    error: TEST_LOGS_PATH not defined.\033[0m" >&2
    return 32
  fi
  rm -rf $TEST_LOGS_PATH/*
else
  mkdir $TEST_LOGS_PATH
fi


restartDeviceBeforeRunning() {
   echo "Restart the device before running tests"
   if [ $PLATFORM == "iOSSimulator" ] || [ $PLATFORM == "tvOSSimulator" ]; then  #for iOS simulator or tvOS simulator.
    xcrun simctl boot $1
    echo "Sleep 20 seconds after restarting device "
    sleep 20
   else #for iOS or tvOS device
    idevicediagnostics restart -u $1
    echo "Sleep 60 seconds after restarting device "
    sleep 60
   fi
}

# Execute on connected device(s)
if (( NUMBER_OF_DEVICES_TO_TEST == 1 )) ; then
  # Only one device to test on.
  # Execute in foreground and display logs on-the-fly
  DEV=`echo $DEVICES_TO_TEST | awk '{print $1}'`
  echo "$DEV (single device - running in foreground)"
  # Restart the device before running
  restartDeviceBeforeRunning $DEV
  # Run the tests
  echo  bash $RUN_SCRIPT_PATH $TESTTYPE $DEV ${EXECUTION_PARAMS[@]} $1 2>&1 | tee $TEST_LOGS_PATH/logs_$DEV.txt
  bash $RUN_SCRIPT_PATH $TESTTYPE $DEV ${EXECUTION_PARAMS[@]} $1 2>&1 | tee $TEST_LOGS_PATH/logs_$DEV.txt $2
else
  # Staggered execution of tests (more than one device)
  # Capture logs and display them later so logs don't get mixed across devices.
  i=0
  WAIT_LIST=
  for DEV in $DEVICES_TO_TEST ; do
    i=$((i+1))

    # Run the ReactNative tests
    bash $RUN_SCRIPT_PATH $TESTTYPE $DEV ${EXECUTION_PARAMS[@]} $1 2>&1 > $TEST_LOGS_PATH/logs_$DEV.txt &
    P=$!
    echo "$i. $DEV pid = $P"
    WAIT_LIST="$WAIT_LIST $P"
    if [ $i -lt $NUMBER_OF_DEVICES_TO_TEST ]; then
      echo "staggering next test"
      sleep 90
    fi
  done
  wait $WAIT_LIST
fi

# Collate results
RESULT=0
echo
echo -e "\033[1;33m########## TEST RESULTS ###########\033[0m"
echo
for DEV in $DEVICES_TO_TEST ; do
  echo -e "\033[1;33m$DEV ($(get_device_name_from_udid $DEV)):\033[0m"
  if (( NUMBER_OF_DEVICES_TO_TEST != 1 )) ; then
    cat $TEST_LOGS_PATH/logs_$DEV.txt
  fi
  RES=$(cat $TEST_LOGS_PATH/res_$DEV.txt | awk '{print $1}')
  if [ $RES -ne 0 ]; then
    echo -e "\033[1;31mFailed test on device $DEV with error  $RES\033[0m"
    if [ $RESULT -eq 0 ]; then
      RESULT=$RES
    fi
  else
    echo -e "\033[1;32mTest on device '$(get_device_name_from_udid $DEV)' completed successfully\033[0m"
  fi
  echo
done

# Summarise resutls
if [ $RESULT -ne 0 ]; then
  echo -e "\033[1;31mSome errors were encountered during the tests:\033[0m"
  for DEV in $DEVICES_TO_TEST ; do
    RES=$(cat $TEST_LOGS_PATH/res_$DEV.txt | awk '{print $1}')
    echo "$(get_device_name_from_udid $DEV) ($DEV) - Result = $RES"
  done
else
  echo -e "\033[1;32mAll tests completed successfully\033[0m"
fi
# Kill the simulator instance once testing is completed.
if [ $PLATFORM == "iOSSimulator" ] || [ $PLATFORM == "tvOSSimulator" ]; then
  echo "Test completed. Deleted the simulator instance."
  xcrun simctl delete $DEV
fi


return $RESULT
