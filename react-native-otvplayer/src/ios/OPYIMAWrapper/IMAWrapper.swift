// Copyright (c) 2020--2023 Nagravision SA. All rights reserved.
/**
 * IMAWrapper.swift
 */

import Foundation
import AVFoundation
import GoogleInteractiveMediaAds
@objc public class IMAWrapper: NSObject {

  /// :nodoc:
  // swiftlint:disable:next weak_delegate
  internal let delegate: IMAWrapperDelegate
  /// :nodoc:
  internal var imaAdsLoader: IMAAdsLoader?
  /// :nodoc:
  internal var imaAdsManager: IMAAdsManager?
  private var contentPlayhead: IMAAVPlayerContentPlayhead?
  private var companionAdViews: [IMAWrapperCompanionAdContainer]?
  private var contentPlayer: AVPlayer?
  private var adsUIView: UIView?
  private var adTagURL: String?
  private let imaWrapperBuilder: IMAWrapperBuilder
  private let imaWrapperAdsSettings: IMAWrapperAdsSettings

  /**
   Initializer for the `IMAWrapper`, startService() is called here and the player content
   is paused.

   - parameter playerDetails: a struct storing player details to initalize the wrapper
   - parameter delegate: a reference to the object that implements the
   `IMAWrapperDelegate` protocol
   */
  @objc public convenience init(withPlayerDetails playerDetails: IMAWrapperPlayerDetails,
                   withDelegate delegate: IMAWrapperDelegate) {
    self.init(playerDetails, delegate, IMAWrapperAdsSettings(), IMAWrapperBuilder())
  }

  /**
   Initializer for the `IMAWrapper`, startService() is called here and the player content
   is paused.

   - parameter playerDetails: a struct storing player details to initalize the wrapper
   - parameter delegate: a reference to the object that implements the
   `IMAWrapperDelegate` protocol
   - parameter settings: a reference to the IMAWrapperAdsSettings which control the
   production of the IMASettings.
   */
  @objc public convenience init(withPlayerDetails playerDetails: IMAWrapperPlayerDetails,
                   withDelegate delegate: IMAWrapperDelegate,
                   withSettings settings: IMAWrapperAdsSettings) {
    self.init(playerDetails, delegate, settings, IMAWrapperBuilder())
  }

  /**
   Deinitializer for the `IMAWrapper`, stopService() is called here.
   */
  @objc deinit {
    stopService()
    contentPlayer = nil
    adsUIView = nil
    adTagURL = nil
    companionAdViews?.removeAll()
    companionAdViews = nil
  }

  /**
   Internal Designator Initializer for the `IMAWrapper`. The `IMAWrapper` should be
   initialized by the convinence constructors.
   
   startService() is called here and the player content is paused.

   - parameter playerDetails: a struct storing player details to initalize the wrapper
   - parameter delegate: a reference to the object that implements the
   `IMAWrapperDelegate` protocol
   - parameter settings: a reference to the IMAWrapperAdsSettings which control the
   production of the IMASettings.
   - parameter builder: for internal use only, leave unspecified.
   */
  init( _ playerDetails: IMAWrapperPlayerDetails,
        _ delegate: IMAWrapperDelegate,
        _ settings: IMAWrapperAdsSettings, 
        _ builder: IMAWrapperBuilder) {
    
    self.delegate = delegate
    contentPlayer = playerDetails.contentPlayer
    adsUIView = playerDetails.adsUIView
    adTagURL = playerDetails.adTagURL
    companionAdViews = playerDetails.companionAdViews
    
    imaWrapperBuilder = builder
    imaWrapperAdsSettings = settings
    super.init()
    startService()
    delegate.pauseContent()
  }

  /// :nodoc:
  @objc func contentDidFinishPlaying(_ notification: Notification) {
    // Make sure we don't call contentComplete as a result of an ad completing.
    if let playerItem = notification.object as? AVPlayerItem, playerItem == contentPlayer?.currentItem {
      imaAdsLoader?.contentComplete()
    }
  }
  
  private func buildCompanionAdsSlots() -> [IMACompanionAdSlot] {
    var companionAdSlots = [IMACompanionAdSlot]()

    if let adviews = companionAdViews {
      for view in adviews {
        companionAdSlots.append(imaWrapperBuilder.createIMACompanionAdSlot(view))
      }
    }
    return companionAdSlots
  }

  /**
   Request the `IMAWrapper` instance to start the process of scheduling adverts.

   - note: The `IMAWrapper` instance will obtain the necessary information from
   the delegate.
   */
  @objc public func requestAds() -> Bool {
    var needToCallResume: Bool = false

    if let adUrl = adTagURL {
      if adUrl.isEmpty {
        needToCallResume = true
      }
      else {
        let companionAdSlots = buildCompanionAdsSlots()

        // Create ad display container for ad rendering.
        let adDisplayContainer = IMAAdDisplayContainer(adContainer: adsUIView, companionSlots: companionAdSlots)
        // Create an ad request with our ad tag, display container, and optional user context.
        let request = IMAAdsRequest(
          adTagUrl: adUrl,
          adDisplayContainer: adDisplayContainer,
          contentPlayhead: contentPlayhead,
          userContext: nil)

        imaAdsLoader?.requestAds(with: request)
      }
    }
    else {
      needToCallResume = true
    }

    if needToCallResume {
      delegate.resumeContent()
    }

    return !needToCallResume
  }

  /**
   Initialise the `IMAWrapper` instance before scheduling adverts.
   Existing scheduling will be cancelled.

   - note: The `IMAWrapper` instance will obtain the necessary information from
   the delegate.
   */
  @objc func startService() {
    stopService()
    if let contentPlayer = self.contentPlayer {
      contentPlayhead =  imaWrapperBuilder.createIMAAVPlayerContentPlayhead(contentPlayer: contentPlayer)
    }
    NotificationCenter.default.addObserver(
      self,
      selector: #selector(IMAWrapper.contentDidFinishPlaying(_:)),
      name: NSNotification.Name.AVPlayerItemDidPlayToEndTime,
      object: contentPlayer?.currentItem)

    imaAdsLoader = imaWrapperBuilder.createIMAAdsLoader(settings: imaWrapperAdsSettings.settings)
    imaAdsLoader?.delegate = self
  }

  /**
   Cancel any existing scheduling of adverts.
   If adverts are currently playing they would be stopped
   */
  func stopService() {
    if imaAdsManager != nil {
      imaAdsManager?.destroy()
      imaAdsManager?.delegate = nil
    }
    if imaAdsLoader != nil {
      imaAdsLoader?.delegate = nil
    }
  }

  /**
   Resume ads that were paused (due to moving to background)
   */
  func resumeAds() {
    imaAdsManager?.resume()
  }

  /**
   Pause ads (due to moving to background)
   */
  func pauseAds() {
    imaAdsManager?.pause()
  }
}

