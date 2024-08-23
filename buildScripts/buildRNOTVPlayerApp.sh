#!/bin/bash

[ ${0:0:1} = / ] && SCRIPT_PATH=$0 || SCRIPT_PATH=$PWD/$0
SCRIPT_PATH=${SCRIPT_PATH%/*}
EXPORT_FOLDER=$SCRIPT_PATH"/../exportFolder"
EXPORT_PLIST_PATH=$SCRIPT_PATH"/export_options/Development.plist"
MODULES_FOLDER="./node_modules"
DIST_PATH="dist/$2"
RN_VERSION=$2
IS_NEW_ARCH=false

Web_OS="web"
Apple_iOS="iOS"
Apple_tvOS="tvOS"
Android_OS="android"

RED="\033[1;31m"
NORMAL="\033[0m"

#For node 18 support
export NODE_OPTIONS=--openssl-legacy-provider

function display_help() {
  echo
  echo -e "\033[1mUSAGE:\033[0m"
  echo "  $(basename "$0") [refAppCommon | unifiedExample] [0.67.4 | 0.72.4] [ios | tvos | android | web]"
  echo
  echo "Builds RN project with the specfied version for a particular platform (if not specified builds for all platforms)"
  echo
  echo -e "\033[1mOptions and configuration\033[0m"
  echo "    $(basename "$0") [RNproject] [RNversion] [platform]"
  echo
  echo "    $(basename "$0") help"
  echo "        --> Shows this help"
  echo
  echo -e "\033[1mExamples:\033[0m"
  echo "    $(basename "$0") refAppCommon [0.67.4 | 0.72.4] ios"
  echo "        --> Builds refAppCommon with RN version [0.67.4 | 0.72.4] for ios platform"
  echo
  echo "    $(basename "$0") refAppCommon [0.67.4 | 0.72.4] android"
  echo "        --> Builds refAppCommon with RN version [0.67.4 | 0.72.4] for android platform"
  echo
  echo "    $(basename "$0") unifiedExample [0.67.4 | 0.72.4] web"
  echo "        --> Builds unifiedExample with RN version [0.67.4 | 0.72.4] for web platform"
  echo
  echo "    $(basename "$0") unifiedExample [0.67.4 | 0.72.4]"
  echo "        --> Builds unifiedExample with RN version [0.67.4 | 0.72.4] for all platforms"
  echo
}

function deleteDir() {
  if [ -d $1 ]; then
    rm -rf $1
    return $?
  else
    return 0
  fi
}

function check() {
  if [ $1 -ne 0 ]; then
    echo -e "${RED} '$2' Command failed , please check error.${NORMAL}"
    exit -1
  fi
}

function prepareNewArchBuild() {
  # Build for new architecture with specifying component name in react-native.config.js
  cp $SCRIPT_PATH/../$PROJECTNAME/$PROJECTVERSION/react-native.config_working.js $SCRIPT_PATH/../$PROJECTNAME/$PROJECTVERSION/react-native.config.js
}

function build_newArchitecture() {
  # Build APK for new architecture without specifying component name in  react-native.config.js
  unset JAVA_TOOL_OPTIONS
  rm -rf $SCRIPT_PATH/../$PROJECTNAME/$PROJECTVERSION/android/app/.cxx

  prepareNewArchBuild

  bash ./gradlew clean :app:exportReleaseApk -PnewArchEnabled=true -PnewArchPlay=true
}

if [[ -z "$1" || -z "$2" ]]; then
  display_help
  exit -1
else
  if [ $1 == "refAppCommon" ]; then
    PROJECTVERSION="$(echo "app-$2")"
  elif [ $1 == "unifiedExample" ]; then
    PROJECTVERSION="$(echo "example-$2")"
  fi
  PROJECTNAME=$1
fi

YARN_CMD="$HOME/.nvm/nvm-exec yarn"
if [ -d "$HOME/.nvm" ]; then
  echo -e "\033[1mBuilding on Linux or Mac device:\033[0m"
else
	YARN_CMD="yarn"
fi

if [ -z "$3" ]; then
  BUILD_OS_LIST="$Web_OS $Apple_iOS $Apple_tvOS $Android_OS"
else
  if [ $3 == $Web_OS ]; then
    BUILD_OS_LIST=$Web_OS
  elif [ $3 == "ios" ]; then
    BUILD_OS_LIST=$Apple_iOS
  elif [ $3 == "tvos" ]; then
    BUILD_OS_LIST=$Apple_tvOS
  elif [ $3 == $Android_OS ]; then
    BUILD_OS_LIST=$Android_OS
  else
    display_help
    exit -1
  fi
fi

if [ "$4" == "true" ] && [ "$RN_VERSION" = "0.72.4" ]; then
  IS_NEW_ARCH=true
fi

echo PROJECTNAME: $PROJECTNAME
echo PROJECTVERSION: $PROJECTVERSION
echo BUILD_OS_LIST: $BUILD_OS_LIST
echo IS_NEW_ARCH: $IS_NEW_ARCH

echo "EXPORT_FOLDER=$EXPORT_FOLDER"
echo "EXPORT_PLIST_PATH=$EXPORT_PLIST_PATH"

if [ -d "$EXPORT_FOLDER" ]; then
  rm -rf "$EXPORT_FOLDER"/opy-rn-${PROJECTNAME}*
else
  mkdir "$EXPORT_FOLDER"
fi

# --------------------------------------------------------------------
# Phase 2: manage installation of dependency packages and node_modules
# --------------------------------------------------------------------

pushd "${SCRIPT_PATH}"/../"$PROJECTNAME"/"$PROJECTVERSION"

check $? 'pushd'

  if [ -d $MODULES_FOLDER ]
  then
    # ask if cleanup is required
    read -t 5 -n 1 -p "Would you like to delete node_modules? Continue (y/N)? " answer
    echo
    # if answer is yes within 15 seconds start updating cluster nodes ...
    if [ "${answer}" == "y" ]
    then
      echo "${RED} Cleaning up existing modules. Removing node_modules and yarn.lock..."
      rm -rf $MODULES_FOLDER
      rm -f "./yarn.lock"
    else
      echo "No clean up done. Using already installed modules..."
    fi
  fi
  # print the config
  $YARN_CMD config list
  check $? $YARN_CMD 'config list'

  # Install module dependencies
  $YARN_CMD install
  check $? ${LINENO}

popd

# patch the react-native/index.js file to remove the contstraints related to Picker added in later RN versions.
if [[ "$RN_VERSION" != "0.72.4" && $PROJECTNAME == "unifiedExample" ]]; then
  pushd "${SCRIPT_PATH}"/../"$PROJECTNAME"/"$PROJECTVERSION"/node_modules/react-native/
  patch < "${SCRIPT_PATH}"/../"$PROJECTNAME"/"$PROJECTVERSION"/patch/react_native_index.js.patch
  popd
fi

# ----------------------------------------------------------------------
# Phase 3: build (and/or Collate)the packages for the required platforms
# ----------------------------------------------------------------------
for platform in $BUILD_OS_LIST; do
  if [ $platform == $Web_OS ];
  then
    echo "Building for Web"

    pushd "${SCRIPT_PATH}"/../"$PROJECTNAME"/"$PROJECTVERSION"

    if [ -d ${SCRIPT_PATH}/../${PROJECTNAME}/${DIST_PATH} ]
    then
      echo "Deleting ${SCRIPT_PATH}/../${PROJECTNAME}/${DIST_PATH}"
      rm -rf "${SCRIPT_PATH}/../${PROJECTNAME}/${DIST_PATH}"
      check $? "Deleting ${SCRIPT_PATH}/../${PROJECTNAME}/${DIST_PATH}"
    fi

    if [ $PROJECTNAME == "refAppCommon" ];then
      # not to be changed for backward compatibility
      HOSTPATH="web-ref-app-${RN_VERSION}"
    else
      HOSTPATH="examples-${RN_VERSION}"
    fi

    $YARN_CMD web-prod
    check $? 'yarn web-prod'

    popd

    RESULT=$?
    if [ $RESULT -ne 0 ]; then
      echo -e "\033[1;31m  Build for Web/HbbTV failed. Returned $RESULT\033[0m" >&2
      exit $RESULT
    fi

    rm -rf "$EXPORT_FOLDER"/${HOSTPATH}*
    cp -rf "${SCRIPT_PATH}/../${PROJECTNAME}/${DIST_PATH}" "${EXPORT_FOLDER}/${HOSTPATH}"

    pushd "${EXPORT_FOLDER}"
    zip -r opy-rn-${PROJECTNAME}-web-production.zip ./${HOSTPATH}
    popd
  else
    if [[ $platform =~ $Apple_iOS || $platform =~ $Apple_tvOS ]]; then
      echo "Building for Apple"
      pushd "${SCRIPT_PATH}"/../"$PROJECTNAME"/"$PROJECTVERSION"/ios
      ARCHIVE_PATH="$EXPORT_FOLDER/opy-rn-${PROJECTNAME}-${platform}.xcarchive"
      SCHEME=${PROJECTNAME}

      #for tvOS, the scheme gets suffixed by platform, for ios it doesn't.
      if [[ $platform =~ $Apple_tvOS ]]; then
        SCHEME+="-$platform"
      fi

      #deleting DerivedData directory
      deleteDir ~/Library/Developer/Xcode/DerivedData
      check $? 'deleteDir DerivedData'

      # # copy the patch files which has patch to fix nvm issue. Try to find better workaround
      # if [[ "$RN_VERSION" == "0.67.4" && $platform =~ $Apple_iOS ]]; then
      #  echo "Copying patch file -- START --"
      #  pushd "${SCRIPT_PATH}"/../"$PROJECTNAME"/"$PROJECTVERSION"/node_modules/react-native/scripts
      #  patch < "${SCRIPT_PATH}"/../"$PROJECTNAME"/"$PROJECTVERSION"/patch/react_native_pods.rb.patch
      #  popd

      #   # print the content of patched file.
      #  ##########
      #  patchfilename=${SCRIPT_PATH}/../$PROJECTNAME/$PROJECTVERSION/node_modules/react-native/scripts/react_native_pods.rb
      #  echo "patchfilename: $patchfilename"
      #  value=`cat ${patchfilename}`
      #  echo "content of patched file name:"
      #  echo "$value"
      #  ############
      #  echo "Copying patch file -- End --"
      # fi

      if [ $IS_NEW_ARCH == true ];then
        echo "Building with new architecture"

        prepareNewArchBuild

        if [ -x /opt/homebrew/bin/rbenv ]; then
          echo "rbenv exists and is executable"
          sudo /opt/homebrew/bin/rbenv exec bundle install && RCT_NEW_ARCH_ENABLED=1 /opt/homebrew/bin/rbenv exec bundle exec pod install
        else
          echo "rbenv does not exist or is not executable"
          sudo bundle install && RCT_NEW_ARCH_ENABLED=1 bundle exec pod install
        fi
      else
        echo "Building with old architecture"
        if [ -x /opt/homebrew/bin/rbenv ]; then
          echo "rbenv exists and is executable"
          /opt/homebrew/bin/rbenv exec pod install
        else
          echo "rbenv does not exist or is not executable"
          pod install
        fi
      fi

      build_platform=$platform #saving build platform as it is before it converted into lower case.
      platform=$(echo $platform | tr "[A-Z]" "[a-z]")

      xcodebuild -workspace ${PROJECTNAME}.xcworkspace -scheme $SCHEME \
        -destination generic/platform=${platform} -VALIDATE_WORKSPACE=YES \
        -configuration Release -allowProvisioningUpdates -archivePath $ARCHIVE_PATH \
        ENABLE_BITCODE=NO ARCHS=arm64 archive
      RESULT=$?
      if [ $RESULT -ne 0 ]; then
        echo -e "\033[1;31m    archive failed. Returned $RESULT\033[0m" >&2
        exit $RESULT
      fi

      xcodebuild -exportArchive -allowProvisioningUpdates -archivePath $ARCHIVE_PATH \
        -exportOptionsPlist $EXPORT_PLIST_PATH -exportPath $EXPORT_FOLDER

      RESULT=$?
      if [ $RESULT -ne 0 ]; then
        echo -e "\033[1;31m  export for $platform failed. Returned $RESULT\033[0m" >&2
        exit $RESULT
      fi

      if [ $IS_NEW_ARCH == true ];then
        mv $EXPORT_FOLDER/$SCHEME.ipa $EXPORT_FOLDER/opy-rn-${PROJECTNAME}-${platform}-production_newArch.ipa
      else
        mv $EXPORT_FOLDER/$SCHEME.ipa $EXPORT_FOLDER/opy-rn-${PROJECTNAME}-${platform}-production.ipa
      fi

      #### Simulator related changes ----- starts ----- here.

      #We are already inside ios directory.
      SIM_BUILD_ARTIFACTS_DIR="simbuildartifacts"
      SIM_ARTIFACTS_NAME="opy-rn-${PROJECTNAME}-${platform}-simulator.zip"
      IOS_SIM_PLATFORM=iphonesimulator
      TVOS_SIM_PLATFORM=appletvsimulator
      SIM_PLATFORM=""
      # Build for X86_64 Simulator.
      if [[ $build_platform =~ $Apple_iOS || ($build_platform =~ $Apple_tvOS &&  "$RN_VERSION" != "0.67.4") ]]; then

        if [[ $build_platform =~ $Apple_iOS  ]]; then
          SIM_PLATFORM=$IOS_SIM_PLATFORM
        else
          SIM_PLATFORM=$TVOS_SIM_PLATFORM
        fi

        xcodebuild -workspace ${PROJECTNAME}.xcworkspace -scheme $SCHEME \
         -destination generic/platform=$SIM_PLATFORM \
          -configuration Release -derivedDataPath $SIM_BUILD_ARTIFACTS_DIR ARCHS=x86_64

        RESULT=$?
        if [ $RESULT -ne 0 ]; then
          echo -e "\033[1;31m (Simulator x86_64) build failed. Returned $RESULT\033[0m" >&2
          exit $RESULT
        fi

        # Undo the patch for 72
        if [[ "$RN_VERSION" != "0.72.4" ]]; then
          pushd "${SCRIPT_PATH}"/../"$PROJECTNAME"/"$PROJECTVERSION"
          $YARN_CMD postweb-prod
          popd
        fi

        #Need to make it proper for ios or tvos target.
        pushd simbuildartifacts/Build/Products/Release-$SIM_PLATFORM

        # PROJECTNAME will be either refAppCommon or unifiedExample
        if [[ $build_platform =~ $Apple_iOS ]]; then
          zip -r $SIM_ARTIFACTS_NAME "$PROJECTNAME.app"
        else
          zip -r $SIM_ARTIFACTS_NAME "$PROJECTNAME-tvOS.app"
        fi

        cp -f $SIM_ARTIFACTS_NAME $EXPORT_FOLDER
        popd
      fi

      ##### Remove it once done.
      if [ -d "$SIM_BUILD_ARTIFACTS_DIR" ]; then
        echo "simulator build artifacts dir $SIM_BUILD_ARTIFACTS_DIR exists. Deleting it."
	      rm -rf $SIM_BUILD_ARTIFACTS_DIR
	      check $? ${LINENO}
      fi
      #### Simulator related changes ----- ends ----- here.

      popd
    else
      echo "Building for Android"
      pushd "${SCRIPT_PATH}"/../"$PROJECTNAME"/"$PROJECTVERSION"/"$Android_OS"

      PATH=$HOME/.nvm/versions/node/versions/v14.17.1/bin:$PATH

      if [ $PROJECTNAME == "refAppCommon" ];then
        bash ./gradlew clean :app:exportReleaseApk
        if [ $RN_VERSION == "0.72.4" ];then
           build_newArchitecture
        fi
      else
        bash ./gradlew clean :app:assembleRelease
        bash ./gradlew copyApk
      fi

      # Undo the patch for 72
      if [[ "$RN_VERSION" != "0.72.4" ]]; then
        pushd "${SCRIPT_PATH}"/../"$PROJECTNAME"/"$PROJECTVERSION"
        $YARN_CMD postweb-prod
        popd
      fi

      RESULT=$?
      if [ $RESULT -ne 0 ]; then
        echo -e "\033[1;31m  export for $platform failed. Returned $RESULT\033[0m" >&2
        exit $RESULT
      fi
      popd
    fi
  fi
done
