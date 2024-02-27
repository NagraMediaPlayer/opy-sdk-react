// Copyright (c) 2020--2023 Nagravision SA. All rights reserved.
// import { ThumbnailStyle, ThumbnailType } from '../OTVPlayer';
import { ErrorHandler, PluginErrorCode } from "./common/ErrorHandler";
import {
  PlatformTypes,
  ErrorCodeTypes,
  PluginErrorParam,
  OTTPlayerStates,
} from "./common/interface";
import { OTVSDK_LOGLEVEL as LOG_LEVEL } from "./../common/enums";
import { Logger } from "./../Logger";
import { OTTHelper } from "./OTTHelper";

class Thumbnail {
  private logger: Logger = new Logger();
  private _thumbnailTracks: number[];
  private _errorHandler: ErrorHandler;
  private _playerInstance: any;
  static readonly DEFAULT_BORDER_COLOR: string = "black";

  public initialiseThumbnailClass(playerInstance: any, errorHandler: any) {
    this._playerInstance = playerInstance;
    this._errorHandler = errorHandler;
  }

  public resetThumbnailProperties() {
    this._thumbnailTracks = null;
  }

  public createThumbnailContainerAndAttach(attachNode: string) {
    const thumbnailContainer = document.createElement("div");
    if (thumbnailContainer) {
      thumbnailContainer.id = "thumbnailContainer";
      thumbnailContainer.style.position = "absolute";
      thumbnailContainer.style.backgroundRepeat = "no-repeat";
      thumbnailContainer.style.display = "none";
      document.getElementById(attachNode)?.appendChild(thumbnailContainer);
    } else {
      this.logger.log(LOG_LEVEL.ERROR, "thumbnailContainer is not created!!!");
    }
  };

  public checkThumbnailAvailableAndTriggerEvent(onAvailable: Function) {
    this.logger.log(
      LOG_LEVEL.DEBUG,
      "OTT.ts: checkThumbnailAvailable(): ",
      "checkThumbnailAvailable triggered"
    );
    if (!OTTHelper.isCurrentPlatform(PlatformTypes.PC_SAFARI)) {
      this._thumbnailTracks =
        this._playerInstance.tech_.shaka_.getImageTracks();
      if (this._thumbnailTracks.length) {
        // fire when thumbnails are available for given stream
        onAvailable();
      }
    }
  }

  private _isThumbnailAvailableForTrack() {
    if (this._thumbnailTracks && this._thumbnailTracks.length > 0) {
      return true;
    } else {
      if (this._thumbnailTracks) {
        this.logger.log(LOG_LEVEL.ERROR, "thumbnails are not available");
        this._constructAndThrowError(ErrorCodeTypes.PLUGIN, {
          errorCode: PluginErrorCode.THUMBNAIL_NOT_AVAILABLE_ERROR,
          errorMessage: "Thumbnail tracks are not available",
        });
      } else {
        this.logger.log(LOG_LEVEL.ERROR, "thumbnail status unknown");
        this._constructAndThrowError(ErrorCodeTypes.PLUGIN, {
          errorCode: PluginErrorCode.THUMBNAIL_STATUS_UNKNOWN_ERROR,
          errorMessage: "Thumbnail status unknown",
        });
      }
      return false;
    }
  }

  private _isThumbnailStyleValid(style: any) {
    if (style) {
      let errorMessage = "";
      this.logger.log(
        LOG_LEVEL.DEBUG,
        `top: ${style.top}, left: ${style.left}, width: ${style.width}, height: ${style.height},
                borderColor: ${style.borderColor}, borderWidth: ${style.borderWidth}`
      );

      if (style.top === undefined || style.top === Infinity || style.top < 0)
        errorMessage += ` Thumbnail top is ${style.top}`;
      if (style.left === undefined || style.left === Infinity || style.left < 0)
        errorMessage += ` Thumbnail left is ${style.left}`;
      if (!style.width) errorMessage += ` Thumbnail width is ${style.width}`;
      if (!style.height) errorMessage += ` Thumbnail height is ${style.height}`;

      if (errorMessage) {
        this._constructAndThrowError(ErrorCodeTypes.PLUGIN, {
          errorCode: PluginErrorCode.THUMBNAIL_STYLING_ERROR,
          errorMessage: errorMessage,
        });
        this._showOrHideThumbnailContainer("none");
        return false;
      } else {
        return true;
      }
    } else {
      this._constructAndThrowError(ErrorCodeTypes.PLUGIN, {
        errorCode: PluginErrorCode.THUMBNAIL_STYLING_ERROR,
        errorMessage: `Error : Thumbnail Style is ${style}`,
      });
      this._showOrHideThumbnailContainer("none");
      return false;
    }
  }

  private _isThumbnailPositionValid(position: number) {
    const seekableRange = OTTHelper.getAvailableSeekableRange(
      this._playerInstance
    );
    if (
      position < 0 ||
      position === undefined ||
      position === null ||
      position > seekableRange.end
    ) {
      this._constructAndThrowError(ErrorCodeTypes.PLUGIN, {
        errorCode: PluginErrorCode.THUMBNAIL_POSITION_ERROR,
        errorMessage: "Invalid position error",
      });
      this._showOrHideThumbnailContainer("none");

      return false;
    }
    return true;
  }

