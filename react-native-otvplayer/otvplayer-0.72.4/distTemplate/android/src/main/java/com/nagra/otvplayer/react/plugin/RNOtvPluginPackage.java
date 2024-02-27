// Copyright (c) 2020--2023 Nagravision SA. All rights reserved.
package com.nagra.otvplayer.react.plugin;

import androidx.annotation.NonNull;
import com.nagra.otvplayer.react.OTVSDKManager;
import com.nagra.otvplayer.react.OTVDRMManager;
import com.nagra.otvplayer.react.ReactOTVPlayerViewManager;

import com.facebook.react.ReactPackage;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.uimanager.ViewManager;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

public class RNOtvPluginPackage implements ReactPackage {

    @NonNull
    @Override
    public List<NativeModule> createNativeModules(@NonNull ReactApplicationContext reactContext) {
        List<NativeModule> modules = new ArrayList<>();

        modules.add(new OTVSDKManager(reactContext));
        modules.add(new OTVDRMManager(reactContext));

        return modules;
    }

    @NonNull
    @Override
    public List<ViewManager> createViewManagers(@NonNull ReactApplicationContext reactContext) {
        return Arrays.<ViewManager>asList(
                new ReactOTVPlayerViewManager()
        );
    }
}