#!/bin/bash

# Functionality to create and use a filtered list of UDIDs of devices.
#
# The input for this script is device filtering criteria
# (e.g. -n 2 -f "type=iPad ios<=12 model=5.01").
#
# This script uses a few files to store persistent multi-line data
#   - The list of connected devices is placed in devices.txt. Each
#     line represents one device with UDID, type (iPad/iPhone), iOS version,
#     model and device name.
#   - The list of filter criteria is placed in filtered_criteria.txt. Criteria
#     on the same line are 'AND'ed, whereas criteria on separate lines are
#     'OR'ed.
#   - The list of filtered devices (that match the filter for devices to test)
#     is placed in filtered_device_list_<testtype>.txt. Each line contains the UDID of
#     one device
#   - The test logs are generated separately for a run on each device, and
#     stored in logs_<device-udid>.txt files under the <testtype>_test_results directory
#   - The result integer for a run on each device is stored in
#     res_<device-udid>.txt under the <testtype>_test_results directory
#
# This script only takes filtering parameters, but assumes some shell variables
# are set. No 'export' is required, as the script expects to be 'source'd.
# The script also assumes it is executed from its own directory
#
# The following parameters are expected to be set.
# SCRIPT_PATH -          the directory in which this script resides
# TESTTYPE -             the nature of the tests (e.g. 'cucumber')
# CONNECTED_DEVICES_LIST - the input of this file - a list of discovered connected devices 
# FILTER_CRITERIA_FILE - A file to store multiple filtering criteria
# FILTERED_DEVICE_LIST - the output of the filter_devices function 

function display_help(){
  echo -e "\033[1mUSAGE:\033[0m"
  echo "  source device_filtering.sh [-h] [-f <device_filter>] [-n <max_devices>]"
  echo
  echo "Utilities for filtering devices by criteria (assuming they are already discovered)"
  echo
  echo -e "\033[1mOptions\033[0m"
  echo "[-h] : Show this help"
  echo
  echo "[-n <max_devices>] : specify maximum number of devices to pick (default: 0 - all devices)"
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
  echo "    source $(basename "$0") -f \"type=iPhone ios>9\""
  echo "    (execute only high-priority tests for FPS product,"
  echo "     with  play-pause-seek and subtitle test suites,"
  echo "     with only on iPhones with iOS version above 9.0.0)"
  echo
  echo "    $(basename "$0")  -t \"@fps/@play_pause_seek/@high_priority/~@ignore,~@eme,~@dash\" -f \"type=iPhone\" -f \"ios>=10.3\""
  echo "    (execute only high-priority play-pause-seek tests with FPS streams,"
  echo "     on any iPhone or an iPad with iOS version of 10.3 or above)"
  echo 
  echo "    $(basename "$0")  -t \"@fps/@play_pause_seek/@high_priority/~@ignore,~@eme,~@dash\" -f \"type=iPhone\" -f \"ios~=10\""
  echo "    (execute only high-priority play-pause-seek tests with FPS streams,"
  echo "     on any iPhone or an iPad with iOS version of 10.x.x)"
  echo
  echo "    $(basename "$0") -f \"any\" -n 2"
  echo "    (of all devices found, pick first two and execute default tests on them)"
  echo
}

# Add a UDID to the filtered device list.
# The function makes sure there are no duplicates
# Examples:
#   add_device_udid_to_list "4423d6b648c17e2d8c8c824ff566317275209a1f"
# Result in filtered_device_list_<testtype>.txt.
function add_device_udid_to_list()
{
  the_device=$1
  the_list=`cat $FILTERED_DEVICE_LIST`
  device_already_exists=0
  for DEV in $the_list ; do
    if [ "$the_device" = "$DEV" ]; then
      device_already_exists=1
      break
    fi
  done
  num_of_devices_in_list=`wc -l < $FILTERED_DEVICE_LIST`
  if (( device_already_exists == 0 )) ; then
    if (( MAX_DEVICES == 0 || num_of_devices_in_list < MAX_DEVICES )) ; then
      echo $the_device >> $FILTERED_DEVICE_LIST
      # echo "Addding device $the_device to the list"
    fi
  fi
}


