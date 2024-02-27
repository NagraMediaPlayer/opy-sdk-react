#!/bin/bash

function display_help(){
  echo -e "\033[1mUSAGE:\033[0m"
  echo "  $(basename "$0") [--help | -h] [--tags|-t] <cucumber_test_tags> [--device=|-d <device_uuid>] [--platform=|-p <platform>] [--application=|-a <application>]"
  echo "      [-P<property_name>=<property_value> [-P<property_name>=<property_value>]]"
  echo
  echo "Build the Cucumber test application and execute tests"
  echo
  echo -e "\033[1mOptions\033[0m"
  echo "[-h] : Show this help"
  echo
  echo "[-d <device_uuid>] : specify target device"
  echo
  echo "[-p <platform>] : Specify iOS or tvOS or iOSPRM platform"
  echo
  echo "[-a <application>] : Specify cucumberTest.app or cucumberTestPRM.app or cucumberTestTV.app application"
  echo
  echo -e "\033[1mExample:\033[0m"
  echo
  echo "    $(basename "$0")  -d a6424780515e6fc5c13ccbb5ded50745cb26c9ff"
  echo "    (execute default tests on device with specified udid)"
  echo
}
echo "########### execute_reactNative_tests.sh ############## $@ "
[ ${0:0:1} = / ] && SCRIPT_PATH=$0 || SCRIPT_PATH=$PWD/$0
SCRIPT_PATH=${SCRIPT_PATH%/*}
EXPORT_FOLDER=$SCRIPT_PATH/../../../../exportFolder
echo "Script path: $SCRIPT_PATH"
echo "EXPORT_FOLDER: $EXPORT_FOLDER"

#parse options
while [[ "$#" > 0 ]];
do
  if [[ "$1" == "commonAutoTest-0.63.4" ]] || [[ "$1" == "commonAutoTest-0.67.4" ]] || [[ "$1" == "commonAutoTest-0.72.4" ]];
  then 
    shift
    continue
  fi
  case $1 in
    -h|--help) echo -e "\033[1;33m Gladly. Usage: $(basename "$0") \033[0m"; display_help; exit 0 ;;
    -d|--device) DEVICE_ID=$2; shift ;;
    -p|--platform) PLATFORM=$2; shift ;;
    -a|--application) APPLICATION=$2; shift ;;
    -t|--execution_folder) EXECUTION_FOLDER=$2; shift ;;
    *) echo -e "\033[1;31m Try again. See Usage Below:  \033[0m"; display_help; exit 0 ;;
  esac; shift;
done

echo "Platform: $PLATFORM"
echo "Application: $APPLICATION"
echo "DeviceID: $DEVICE_ID"

if [ "$APPLICATION" = "refAppCommon-tvOS.app" ]; then
  BUNDLE_ID=com.nagra.reactAutoTest.refAppCommon-tvOS
  RUNNER_BUNDLE_ID=com.nagra.reactAutoTest.refAppCommon-tvOSUITests
  SCHEME=refAppCommon-tvOS
  REQUIRED_DEVICE=AppleTV
else
  BUNDLE_ID=com.nagra.reactAutoTest.refAppCommon
  RUNNER_BUNDLE_ID=com.nagra.reactAutoTest.refAppCommonUITests
  SCHEME=refAppCommon
  REQUIRED_DEVICE="iPad|iPhone"
fi

pushd "$SCRIPT_PATH"/../../"$EXECUTION_FOLDER"/
echo "#########################pwd: ,$PWD"

if [ "$DEVICE_ID" = "" ]; then
  # Find connected device
  DEVICE_ID=`system_profiler SPUSBDataType | egrep -A10 -i "($REQUIRED_DEVICE):$" | grep -m1 "Serial Number:" | sed 's/^.*Serial Number: //g'`
  if [ "$DEVICE_ID" = "" ]; then
    echo -e "\033[1;31m    Couldn't find a device to test on.\033[0m"
  popd
  exit 1
  fi
fi

DEVICE_RESULTS_PATH=$SCRIPT_PATH/../$DEVICE_ID
echo "DEVICE_RESULTS_PATH: $DEVICE_RESULTS_PATH"

echo -e "\033[1mWill install and run test on $DEVICE_ID\033[0m"

pwd

if [ "$PLATFORM" = "iOSSimulator" ] || [ "$PLATFORM" = "tvOSSimulator" ]; then
  echo "Executing for Simulator"
  #### uninstall the application on simulator with particular deviceid/uuid
  xcrun simctl uninstall $DEVICE_ID  $APPLICATION
else
  echo "Executing for iOS/tvOS device"
  if [ -x /opt/homebrew/bin/ios-deploy ]; then
      /opt/homebrew/bin/ios-deploy --id $DEVICE_ID --bundle_id $BUNDLE_ID --uninstall_only
      /opt/homebrew/bin/ios-deploy ios-deploy --id $DEVICE_ID --bundle_id $RUNNER_BUNDLE_ID --uninstall_only
  else
     /usr/local/bin/ios-deploy --id $DEVICE_ID --bundle_id $BUNDLE_ID --uninstall_only
    /usr/local/bin/ios-deploy --id $DEVICE_ID --bundle_id $RUNNER_BUNDLE_ID --uninstall_only
  fi
fi

echo "sh $SCRIPT_PATH/run_test_through_xcuitest.sh -d $DEVICE_ID -s $SCHEME -p $PLATFORM -t $EXECUTION_FOLDER"
sh $SCRIPT_PATH/run_test_through_xcuitest.sh -d $DEVICE_ID -s $SCHEME -p $PLATFORM -t $EXECUTION_FOLDER

 RESULT=$?
 if [ $RESULT -ne 0 ]; then
    echo -e "\033[1;31m    Build and test finished with error $RESULT!\033[0m"
 fi

 if [ "$PLATFORM" = "iOSSimulator" ] || [ "$PLATFORM" = "tvOSSimulator" ]; then
  open -a $APPLICATION
  xcrun simctl install $DEVICE_ID $APPLICATION
fi

if [ "$PLATFORM" != "iOSSimulator" ] && [ "$PLATFORM" != "tvOSSimulator" ]; then
  # Pull results from device
  echo -e "\033[1;33mPull results from device...\033[0m"
  rm -rf $DEVICE_RESULTS_PATH
  mkdir $DEVICE_RESULTS_PATH

  if [ -x /opt/homebrew/bin/ios-deploy ]; then
      /opt/homebrew/bin/ios-deploy -i $DEVICE_ID --download=/Library/Caches -1 $BUNDLE_ID -2 $DEVICE_RESULTS_PATH/
  else
     /usr/local/bin/ios-deploy -i $DEVICE_ID --download=/Library/Caches -1 $BUNDLE_ID -2 $DEVICE_RESULTS_PATH/
  fi

  RES=$?
  if [ $RESULT -eq 0 ]; then
    RESULT=$RES
  fi
else 
  #For iOS / tvOS simulator: Copy the simulator data of current bundle/app to device result path.
  cp -rf ~/Library/Developer/CoreSimulator/Devices/$DEVICE_ID/data/Library/Caches $DEVICE_RESULTS_PATH/
fi

# if [ $RES -ne 0 ]; then
#   echo -e "\033[1;31m  Failed to pull results from device - $RESULT!\033[0m"
# else
#   # cp $DEVICE_RESULTS_PATH/Library/Caches/results.xml $SCRIPT_PATH/reactNativeTests/Documents/results_$DEVICE_ID.xml
#   # cp $DEVICE_RESULTS_PATH/Library/Caches/results.json $SCRIPT_PATH/reactNativeTests/Documents/results_$DEVICE_ID.json
#   # cp $DEVICE_RESULTS_PATH/Library/Caches/console_output.txt $SCRIPT_PATH/reactNativeTests/Documents/console_output_$DEVICE_ID.txt
#   RES=$?
#   if [ $RESULT -eq 0 ]; then
#     RESULT=$RES
#   fi

#   if [ ! -f $SCRIPT_PATH/../Documents/results_default.xml ]; then
#       echo "Using iOS FPS SDK first device result as default report"
#       # cp $DEVICE_RESULTS_PATH/Library/Caches/results.xml $SCRIPT_PATH/reactNativeTests/Documents/results_default.xml
#       # cp $DEVICE_RESULTS_PATH/Library/Caches/results.json $SCRIPT_PATH/reactNativeTests/Documents/results_default.json
#       # cp $DEVICE_RESULTS_PATH/Library/Caches/console_output.txt $SCRIPT_PATH/reactNativeTests/Documents/console_output_default.txt
#   fi
# fi


# RES=$?
# if [ $RESULT -eq 0 ]; then
#   RESULT=$RES
# fi

# if [ $RES -ne 0 ]; then
#   echo -e "\033[1;31m  Failed to pull results from device - $RESULT!\033[0m"
# else
#   cp -R $DEVICE_RESULTS_PATH/dynamicReportResults/Library/Caches/ $SCRIPT_PATH/reactNativeTests/Documents/
#   RES=$?
#   if [ $RESULT -eq 0 ]; then
#     RESULT=$RES
#   fi
# fi

popd
echo -e "\033[1;33mEND OF TESTS. RESULT: $RESULT\033[0m"
exit $RESULT
