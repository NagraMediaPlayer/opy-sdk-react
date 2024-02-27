#!/bin/bash

[ ${0:0:1} = / ] && SCRIPT_PATH=$0 || SCRIPT_PATH=$PWD/$0
SCRIPT_PATH=${SCRIPT_PATH%/*}
YARN_CMD="$HOME/.nvm/nvm-exec yarn"
if [ -d "$HOME/.nvm" ]; then
	echo "${RED}Building on Linux or Mac device"
else
	YARN_CMD="yarn"
fi

LIBRARYNAME="RNOTVPlayer"
NODEMODULENAME="react-otvplayer-$2"
EXAMPLESNAME="examples"

# Use the $2 argument as version. (For example: 0.72.4)
FOLDERNAME="react-native-otvplayer/otvplayer-$2"
EXPORT_FOLDER=$SCRIPT_PATH"/../exportFolder"
EXPORT_PLIST_PATH=$SCRIPT_PATH"/export_options/Development.plist"
MODULES_FOLDER="./node_modules"
# Use the $2 argument as version. (For example: 0.72.4)
DIST_PATH=$SCRIPT_PATH"/../react-native-otvplayer/dist/$2"
# Path of the dist template files
DIST_TEMPLATE_PATH=$SCRIPT_PATH"/../react-native-otvplayer/otvplayer-$2/distTemplate"
RED="\033[1;31m"
NORMAL="\033[0m"
RN_VERSION=$2

#For node 18 support
export NODE_OPTIONS=--openssl-legacy-provider

function display_help()
{
  echo -e "\033[1mUSAGE:\033[0m"
  echo "  $(basename "$0") [ios | tvos | android | web | collate | all ] <react-native-version>"
  echo
  echo "Build the React Native OTVPlayer for a particular platform with RN version folder"
  echo "and/or collate the components into a zip."
  echo
  echo "Example:"
  echo "        $(basename "$0") all [0.67.4 | 0.72.4]"
  echo -e "\033[1mOptions\033[0m"
  echo "[-h] : Show this help"
  echo "    $(basename "$0")"
  echo
}

function build_android() {
	echo "*** building Android ***"

	PLATFORM_FOLDER="android"
	pushd "${SCRIPT_PATH}"/../"$FOLDERNAME"/"$PLATFORM_FOLDER"
	rm -rf build "$DIST_PATH/android"

	./gradlew build
	check $? ${LINENO}

	mkdir -p "$DIST_PATH/android/libs"
	check $? ${LINENO}

	cp -rf 'build-alt.gradle' "$DIST_PATH/android/build.gradle"
	check $? ${LINENO}

	cp -rf './build/outputs/aar/react-otvplayer-debug.aar' "$DIST_PATH/android/libs"
	check $? ${LINENO}

	cp -rf './build/outputs/aar/react-otvplayer-release.aar' "$DIST_PATH/android/libs"
	check $? ${LINENO}

	cp -rf './libs/otvsdk.aar' "$DIST_PATH/android/libs"
	check $? ${LINENO}

	cp -rf './libs/build-alt.gradle' "$DIST_PATH/android/libs/build.gradle"
	check $? ${LINENO}

	popd

	RESULT=$?
	if [ $RESULT -ne 0 ]; then
		echo -e "\033[1;31m    build failed. Returned $RESULT\033[0m" >&2
		exit $RESULT
	fi

	# Copy Android template files into package
	cp -rf "$DIST_TEMPLATE_PATH/android/src" "$DIST_PATH/android/"
}

function build_ios() {
	echo "*** building iOS ***"

	PLATFORM_FOLDER="ios"
	pushd "${SCRIPT_PATH}"/../"$FOLDERNAME"/"$PLATFORM_FOLDER"
	rm -rf ~/Library/Developer/Xcode/DerivedData
	rm -rf build "$DIST_PATH/ios"

	if [ "$RN_VERSION" = "0.67.4" ]; then
        PATCH_FILE_NAME="react-native+0.67.4.patch"
	else
        PATCH_FILE_NAME="react-native+0.63.4-0.patch"
	fi

	echo "Applying patch file -- START --"

	pushd "${SCRIPT_PATH}/../$FOLDERNAME"
    patch -p1 < ${SCRIPT_PATH}/../$FOLDERNAME/patches/${PATCH_FILE_NAME}
    popd

	echo "Applying patch file -- End --"

	if [ -x /opt/homebrew/bin/rbenv ]; then
		/opt/homebrew/bin/rbenv exec pod install
	else
		pod install
	fi
	check $? ${LINENO}

	SCHEME=$LIBRARYNAME
	OSSDK="iphoneos"

	# build for ios device.
	xcodebuild -workspace ReactOtvplayer.xcworkspace clean build -configuration Release -scheme $SCHEME -sdk iphoneos ARCHS='arm64'
	check $? ${LINENO}

	#create a directory to keep the device library libRNOTVPlayer.a with same name.
	DIR_NAME_DEVICE="device"
	mkdir -p "$DIST_TEMPLATE_PATH/../ios/libs/$DIR_NAME_DEVICE"
	cp -f "$DIST_TEMPLATE_PATH/../ios/libs/libRNOTVPlayer.a" "$DIST_TEMPLATE_PATH/../ios/libs/$DIR_NAME_DEVICE/"

	#build for ios simulator (ARM64)
	xcodebuild -workspace ReactOtvplayer.xcworkspace clean build -configuration Release -scheme $SCHEME -sdk iphonesimulator  ARCHS='arm64'
	check $? ${LINENO}

 	#create a directory to keep the device library libRNOTVPlayer.a with same name.
	DIR_NAME_SIM="simulator"
	DIR_NAME_SIM_ARM64="$DIR_NAME_SIM/sim_arm64"
	mkdir -p "$DIST_TEMPLATE_PATH/../ios/libs/$DIR_NAME_SIM_ARM64"
	cp -f "$DIST_TEMPLATE_PATH/../ios/libs/libRNOTVPlayer.a" "$DIST_TEMPLATE_PATH/../ios/libs/$DIR_NAME_SIM_ARM64/"

	#build for ios simulator (X86_64)
	xcodebuild -workspace ReactOtvplayer.xcworkspace clean build -configuration Release -scheme $SCHEME -sdk iphonesimulator  ARCHS='x86_64'
	check $? ${LINENO}

	#create a directory to keep the device library libRNOTVPlayer.a with same name.
	DIR_NAME_SIM_X86_64="$DIR_NAME_SIM/sim_x86_64"
	mkdir -p "$DIST_TEMPLATE_PATH/../ios/libs/$DIR_NAME_SIM_X86_64"
	cp -f "$DIST_TEMPLATE_PATH/../ios/libs/libRNOTVPlayer.a" "$DIST_TEMPLATE_PATH/../ios/libs/$DIR_NAME_SIM_X86_64/"

	#remove the library libRNOTVPlayer.a inside ios/libs directory
	rm -f "$DIST_TEMPLATE_PATH/../ios/libs/libRNOTVPlayer.a"

	#Generate the fat library containing both variant of simulator library.
	lipo -create $DIST_TEMPLATE_PATH/../ios/libs/$DIR_NAME_SIM_ARM64/libRNOTVPlayer.a  $DIST_TEMPLATE_PATH/../ios/libs/$DIR_NAME_SIM_X86_64/libRNOTVPlayer.a -output $DIST_TEMPLATE_PATH/../ios/libs/$DIR_NAME_SIM/libRNOTVPlayer.a

	mkdir -p "$DIST_PATH/ios"

	#Create the Xcframework containing iphone device library as well as simulator (both arm64 and X86_64)
	xcodebuild -create-xcframework \
		-library $DIST_TEMPLATE_PATH/../ios/libs/$DIR_NAME_DEVICE/libRNOTVPlayer.a  \
		-library $DIST_TEMPLATE_PATH/../ios/libs/$DIR_NAME_SIM/libRNOTVPlayer.a \
		-output $DIST_TEMPLATE_PATH/../ios/libs/libRNOTVPlayer.xcframework

	popd

	RESULT=$?
	if [ $RESULT -ne 0 ]; then
		echo -e "\033[1;31m    build failed. Returned $RESULT\033[0m" >&2
		exit $RESULT
	fi

	# Copy iOS template files into package

	mkdir -p "$DIST_PATH/ios"

	cp -rf "$DIST_TEMPLATE_PATH/ios" "$DIST_PATH/"
	check $? ${LINENO}

	cp -f "$DIST_TEMPLATE_PATH/React-otvplayer.podspec" "$DIST_PATH/"
	check $? ${LINENO}

	cp -rf "$DIST_TEMPLATE_PATH/../ios/libs/OPYSDKFPS.xcframework" "$DIST_PATH/ios/"
	check $?

	cp -rf "$DIST_TEMPLATE_PATH/../ios/libs/libRNOTVPlayer.xcframework" "$DIST_PATH/ios/"

	check $?
}

function build_tvos(){
	echo "*** building tvOS ***"

	PLATFORM_FOLDER="ios"
	pushd "${SCRIPT_PATH}"/../"$FOLDERNAME"/"$PLATFORM_FOLDER"
	rm -rf ~/Library/Developer/Xcode/DerivedData
	rm -rf build "$DIST_PATH/tvos"

	if [ -x /opt/homebrew/bin/rbenv ]; then
		/opt/homebrew/bin/rbenv exec pod install
	else
		pod install
	fi
	check $? ${LINENO}

	SCHEME="$LIBRARYNAME-tvOS"

	xcodebuild -workspace ReactOtvplayer.xcworkspace clean build  -configuration Release -scheme $SCHEME -sdk appletvos ARCHS='arm64'
	check $? ${LINENO}
	#create a directory to keep the device library libRNOTVPlayer-tvOS.a with same name.
	DIR_NAME_DEVICE="device"
	mkdir -p "$DIST_TEMPLATE_PATH/../ios/libs/$DIR_NAME_DEVICE"
	cp -f "$DIST_TEMPLATE_PATH/../ios/libs/libRNOTVPlayer-tvOS.a" "$DIST_TEMPLATE_PATH/../ios/libs/$DIR_NAME_DEVICE/"

	#build for ios simulator (ARM64)
	xcodebuild -workspace ReactOtvplayer.xcworkspace clean build  -configuration Release -scheme $SCHEME -sdk appletvsimulator ARCHS='arm64'
	check $? ${LINENO}

 	#create a directory to keep the device library libRNOTVPlayer-tvOS.a with same name.
	DIR_NAME_SIM="simulator"
	DIR_NAME_SIM_ARM64="$DIR_NAME_SIM/sim_arm64"
	mkdir -p "$DIST_TEMPLATE_PATH/../ios/libs/$DIR_NAME_SIM_ARM64"
	cp -f "$DIST_TEMPLATE_PATH/../ios/libs/libRNOTVPlayer-tvOS.a" "$DIST_TEMPLATE_PATH/../ios/libs/$DIR_NAME_SIM_ARM64/"

	#build for ios simulator (x86_64)
	xcodebuild -workspace ReactOtvplayer.xcworkspace clean build  -configuration Release -scheme $SCHEME -sdk appletvsimulator ARCHS='x86_64'
	check $? ${LINENO}

 	#create a directory to keep the device library libRNOTVPlayer-tvOS.a with same name.
	DIR_NAME_SIM="simulator"
	DIR_NAME_SIM_X86_64="$DIR_NAME_SIM/sim_x86_64"
	mkdir -p "$DIST_TEMPLATE_PATH/../ios/libs/$DIR_NAME_SIM_X86_64"
	cp -f "$DIST_TEMPLATE_PATH/../ios/libs/libRNOTVPlayer-tvOS.a" "$DIST_TEMPLATE_PATH/../ios/libs/$DIR_NAME_SIM_X86_64/"

	#remove the library libRNOTVPlayer.a inside ios/libs directory
	rm -f "$DIST_TEMPLATE_PATH/../ios/libs/libRNOTVPlayer-tvOS.a"

	#Generate the fat library containing both variant of simulator library.
	lipo -create $DIST_TEMPLATE_PATH/../ios/libs/$DIR_NAME_SIM_ARM64/libRNOTVPlayer-tvOS.a  $DIST_TEMPLATE_PATH/../ios/libs/$DIR_NAME_SIM_X86_64/libRNOTVPlayer-tvOS.a -output $DIST_TEMPLATE_PATH/../ios/libs/$DIR_NAME_SIM/libRNOTVPlayer-tvOS.a

	#Create the Xcframework containing iphone device library as well as simulator (both arm64 and X86_64)
	xcodebuild -create-xcframework \
		-library $DIST_TEMPLATE_PATH/../ios/libs/$DIR_NAME_DEVICE/libRNOTVPlayer-tvOS.a  \
		-library $DIST_TEMPLATE_PATH/../ios/libs/$DIR_NAME_SIM/libRNOTVPlayer-tvOS.a \
		-output $DIST_TEMPLATE_PATH/../ios/libs/libRNOTVPlayer-tvOS.xcframework

	popd

	RESULT=$?
	if [ $RESULT -ne 0 ]; then
		echo -e "\033[1;31m    build failed. Returned $RESULT\033[0m" >&2
		exit $RESULT
	fi

	# Copy tvOS template files into package
	mkdir -p "$DIST_PATH/tvos"

	cp -rf "$DIST_TEMPLATE_PATH/ios" "$DIST_PATH/"
	check $? ${LINENO}

	cp -f "$DIST_TEMPLATE_PATH/React-otvplayer.podspec" "$DIST_PATH/"
	check $? ${LINENO}


	cp -rf "$DIST_TEMPLATE_PATH/../ios/libs/OPYSDKFPS.xcframework" "$DIST_PATH/tvos/OPYSDKFPSTv.xcframework"
	check $?

	cp -rf "$DIST_TEMPLATE_PATH/../ios/libs/libRNOTVPlayer-tvOS.xcframework" "$DIST_PATH/tvos/"
	check $?
}

function build_web() {
	echo "*** building web ***"

	PLATFORM_FOLDER="web"

	$YARN_CMD build-web-publish
	check $? ${LINENO}

	RESULT=$?
	if [ $RESULT -ne 0 ]; then
		echo -e "\033[1;31m    build failed. Returned $RESULT\033[0m" >&2
		exit $RESULT
	fi
}


function collate() {
	echo "*** Collating builds, and examples, into exportFolder ***"

	if [! -d "${DIST_PATH}"]; then
		echo "${RED}ERROR: trying to collate before builds are generated"
		exit -1
	fi

	# Place all atrifacts to export
	cp -rf "${DIST_PATH}" "${EXPORT_FOLDER}/$NODEMODULENAME"
	check $? ${LINENO}

	cp -rf "${SCRIPT_PATH}/../unifiedExample/src" "${EXPORT_FOLDER}/$EXAMPLESNAME"
	check $? ${LINENO}

	# TO DO: copy Examples without node_modules
	# For now, node_modules deleted only after copying as the developers would still need them
	# but packaging does not. Revisit later to improve this, as the copying of node_modules is
	# unncessary and will take considerable amount of time!!!
	rm -rf "${EXPORT_FOLDER}/$EXAMPLESNAME/web/node_modules"
	check $? ${LINENO}

	rm -f "${EXPORT_FOLDER}/$EXAMPLESNAME/web/yarn.lock"
	check $? ${LINENO}

	rm -f "${EXPORT_FOLDER}/$EXAMPLESNAME/web/.yarnrc"
	check $? ${LINENO}

	rm -f "${EXPORT_FOLDER}/$EXAMPLESNAME/web/.npmrc"
	check $? ${LINENO}

	pushd "${EXPORT_FOLDER}"

		zip -r $NODEMODULENAME.zip ./$NODEMODULENAME
		check $? ${LINENO}

		zip -r $EXAMPLESNAME.zip ./$EXAMPLESNAME
		check $? ${LINENO}

	popd
}

function check(){
	if [ $1 -ne 0 ]; then
		echo -e "${RED} Command failed at line $2, please check the error.${NORMAL}"
		exit -1
	fi
}

# ----------------------------------------
# Phase 1: Check pre-requisites and params
# ----------------------------------------

if [ "$#" -ne 2 ];then
  echo -e "\033[1;31m Try again. See Usage Below.\033[0m"
  display_help
  exit 0
fi

if [ "$1" != "ios" ] && [ "$1" != "tvos" ] && [ "$1" != "android" ] && [ "$1" != "web" ] && [ "$1" != "collate" ] && [ "$1" != "all" ]; then
  echo -e "\033[1;31m Try again. See Usage Below.\033[0m"
  display_help
  exit 0
fi

SCHEME=""
OSSDK=""
echo "EXPORT_FOLDER=$EXPORT_FOLDER"
echo "EXPORT_PLIST_PATH=$EXPORT_PLIST_PATH"

if [ -d "$EXPORT_FOLDER" ]; then
	rm -rf "$EXPORT_FOLDER"/*
	check $? ${LINENO}
else
	mkdir "$EXPORT_FOLDER"
	check $? ${LINENO}
fi

# --------------------------------------------------------------------
# Phase 2: manage installation of dependency packages and node_modules
# --------------------------------------------------------------------

pushd "${SCRIPT_PATH}"/../"$FOLDERNAME"

$YARN_CMD config list

if [ -d $MODULES_FOLDER ]
then
	# ask if cleanup is required
	read -t 5 -n 1 -p "Would you like to delete node_modules. Continue (y/N)? " answer
	echo

	# if answer is yes within 15 seconds start updating cluster nodes ...
	if [ "${answer}" == "y" ]
	then
		echo "${RED} Cleaning up exisitng modules. Removing node_modules and yarn.lock..."
		rm -rf $MODULES_FOLDER
		rm -f "./yarn.lock"

		# Install module dependencies
		$YARN_CMD install
		check $? ${LINENO}
	else
		echo "No Cleanup done. Using already installed modules..."
	fi
else
	# Install module dependencies
	$YARN_CMD install
	check $? ${LINENO}
fi

echo "webpacking js plugin component for handheld."
echo "If you require debug version use 'yarn build-handheld-dev'"
$YARN_CMD build-handheld-prod
check $? ${LINENO}

# ----------------------------------------------------------------------
# Phase 3: build (and/or Collate)the packages for the required platforms
# ----------------------------------------------------------------------
if [[ $1 =~ "ios" ]]
then
	build_ios
elif [[ $1 =~ "tvos" ]]
then
	build_tvos
elif [[ $1 =~ "android" ]]
then
	build_android
elif [[ $1 =~ "web" ]]
then
	build_web
elif [[ $1 =~ "all" ]]
then
	build_ios
	build_tvos
	build_android
	build_web
	collate
elif [[ $1 =~ "collate" ]]
then
	collate
fi