  private _constructAndThrowError(errorCodeType, errorObj: PluginErrorParam) {
    this._errorHandler.triggerError(errorCodeType, errorObj);
  }

  public setThumbnailProperties(props: any, playerState) {
    if (
      playerState === OTTPlayerStates.UNINITIALISED ||
      playerState === OTTPlayerStates.INITIALISED ||
      playerState === OTTPlayerStates.INITIALISING ||
      playerState === OTTPlayerStates.PLAY_REQUESTED
    ) {
      // this thumbnail position setter function will be called from initialiseSDKPlayerSuccessCallback
      return;
    }
    if (props.display) {
      if (this._isThumbnailAvailableForTrack()) {
        if (this._isThumbnailStyleValid(props.style)) {
          this.setThumbnailStyle(props.style);
          if (this._isThumbnailPositionValid(props.positionInSeconds))
            this.setThumbnailPosition(props.positionInSeconds, props.style);
        }
      }
    } else {
      this._showOrHideThumbnailContainer("none");
    }
  };

  private thumbnailHandler(thumbnailObject, style) {
    if (thumbnailObject) {
      let thumbnailContainer = this._getContainerElement();
      if (thumbnailContainer) {
        const that = this;
        let imgTag = document.createElement("img");
        imgTag.id = "image";
        imgTag.src = thumbnailObject.url;
        imgTag.onload = () => {
          that._updateContainerStyle(thumbnailContainer, imgTag, thumbnailObject, style);
        };
      } else {
        this.logger.log(LOG_LEVEL.ERROR, "thumbnailContainer not Found");
      }
    } else {
      this._constructAndThrowError(ErrorCodeTypes.PLUGIN, {
        errorCode: PluginErrorCode.THUMBNAIL_ITEM_ERROR,
        errorMessage: `Thumbnail Object is ${thumbnailObject}`,
      });
      return;
    }
  }

  private _updateContainerStyle(thumbnailContainer, imgTag, thumbnailObject, style) {
    let widthFactor = style.width / thumbnailObject.width;
    let heightFactor = style.height / thumbnailObject.height;
    this.logger.log(
      LOG_LEVEL.DEBUG,
      `widthFactor: ${widthFactor}, heightFactor: ${heightFactor}`
    );

    let resizedThumbnailWidth = widthFactor * imgTag.naturalWidth;
    let resizedThumbnailHeight = heightFactor * imgTag.naturalHeight;

    let resizedThumbnailX = widthFactor * thumbnailObject.x;
    let resizedThumbnailY = heightFactor * thumbnailObject.y;

    this.logger.log(
      LOG_LEVEL.DEBUG,
      `resizedThumbnailWidth: ${resizedThumbnailWidth},
                            resizedThumbnailHeight: ${resizedThumbnailHeight}`
    );
    thumbnailContainer.style.backgroundImage = `url(${thumbnailObject.url})`;
    // By resizing backgroundSize, the entire image collage gets resized
    thumbnailContainer.style.backgroundSize = `${resizedThumbnailWidth}px ${resizedThumbnailHeight}px`;
    // After resizing the entire image, x and y of the thumbnail also change. Hence, resizing backgroundPosition
    thumbnailContainer.style.backgroundPosition = `-${resizedThumbnailX}px -${resizedThumbnailY}px`;
  }

  public setThumbnailStyle(style: any) {
    this.logger.log(LOG_LEVEL.DEBUG, "OTT.ts: set thumbnailStyle: ");
    const thumbnailContainerStyle =
      this._getContainerElement()?.style;
    if (thumbnailContainerStyle) {
      thumbnailContainerStyle.top = `${style.top}px`;
      thumbnailContainerStyle.left = `${style.left}px`;
      thumbnailContainerStyle.width = `${style.width}px`;
      thumbnailContainerStyle.height = `${style.height}px`;
      thumbnailContainerStyle.borderStyle = style.borderWidth ? "solid" : "none";
      thumbnailContainerStyle.borderWidth = style.borderWidth
        ? `${style.borderWidth}px`
        : "none";
      thumbnailContainerStyle.borderColor = style.borderWidth
        ? style.borderColor
          ? `${style.borderColor}`
          : `${Thumbnail.DEFAULT_BORDER_COLOR}`
        : "none";
      this._showOrHideThumbnailContainer("block");
    }
  }

  public setThumbnailPosition(position: number, style) {
    this._playerInstance
      .otvtoolkit()
      .getThumbnail(position, (thumbnailObject) =>
        this.thumbnailHandler(thumbnailObject, style)
      );

    this._showOrHideThumbnailContainer("block");
  }

  setThumbnailDisplay() { }

  private _showOrHideThumbnailContainer(style: string) {
    const thumbnailContainer = this._getContainerElement();
    if (thumbnailContainer) {
      //Show the thumbnail
      thumbnailContainer.style.display = style;
    }
  }

  private _getContainerElement() {
    return document.getElementById("thumbnailContainer");
  }
}

export default Thumbnail;
