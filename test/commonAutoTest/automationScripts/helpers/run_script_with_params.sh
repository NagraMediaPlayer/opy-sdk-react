#!/bin/bash
echo "########### run_script_with_params.sh ####### $@"
echo -e "\033[1m$(basename "$0"):\033[0m"
# $1 - TESTTYPE
# $2 - DEVICE_UDID
# $3... - TESTPARAMS
TESTTYPE=$1
DEVICE_UDID=$2
TESTPARAMS=${@:3}
EXECUTION_FOLDER=$7
EXECUTABLE="./execute_"$TESTTYPE"_tests.sh"
echo $EXECUTABLE
TEST_LOGS_PATH="./test_results_"$TESTTYPE
# echo ""
# echo "TESTTYPE="$TESTTYPE
# echo "DEVICE_UDID="$DEVICE_UDID
# echo "TESTPARAMS="$TESTPARAMS
# echo "EXECUTABLE="$EXECUTABLE
# echo "TEST_LOGS_PATH="$TEST_LOGS_PATH

echo -e "\033[1;33mExecuting execute_"$TESTTYPE"_tests.sh\033[0m"
echo -e "\033[1;33mwith $TESTTYPE tests\033[0m"
echo -e "\033[1;33mand extra parameters "$TESTPARAMS"\033[0m"
echo -e "\033[1;33mon device $DEVICE_UDID\033[0m"
echo "#############run_script_with_params.sh bash $EXECUTABLE $TESTPARAMS -d $DEVICE_UDID -t $EXECUTION_FOLDER"
bash $EXECUTABLE $TESTPARAMS -d $DEVICE_UDID -t $EXECUTION_FOLDER
RESULT=$?
echo $RESULT > $TEST_LOGS_PATH"/res_"$DEVICE_UDID".txt"
exit $RESULT