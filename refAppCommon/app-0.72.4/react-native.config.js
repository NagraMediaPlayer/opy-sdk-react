module.exports = {
    project: {
        android: {
            sourceDir: './android',
            unstable_reactLegacyComponentNames: [
                // list of conponents that needs to be wrapped by the interop layer
                //"RNCOTVPlayerView"
            ]
        },
        ios: {
            sourceDir: './ios',
            unstable_reactLegacyComponentNames: [
                // list of conponents that needs to be wrapped by the interop layer
                // "OTVPlayerView"
            ]
        }
    }
}