# https://stackoverflow.com/a/41371534/1751266
# Returns:
# 0: versions equal
# 1: first version is greater
# 2: first version is lesser
function version_compare () {
  if [[ $1 =~ ^([0-9]+\.?)+$ && $2 =~ ^([0-9]+\.?)+$ ]]; then
      local l=(${1//./ }) r=(${2//./ }) s=${#l[@]}; [[ ${#r[@]} -gt ${#l[@]} ]] && s=${#r[@]}

    for i in $(seq 0 $((s - 1))); do
      [[ ${l[$i]} -gt ${r[$i]} ]] && return 1
      [[ ${l[$i]} -lt ${r[$i]} ]] && return 2
    done

    return 0
  else
      echo "Invalid version number given"
      return 1
  fi
}

# Determine whether the major version of the device's OS version is as desired
# Returns:
# 1: the major version of the device version (first parameter) matches the second parameter
# 0: they don't match (or there was an error)
function major_version_compare() {
  device_version=$1
  major_version=$2
  echo comparing $device_version against $major_version
  if [[ $device_version =~ ^([0-9]+\.?)+$ && $major_version =~ ^([0-9]+)$ ]]; then
    if [[ $device_version == $major_version.* ]]; then
      return 1
    fi
  else
    echo "Invalid version number given"
  fi

  return 0
}


# Apply filter on device list in devices.txt
# The 'any' parameter creates a list of all connected devices.
# Examples:
#   find_devices_with_criteria "type=iPad ios<=12 model=5.01"
#   find_devices_with_criteria "type=iPhone ios>10"
#   find_devices_with_criteria any
# Result in filtered_device_list_<testtype>.txt.
# Each call to this function adds to the list, practically a logical OR
function find_devices_with_criteria()
{
  # Parse criteria
  arg_udid=""
  arg_model=""
  arg_type=""
  arg_ios_version=""
  arg_relation=""
  shopt -s nocasematch
  if [[ $1 != "any" ]]; then
    for criteria_str in $*; do
      if [[ ${criteria_str:0:7} == "device=" ]]; then
        arg_udid=${criteria_str:7}
      fi
      if [[ ${criteria_str:0:6} == "model=" ]]; then
        arg_model=${criteria_str:6}
        # echo "(model = $arg_model)"
      fi
      if [[ ${criteria_str:0:5} == "type=" ]]; then
        arg_type=${criteria_str:5}
        # echo "(type = $arg_type)"
      fi
      if [[ ${criteria_str:0:3} == "ios" ]]; then
        if [[ ${criteria_str:3:2} == "<=" ]] || [[ ${criteria_str:3:2} == ">=" ]] || [[ ${criteria_str:3:2} == "!=" ]] || [[ ${criteria_str:3:2} == "==" ]] || [[ ${criteria_str:3:2} == "~=" ]]; then
          arg_ios_version=${criteria_str:5}
          arg_relation=${criteria_str:3:2}
        elif [[ ${criteria_str:3:1} == "=" ]] || [[ ${criteria_str:3:1} == ">" ]] || [[ ${criteria_str:3:1} == "<" ]]; then
          arg_ios_version=${criteria_str:4}
          arg_relation=${criteria_str:3:1}
        fi
        # echo "(ios $arg_relation $arg_ios_version)"
      elif [[ ${criteria_str:0:4} == "tvos" ]]; then
        if [[ ${criteria_str:4:2} == "<=" ]] || [[ ${criteria_str:4:2} == ">=" ]] || [[ ${criteria_str:4:2} == "!=" ]] || [[ ${criteria_str:4:2} == "==" ]] || [[ ${criteria_str:4:2} == "~=" ]]; then
          arg_ios_version=${criteria_str:6}
          arg_relation=${criteria_str:4:2}
        elif [[ ${criteria_str:4:1} == "=" ]] || [[ ${criteria_str:4:1} == ">" ]] || [[ ${criteria_str:4:1} == "<" ]]; then
          arg_ios_version=${criteria_str:5}
          arg_relation=${criteria_str:4:1}
        fi
        # echo "(ios $arg_relation $arg_ios_version)"
      fi
    done
  fi

  # Parse each line of device
  cat $CONNECTED_DEVICES_LIST | while read -r line ; do
    udid=`echo $line | awk '{print $1}'`
    type=`echo $line | awk '{print $2}'`
    version=`echo $line | awk '{print $3}'`
    model=`echo $line | awk '{print $4}'`
    name=`echo $line | awk '{ for(i=5; i<NF; i++) printf "%s",$i OFS; if(NF) printf "%s",$NF; printf ORS}'`

    # Evaluate criteria
    if [[ $arg_udid != "" ]] && [[ $arg_udid != "$udid" ]]; then
      continue
    fi
    if [[ $arg_model != "" ]] && [[ $arg_model != "$model" ]]; then
      continue
    fi
    if [[ $arg_type != "" ]] && [[ $arg_type != "$type" ]]; then
      continue
    fi
    if [[ $arg_ios_version != "" ]]; then
      if [[ $arg_relation == "~=" ]]; then
        major_version_compare $version $arg_ios_version
        compare_result=$?
        if (( compare_result != 1 )); then
          continue
        fi
      else
        version_compare $version $arg_ios_version
        compare_result=$?
        # echo "Comparison result of $version and $arg_ios_version is $compare_result"
        case $arg_relation in
          ">")
            if (( compare_result != 1 )); then
              continue
            fi
            ;;
          "<")
            if (( compare_result != 2 )); then
              continue
            fi
            ;;
          "=")
            if (( compare_result != 0 )); then
              continue
            fi
            ;;
          "==")
            if (( compare_result != 0 )); then
              continue
            fi
            ;;
          "!=")
            if (( compare_result == 0 )); then
              continue
            fi
            ;;
          "<=")
            if (( compare_result == 1 )); then
              continue
            fi
            ;;
          ">=")
            if (( compare_result == 2 )); then
              continue
            fi
            ;;
          *)
            ;;
        esac
      fi
    fi
    # echo "Found match: $udid"
    # echo "Type=$type, iOS=$version, Model=$model, Name=$name"
    add_device_udid_to_list $udid
  done
  echo -e "\033[1;33mFiltered UDID list:\033[0m\n$(cat $FILTERED_DEVICE_LIST)"
  shopt -u nocasematch
}

# Example
#   NAME=$(get_device_name_from_udid a6424780515e6fc5c13ccbb5ded50745cb26c9ff)
function get_device_name_from_udid()
{
  the_udid=$1
  # devlist=`cat $CONNECTED_DEVICES_LIST`
  cat $CONNECTED_DEVICES_LIST | while read -r DEV ; do
    udid=`echo $DEV | awk '{print $1}'`
    if [ "$udid" = "$the_udid" ]; then
      name=`echo $DEV | awk '{ for(i=5; i<NF; i++) printf "%s",$i OFS; if(NF) printf "%s",$NF; printf ORS}'`
      echo $name
      break
    fi
  done
}

# Example
#   TYPE=$(get_device_type_from_udid a6424780515e6fc5c13ccbb5ded50745cb26c9ff)
function get_device_type_from_udid()
{
  the_udid=$1
  # devlist=`cat $CONNECTED_DEVICES_LIST`
  cat $CONNECTED_DEVICES_LIST | while read -r DEV ; do
    udid=`echo $DEV | awk '{print $1}'`
    if [ "$udid" = "$the_udid" ]; then
      type=`echo $DEV | awk '{print $2}'`
      echo $type
      break
    fi
  done
}

# Example
#   IOS=$(get_device_ios_from_udid a6424780515e6fc5c13ccbb5ded50745cb26c9ff)
function get_device_ios_from_udid()
{
  the_udid=$1
  # devlist=`cat $CONNECTED_DEVICES_LIST`
  cat $CONNECTED_DEVICES_LIST | while read -r DEV ; do
    udid=`echo $DEV | awk '{print $1}'`
    if [ "$udid" = "$the_udid" ]; then
      ios=`echo $DEV | awk '{print $3}'`
      echo $ios
      break
    fi
  done
}

# Example
#   MODEL=$(get_device_model_from_udid a6424780515e6fc5c13ccbb5ded50745cb26c9ff)
function get_device_model_from_udid()
{
  the_udid=$1
  # devlist=`cat $CONNECTED_DEVICES_LIST`
  cat $CONNECTED_DEVICES_LIST | while read -r DEV ; do
    udid=`echo $DEV | awk '{print $1}'`
    if [ "$udid" = "$the_udid" ]; then
      model=`echo $DEV | awk '{print $4}'`
      echo $model
      break
    fi
  done
}

# Example
#   ...
function filter_devices()
{
  echo Filter Criteria: `cat $FILTER_CRITERIA_FILE`
  echo Max devices to filter: $MAX_DEVICES

  # Convert filter criteria to a filtered device list in filtered_device_list_<testtype>.txt
  rm -f $FILTERED_DEVICE_LIST
  touch $FILTERED_DEVICE_LIST

  num_of_criteria_in_list=`wc -l < $FILTER_CRITERIA_FILE`
  if (( num_of_criteria_in_list > 0 )); then
    cat $FILTER_CRITERIA_FILE | while read -r line ; do
      find_devices_with_criteria $line
    done
  else
    find_devices_with_criteria "any"
  fi
}

##############################################################

# echo -e "\033[1mdevice_filtering.sh:\033[0m"

if [ "$SCRIPT_PATH" = "" ]; then
  echo -e "\033[1;31m    error: SCRIPT_PATH not defined.\033[0m" >&2
  return 20
fi

# echo
# echo "Script Path: "$SCRIPT_PATH
# echo "params count: "$#
# echo "next params:" "$@"
# echo "Connected devices at: "$CONNECTED_DEVICES_LIST
# echo "Filtering criteria in: "$FILTER_CRITERIA_FILE
# echo "Filtered devices at: "$FILTERED_DEVICE_LIST
# echo "Test type: "$TESTTYPE

# MAX_DEVICES=0
# FILTER_CRITERIA_FILE=$SCRIPT_PATH/filter_criteria_$TESTTYPE.txt
# FILTERED_DEVICE_LIST=$SCRIPT_PATH/filtered_device_list_$TESTTYPE.txt

# Start with no criteria
rm -f $FILTER_CRITERIA_FILE
touch $FILTER_CRITERIA_FILE

# Parse argument for device filtering and populate the filter criteria file
while [[ "$#" > 0 ]];
do
  case "$1" in
    -f)  FILTER=$2; echo $FILTER >> $FILTER_CRITERIA_FILE; shift ;;
    -n)  MAX_DEVICES=$2; shift ;;
    -t)  TESTTAGS=$2; shift ;;
    -h)  display_help; return 21 ;;
    *)   display_help; return 22 ;;
  esac; shift;
done

# Find connected device matching the criteria
filter_devices
# echo -e "Filtered devices:\n" `cat $FILTERED_DEVICE_LIST`

return 0
