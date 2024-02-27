// Copyright (c) 2020--2023 Nagravision SA. All rights reserved.
import { SSM } from "./SSM";
import { Logger } from "./../Logger";

import {
    OTVSDK_LOGLEVEL as LOG_LEVEL,
    DRMTypes
} from "./../common/enums";

import {
    DRMStates,
    SSMStates,
    EncryptionTypes,
    ContentTypes,
    CustomDataResponse,
    //TODO: Check and remove later
    OTTPlayerStates,
    PlayerSource,
    PluginErrorParam
} from "./common/interface";

import { OTTHelper } from "./OTTHelper"

import { PluginErrorCode } from "./common/ErrorHandler";

type StateChangedCb = (state: DRMStates, source: any, error: PluginErrorParam) => void;

export class DRM {
    static readonly DEFAULT_TOKEN_TYPE: string = "nv-authorizations"; // TODO remove later
    static readonly MS_IN_SECONDS: number = 1000;
    static readonly SESSION_TOKEN_REFETCH_MAX_LIMIT: number = 50;
    static readonly SESSION_TOKEN_FETCH_INTERVAL: number = 100;
    static readonly CERTIFICATE_PAYLOAD_LENGTH: number = 100;
    static readonly SOURCE_CHANGED: string = "Source was changed";

    private _drmState;
    private _ssmState;
    private _ssm;
    private _ssmSessionInfo;
    private _source: PlayerSource | null;
    private _prevSource: PlayerSource | null;

    private _onDrmStateChanged: StateChangedCb;
    private _logger;

    private _widevineCertArray: Uint8Array | [] = [];
    private _playerState: OTTPlayerStates;
    private _customDataResponse: CustomDataResponse = {
        sessionToken: "",
    };

    private _licenseXHR: XMLHttpRequest | null = null;
    private _certificateXHR: XMLHttpRequest | null = null;

    private _contentTokenPromiseRef: any;
    private _ssmSessionTokenPromiseRef: any;

    private _contentTokenReFetchCount: number = 0;
    private _contentTokenReFetchTimerID: ReturnType<typeof setInterval> | null;

    static readonly CONTENT_TOKEN_REFETCH_MAX_LIMIT: number = 50;
    static readonly CONTENT_TOKEN_FETCH_INTERVAL: number = 100;

    constructor(onDrmStateChanged: StateChangedCb) {
        this._drmState = DRMStates.INACTIVE;
        this._onDrmStateChanged = onDrmStateChanged;

        this._logger = new Logger();

        this._ssm = new SSM(this._onSsmStateChanged);

        this._logger.log(LOG_LEVEL.DEBUG, "DRM.ts", "constructor");
    }

    public setPlayer(player) {
        this._ssm.setPlayer(player);
    }

    private _fairplayResponseTransform(ckcMessage) {
        let raw = window.atob(ckcMessage);
        let arr = new Uint8Array(new ArrayBuffer(raw.length));
        for (let i = 0; i < raw.length; i++) {
            arr[i] = raw.charCodeAt(i);
        }
        return arr;
    }

    /**
       * @function _parsePlayreadyResponseForCustomData
       * @summary Parse the XML response
       * @param
       */
    private _parsePlayreadyResponseForCustomData = (response: CustomDataResponse) => {
        // Parse the XML response
        let customData;
        let myResponseObject =
            typeof response !== "string"
                ? this._arrayBufferToString(response)
                : response;
        const parser = new window.DOMParser();
        let xmlDoc = parser.parseFromString(myResponseObject, "text/xml");
        let customDataXML = xmlDoc.getElementsByTagName("CustomData")[0];

        if (customDataXML !== undefined) {
            customData = JSON.parse(customDataXML.childNodes[0].nodeValue);
        }
        return customData;
    };

    private _arrayBufferToString(arrayBuffer) {
        let uint8array = new Uint8Array(arrayBuffer);
        return String.fromCharCode.apply(null, uint8array);
    };

    private _stringToUint8Array(str) {
        let arr = new Uint8Array(str.length);
        for (let i = 0; i < str.length; i++) {
            arr[i] = str.charCodeAt(i);
        }
        return arr;
    }

    private _keySystemValidForType(
        keySystem: string,
        encryptionType: EncryptionTypes
    ): boolean {
        if (keySystem === encryptionType) {
            return true;
        }
        return (
            keySystem === EncryptionTypes.FAIRPLAY_1_0 &&
            encryptionType === EncryptionTypes.FAIRPLAY
        );
    }

    public getEncryptionType(drmType) {
        this._logger.log(
            LOG_LEVEL.DEBUG,
            `DRM.ts: getEncryptionType(): getEncryptionType called: "${drmType}"`
        );
        let type: EncryptionTypes;
        switch (drmType) {
            case DRMTypes.WIDEVINE:
                type = EncryptionTypes.WIDEVINE;
                break;
            case DRMTypes.PLAYREADY:
                type = EncryptionTypes.PLAYREADY;
                break;
            case DRMTypes.TVKEY:
                type = EncryptionTypes.TVKEY;
                break;
            case DRMTypes.FAIRPLAY:
                type = EncryptionTypes.FAIRPLAY;
                break;
            default:
                this._logger.log(
                    LOG_LEVEL.WARNING,
                    `DRM.ts: getEncryptionType(): Unknown encryption type: "${drmType}"`
                );
                type = drmType;
                break;
        }
        return type;
    }

    // TO DO: Check if this required
    private _isOngoingContent(state) {
        this._logger.log(
            LOG_LEVEL.WARNING,
            `DRM.ts: _isOngoingContent source state is ${state}`
        );
        return true;
    }

    /**
   * @function _requestLicenseRenewal
   * @summary Making license renewal request
   * @param xSource
   * @param xRequestPayload
   * @param xKeySystem
   */
    // prettier-ignore
    private _requestLicenseRenewal(xSource: PlayerSource, xRequestPayload: any, keySystem: string) {
        this._logger.log(
            LOG_LEVEL.DEBUG,
            `DRM.ts _requestLicenseRenewal - Source: ${JSON.stringify(xSource)}`
        );
        let headers, url, httpPayload;
        let tokenKey: string = this._source?.tokenType || DRM.DEFAULT_TOKEN_TYPE;
        switch (keySystem) {
            case EncryptionTypes.WIDEVINE:
                const that = this;
                that._updateStateAndTriggerEvent(DRMStates.RENEWAL_REQUESTED);
                return new Promise((resolve, reject) => {
                    that._ssm.renewWidevine(xRequestPayload)
                        .then((response) => {
                            that._updateStateAndTriggerEvent(DRMStates.ACTIVE);
                            resolve(response);
                        })
                        .catch((error) => {
                            let errorRenewMsg = "SSM Renew license failed: " + error;
                            that._fireErrorEventAndReject(PluginErrorCode.SSM_RENEW_ERROR, errorRenewMsg, reject);
                        })
                });

            case EncryptionTypes.PLAYREADY:
                httpPayload = xRequestPayload;
                url = this._source?.drm?.licenseURL + "?renew=true";
                headers = {
                    Accept: "application/json",
                    "Content-Type": "text/xml; charset=utf-8",
                    [tokenKey]: this._ssmSessionInfo.sessionToken,
                };
                break;

            case EncryptionTypes.FAIRPLAY:
            case EncryptionTypes.FAIRPLAY_1_0:
                httpPayload = xRequestPayload;
                url = this._source?.drm?.licenseURL + "?renew=true";
                headers = {
                    Accept: "application/json",
                    "Content-Type": "application/octet-stream",
                    [tokenKey]: this._ssmSessionInfo.sessionToken,
                };
                break;

            default:
                return this._fireErrorEventForInvalidKeySystem(keySystem);

        }

        let that = this;
        //enabled downLevelIteration explicitly in the tsconfig, in order to
        //resolve the error: Type 'Uint8Array' is not an array type or a string type.
        return new Promise(function resolver(resolve, reject) {
            that._licenseXHR = new XMLHttpRequest(); //TODO: Does an existing request need to be cancelled before the constructor is called? 
            that._licenseXHR.open("POST", url, true);
            that._licenseXHR.responseType = "text";
            for (let key in headers) {
                if (headers.hasOwnProperty(key)) {
                    if (key && headers[key]) {
                        that._licenseXHR.setRequestHeader(key, headers[key]);
                    }
                }
            }

            that._licenseXHR.onload = function onload() {
                //added check to handle async scenarios
                //added check for to check license renewal for ongoing ssm session
                if (that._isOngoingContent(ContentTypes.SSM)) {
                    if (that._licenseXHR?.status === 200) {
                        try {
                            switch (keySystem) {
                                case EncryptionTypes.PLAYREADY:
                                    let playreadyResponse = new Uint8Array(that._licenseXHR.response);
                                    // Parse the PlayReady XML Response for the customData field
                                    let custDataSessionToken =
                                        that._parsePlayreadyResponseForCustomData(that._licenseXHR.response);
                                    // To use SSM with PlayReady Enforcement a PlayReady license must contain a customData field
                                    // with a sessionToken attribute, otherwise we must use heartbeat mode.
                                    if (custDataSessionToken !== undefined) {
                                        //license request loaded - updating key
                                        that._ssmSessionInfo.sessionToken =
                                            custDataSessionToken.sessionToken;
                                    }

                                    let convertedContents = typeof that._licenseXHR.response === "string" ?
                                        that._stringToUint8Array(that._licenseXHR.response) : playreadyResponse;

                                    that._updateStateAndTriggerEvent(DRMStates.ACTIVE);
                                    resolve(convertedContents);
                                    break;

                                case EncryptionTypes.FAIRPLAY:
                                case EncryptionTypes.FAIRPLAY_1_0:
                                    let json = JSON.parse(that._licenseXHR.responseText);

                                    that._updateStateAndTriggerEvent(DRMStates.ACTIVE);
                                    resolve(that._fairplayResponseTransform(json.CkcMessage));
                                    break;

                                default:
                                    that._logger.log(
                                        LOG_LEVEL.ERROR,
                                        "Invalid encryption type"
                                    );
                                    const error = that._generateRenewError(url, "Invalid encryption type", null);
                                    that._updateStateAndTriggerEvent(DRMStates.ERROR, error);
                                    reject("Invalid encryption type");
                            }
                        } catch (error) {
                            const ssmError = that._generateRenewError(url, "Invalid encryption type", error);
                            that._updateStateAndTriggerEvent(DRMStates.ERROR, ssmError);
                            reject("Failed JSON response parse: " + error);
                        }
                    } else {
                        const error = that._generateRenewError(url, "Send heartbeat error", that._licenseXHR?.response);
                        that._updateStateAndTriggerEvent(DRMStates.ERROR, error);
                        reject("Failed to receive license, " + that._licenseXHR ? (" HTTP status: " + that._licenseXHR?.status) : ("HTTP request is null/undefined"));
                    }
                } else {
                    that._fireErrorEventAndReject(PluginErrorCode.DRM_INVAILD_SOURCE, DRM.SOURCE_CHANGED, reject);
                }
            };

            that._licenseXHR.onerror = function onerror() {
                //added check to handle async scenarios
                //added check for to check error response for ongoing ssm session.
                const error = that._generateRenewError(url, "Send heartbeat error", that._licenseXHR?.response);
                that._updateStateAndTriggerEvent(DRMStates.ERROR, error);

                if (that._isOngoingContent(ContentTypes.SSM)) {
                    reject("Error on license renewal");
                } else {
                    reject("Source was changed");
                }
            };

            that._updateStateAndTriggerEvent(DRMStates.RENEWAL_REQUESTED);
            that._licenseXHR.send(httpPayload);
        });
    }

    private _fireErrorEventForInvalidKeySystem(keySystem: string) {
        let errorInvalidKeyMsg = "Invalid key system: " + keySystem;
        this._fireErrorEventAndReject(PluginErrorCode.INVALID_KEY_SYSTEM, errorInvalidKeyMsg);
        return Promise.reject(errorInvalidKeyMsg);
    }

    private _generateRenewError(url: string, errorMsg: string, errorObj: any) {
        return this._generatePluginError(PluginErrorCode.SSM_HEARTBEAT_SEND_MESSAGE_FAILURE, errorMsg, url, errorObj);
    }

    private _generateError(pluginErrorCode: PluginErrorCode, errorMsg: string, errorObj?: any) {
        return this._generatePluginError(pluginErrorCode, errorMsg, this._source?.src, errorObj);
    }

    private _generatePluginError(pluginErrorCode: PluginErrorCode, errorMsg: string, serverurl: string | undefined, errorObj?: any) {
        let pluginError: PluginErrorParam = {
            errorCode: pluginErrorCode,
            errorMessage: errorMsg,
            content: {
                serverUrl: serverurl,
                source: this._source?.src,
                serverResponse: errorObj
            }
        };
        return pluginError;
    }

    private _fireErrorEventAndReject(pluginErrorCode: PluginErrorCode, errorMsg: string, reject?: any, errorObj?: any) {
        this._logger.log(LOG_LEVEL.WARNING, "DRM.ts _fireErrorAndRejectPromise():", errorMsg);
        let error = this._generateError(pluginErrorCode, errorMsg, errorObj);
        this._updateStateAndTriggerEvent(DRMStates.ERROR, error);
        if (reject) {
            reject(errorMsg);
        }
    }

    private _requestLicense(xSource: PlayerSource, xRequestPayload: any, xXhr: XMLHttpRequest) {
        return new Promise((resolve, reject) => {
            if (this._source?.token &&
                ((this._isSSM(this._source) && this._ssmSessionInfo?.sessionToken) || !this._isSSM(this._source))) {
                if (xSource.src === this._source?.src) {
                    this._logger.log(
                        LOG_LEVEL.DEBUG,
                        "DRM.ts _requestLicense() - Content token:", this._source.token,
                        "SSM session token:", (this._isSSM(this._source) ? this._ssmSessionInfo?.sessionToken : "N/A"));

                    this._updateStateAndTriggerEvent(DRMStates.LICENSE_REQUESTED);

                    let nvAuthorizations = this._source.token
                        + (this._isSSM(this._source) ? "," + this._ssmSessionInfo?.sessionToken : "");
                    this._logger.log(
                        LOG_LEVEL.DEBUG,
                        "DRM.ts _requestLicense() - nvAuthorizations:", nvAuthorizations);
                    let tokenKey = this._source?.tokenType || DRM.DEFAULT_TOKEN_TYPE;

                    xXhr.setRequestHeader(tokenKey, nvAuthorizations);
                    xXhr.send(xRequestPayload);
                    resolve(true);
                } else {
                    this._fireErrorEventAndReject(PluginErrorCode.DRM_INVAILD_SOURCE, DRM.SOURCE_CHANGED, reject);
                }
            } else {
                // Should be unreachable
                const errorMessage = "Source or content token missing";
                this._fireErrorEventAndReject(PluginErrorCode.DRM_INVAILD_SOURCE, errorMessage, reject);
            }
        });
    }

    /**
     * @function _getWidevineLicense
     * @param xSource
     * @param xRequestPayload
     * @returns token
     */
    private _getWidevineLicense(xSource, xRequestPayload) {
        let nvAuthorizations: string;
        let tokenKey: string;
        let contentType = "application/json";

        let licenseURL = this._source?.drm?.licenseURL; //TODO: If it's undefined should we abort?
        let that = this;
        // prettier-ignore
        return new Promise(function resolver(resolve, reject) { //NOSONAR
            // check if requesting certificate
            if (that._isCertificateRequest(xRequestPayload.byteLength)) {
                if (Boolean(that._widevineCertArray.length)) {
                    that._logger.log(
                        LOG_LEVEL.DEBUG,
                        `DRM.ts: _getWidevineLicense (): using cached cert: ${that._widevineCertArray}`
                    );
                    return resolve(that._widevineCertArray);
                }
                contentType = "application/octet-stream";
            }
            let headers = {
                Accept: contentType,
                "Content-Type": contentType,
                [tokenKey]: nvAuthorizations,
            };

            that._licenseXHR = new XMLHttpRequest(); //TODO: Does an existing request need to be cancelled before the constructor is called?
            that._licenseXHR.open("POST", licenseURL, true); //TODO: If it's undefined should we abort?
            that._licenseXHR.responseType = that._isCertificateRequest(xRequestPayload.byteLength) ? "arraybuffer" : "text";
            for (let key in headers) {
                if (headers.hasOwnProperty(key)) {
                    if (key && headers[key]) {
                        that._licenseXHR.setRequestHeader(key, headers[key]);
                    }
                }
            }

            that._licenseXHR.onload = function onload() {
                //added check to handle async scenarios
                //added check for to check license for current widevine ssm || widevine non ssm content.
                if (that._isOngoingContent(ContentTypes.SSM_OR_NON_SSM)) {
                    if (that._licenseXHR?.status === 200) {
                        try {
                            if (that._isCertificateRequest(xRequestPayload.byteLength)) {
                                // TODO: Change/move this - it relates to _certificateXHR
                                // certificates
                                that._widevineCertArray = new Uint8Array(that._licenseXHR.response);
                                that._logger.log(
                                    LOG_LEVEL.DEBUG,
                                    `DRM.ts: _getWidevineLicense onload: cert response ${that._widevineCertArray}`
                                );
                                resolve(that._widevineCertArray);
                            } else {
                                //actual license
                                that._logger.log(
                                    LOG_LEVEL.DEBUG,
                                    "DRM.ts _getWidevineLicense onload: - License response:",
                                    that._licenseXHR?.response
                                );
                                that._updateStateAndTriggerEvent(DRMStates.ACTIVE);
                                // check if hearbeat shoud be enabled for SSM stream
                                if (that._isSSM(that._source)
                                    && !that._enforcedModeEnabled(that._licenseXHR?.response)) {
                                    // enable hearbeat for widevine ssm stream
                                    that._logger.log(
                                        LOG_LEVEL.INFO,
                                        "DRM.ts: _getWidevineLicense onload: SSM hearbeat mode is enabled."
                                    );
                                    // Enable hearbeat in SSM module for widevine 
                                    that._ssm.setLicenseCustomData({});
                                }
                                let license = that._unpackageLicense(that._licenseXHR?.response);
                                resolve(license);
                            }
                        } catch (err) {
                            let errorInvalidLicenseMsg = "Invalid widevine License";
                            that._fireErrorEventAndReject(PluginErrorCode.DRM_LICENSE_DATA_ERROR, errorInvalidLicenseMsg, reject, that._licenseXHR?.response);
                        }
                    } else {
                        that._fireLicenseRequestError(reject);
                    }
                } else {
                    // This condition is reached if the source changes before receiving
                    // the callback for previous source change.
                    that._fireErrorEventAndReject(PluginErrorCode.DRM_INVAILD_SOURCE, DRM.SOURCE_CHANGED, reject);
                }
            };

            that._licenseXHR.onerror = function onerror() {
                // added check to handle async scenarios
                //added check for to check failure license request for current widevine ssm  || widevine non ssm content.
                that._handleAsyncNetworkError(reject);
            };

            if (xSource.src === that._source.src) {
                that._logger.log(
                    LOG_LEVEL.DEBUG,
                    "DRM.ts: _getWidevineLicense(): Widevine license retrieval callback is for current content"
                );
                let requestPayload = that._isCertificateRequest(xRequestPayload.byteLength)
                    ? xRequestPayload
                    : that._packageBase64Payload(xRequestPayload);
                // Request license or certificate.
                that._requestLicense(xSource, requestPayload, that._licenseXHR)
                    .catch((reason) => {
                        reject(reason);
                    });
            } else {
                let error = {
                    errorCode: PluginErrorCode.INTERNAL_ERROR, //TODO: Need a new error code
                    errorMessage: "Widevine license retrieval callback is not for current content, source was changed"
                }
                that._logger.log(
                    LOG_LEVEL.DEBUG,
                    "DRM.ts: _getWidevineLicense(): ", error.errorMessage
                );
                that._updateStateAndTriggerEvent(DRMStates.ERROR, error);
                reject("Source was changed");
            }
        });
    }

    private _fireLicenseRequestError(reject: any) {
        let errorMsg = "Failed to receive license, HTTP status: " + this._licenseXHR?.status;
        this._fireErrorEventAndReject(PluginErrorCode.DRM_LICENSE_REQUEST_FAILURE, errorMsg, reject, this._licenseXHR?.response);
    }

    /**
     * @function _getTVKeyLicense
     * @param xSource
     * @param xRequestPayload
     * @returns token
     */
    private _getTVKeyLicense(xSource, xRequestPayload) {
        let that = this;
        let headers = {
            Accept: "application/json",
            "Content-Type": "application/json",
        };
        let licenseURL = that._source?.drm?.licenseURL;
        // prettier-ignore
        return new Promise(function resolver(resolve, reject) { //NOSONAR
            that._licenseXHR = new XMLHttpRequest(); //TODO: Does an existing request need to be cancelled before the constructor is called?
            that._licenseXHR.open("POST", licenseURL, true);
            // Change required while using default shaka player
            // to do :: to be checked at SDK level
            that._licenseXHR.responseType = "arraybuffer";
            for (let key in headers) {
                if (headers.hasOwnProperty(key)) {
                    if (key && headers[key]) {
                        that._licenseXHR.setRequestHeader(key, headers[key]);
                    }
                }
            }

            that._licenseXHR.onload = function onload() {
                //added check to handle async scenarios
                //added check for to check licenece response is for current tvkey playback.
                //if ott player in stopped state and onload gets triggered then player should not handle
                if (
                    OTTPlayerStates.SOURCE_SET !== that._playerState &&
                    OTTPlayerStates.STOPPED !== that._playerState
                ) {
                    if (that._licenseXHR.status === 200) {
                        try {
                            if (that._isSSM(that._source)) {
                                that._ssm.setLicenseCustomData({}); // Only use heartbeat mode until enforcement mode is supported
                            }
                            that._logger.log(
                                LOG_LEVEL.DEBUG,
                                "DRM.ts _getTVKeyLicense()",
                                "onload() - License response:",
                                that._licenseXHR.response
                            );
                            that._updateStateAndTriggerEvent(DRMStates.ACTIVE);
                            resolve(new Uint8Array(that._licenseXHR.response));
                        } catch (err) {
                            reject("Invalid tvKey License:" + err);
                        }
                    } else {
                        reject("Failed to receive license, HTTP status:" + that._licenseXHR.status);
                    }
                } else {
                    // This condition is reached if the source changes before receiving
                    // the callback for previous source change.
                    reject("Source was changed");
                }
            };

            that._licenseXHR.onerror = function onerror() {
                // added check to handle async scenarios
                //added check for to check failure license request for current widevine ssm  || widevine non ssm content.
                //if ott player in stopped state and onerror gets triggered then player should not handle
                if (
                    OTTPlayerStates.SOURCE_SET !== that._playerState &&
                    OTTPlayerStates.STOPPED !== that._playerState
                ) {
                    reject("Error on license request");
                } else {
                    // This condition is reached if the source changes before receiving
                    // the callback for previous source change.
                    reject("Source was changed");
                }
            };
            if (xSource.src === that._source?.src) {
                that._logger.log(
                    LOG_LEVEL.DEBUG,
                    "DRM.ts: _getTVKeyLicense(): TVKey license retrieval callback is for current content"
                );
                // const ssmTokenPromise = that._isSSM(that._source) ? new Promise(that._ssmSessionTokenPromiseHandler) : null;
                that._requestLicense(xSource, xRequestPayload, that._licenseXHR)
                    .catch((reason) => {
                        reject(reason);
                    });
            } else {
                that._logger.log(
                    LOG_LEVEL.DEBUG,
                    "DRM.ts: _getTVKeyLicense(): TVKey license retrieval callback is not for current content"
                );
                reject("Source was changed");
            }
        });
    }

    /**
     * @function _getPlayreadyLicense
     * @param xSource
     * @param xRequestPayload
     * @returns token
     */
    // prettier-ignore
    private _getPlayreadyLicense(xSource, xRequestPayload) { //NOSONAR
        let that = this;
        let licenseURL = this._source?.drm?.licenseURL;
        let nvAuthorizations = this._source?.drm?.ssmServerURL
            ? this._source.token + "," + this._ssmSessionInfo.sessionToken
            : this._source.token;
        let tokenKey: string = this._source?.tokenType || DRM.DEFAULT_TOKEN_TYPE;
        let headers = {
            "Content-Type": "text/xml; charset=utf-8",
        };
        headers[tokenKey] = nvAuthorizations;
        return new Promise(function resolver(resolve, reject) {
            that._licenseXHR = new XMLHttpRequest(); //TODO: Does an existing request need to be cancelled before the constructor is called?
            that._licenseXHR.open("POST", licenseURL, true);
            that._licenseXHR.responseType = "arraybuffer";
            for (let key in headers) {
                if (headers.hasOwnProperty(key)) {
                    if (key && headers[key]) {
                        that._licenseXHR.setRequestHeader(key, headers[key]);
                    }
                }
            }

            that._licenseXHR.onload = function onload() {
                //added check to handle async scenarios
                //added check for to check response for current SSM session || non ssm content.
                if (that._isOngoingContent(ContentTypes.SSM_OR_NON_SSM) &&
                    xSource.src === that._source?.src) {
                    if (that._licenseXHR.status === 200) {
                        let serverResponse = new Uint8Array(that._licenseXHR.response);
                        // Parse the PlayReady XML Response for the customData field
                        let customData = that._parsePlayreadyResponseForCustomData(
                            that._licenseXHR.response
                        );
                        that._customDataResponse.sessionToken = customData?.sessionToken;
                        // To use SSM with PlayReady Enforcement a PlayReady license must contain a customData field
                        // with a sessionToken attribute, otherwise we must use heartbeat mode.
                        if (that._customDataResponse.sessionToken) {
                            //license request loaded - updating key
                            that._ssmSessionInfo.sessionToken =
                                that._customDataResponse.sessionToken;
                        }
                        if (that._isSSM(that._source)) {
                            that._ssm.setLicenseCustomData(customData);
                        }

                        let convertedContents = typeof that._licenseXHR.response === "string" ?
                            that._stringToUint8Array(serverResponse) : serverResponse;

                        that._updateStateAndTriggerEvent(DRMStates.ACTIVE);
                        resolve(convertedContents);
                    } else {
                        that._fireLicenseRequestError(reject);
                    }
                } else {
                    that._fireErrorEventAndReject(PluginErrorCode.DRM_INVAILD_SOURCE, DRM.SOURCE_CHANGED, reject);
                }
            };

            that._licenseXHR.onerror = function onerror() {
                //added check to handle async scenarios
                //added check for to check error response for current ssm || non ssm content.
                that._handleAsyncNetworkError(reject);
            };

            that._updateStateAndTriggerEvent(DRMStates.LICENSE_REQUESTED);
            that._licenseXHR.send(xRequestPayload);
        });
    }

    /**
     * @function _getFairplayLicense
     * @param xSource
     * @param xRequestPayload
     * @returns token
     */
    // prettier-ignore
    private _getFairplayLicense(xSource, xRequestPayload) {
        let that = this;
        let licenseURL = this._source?.drm?.licenseURL;

        return new Promise(function resolver(resolve, reject) { //NOSONAR
            let nvAuthorizations = that._source?.drm?.ssmServerURL
                ? that._source?.token + "," + that._ssmSessionInfo.sessionToken
                : that._source?.token;
            let tokenKey: string =
                that._source?.tokenType || DRM.DEFAULT_TOKEN_TYPE;
            let headers = {
                Accept: "application/json",
                "Content-Type": "application/octet-stream",
                [tokenKey]: nvAuthorizations,
            };

            that._licenseXHR = new XMLHttpRequest(); //TODO: Does an existing request need to be cancelled before the constructor is called?
            that._licenseXHR.open("POST", licenseURL, true);
            that._licenseXHR.responseType = "text";
            for (let key in headers) {
                if (headers.hasOwnProperty(key)) {
                    if (key && headers[key]) {
                        that._licenseXHR.setRequestHeader(key, headers[key]);
                    }
                }
            }

            that._licenseXHR.onload = function onload() {
                //added check to handle async scenarios
                //added check for to check response for current SSM session || non ssm content.
                if (that._isOngoingContent(ContentTypes.SSM_OR_NON_SSM) &&
                    xSource.src === that._source?.src) {
                    if (that._licenseXHR.status === 200) {
                        try {
                            let json = JSON.parse(that._licenseXHR.responseText);
                            //if json.sessionToken is available then mode is enforcement
                            //else mode is heartbeat
                            if (json.sessionToken) {
                                that._ssmSessionInfo.sessionToken = json.sessionToken;
                            }
                            //if ongoing content is ssm then start the SSM timer to send heartbeat message to the server at the
                            //request period time
                            if (that._isSSM(that._source)) {
                                that._ssm.setLicenseCustomData(json);
                            }
                            let license = that._fairplayResponseTransform(json.CkcMessage);
                            that._updateStateAndTriggerEvent(DRMStates.ACTIVE);
                            resolve(license);
                        } catch (err) {
                            let errorFairplayMsg = "Invalid Fairplay License";
                            that._fireErrorEventAndReject(PluginErrorCode.DRM_LICENSE_DATA_ERROR, errorFairplayMsg, reject, that._licenseXHR?.response);
                        }
                    } else {
                        that._fireLicenseRequestError(reject);
                    }
                } else {
                    // This condition is reached if the source changes before receiving
                    // the callback for previous source change.
                    that._fireErrorEventAndReject(PluginErrorCode.DRM_INVAILD_SOURCE, DRM.SOURCE_CHANGED, reject);
                }
            };

            that._licenseXHR.onerror = function onerror() {
                //added check to handle async scenarios
                //added check for to check error response for current ssm || non ssm content.
                that._handleAsyncNetworkError(reject);
            };

            that._updateStateAndTriggerEvent(DRMStates.LICENSE_REQUESTED);
            that._licenseXHR.send(xRequestPayload);
        });
    }

    private _handleAsyncNetworkError(reject: any) {
        let errorMsg = "";
        let errorCode = PluginErrorCode.DRM_LICENSE_REQUEST_FAILURE;
        if (this._isOngoingContent(ContentTypes.SSM_OR_NON_SSM)) {
            errorMsg = "Error on license request";
        } else {
            errorMsg = DRM.SOURCE_CHANGED;
            errorCode = PluginErrorCode.DRM_INVAILD_SOURCE;
        }
        this._fireErrorEventAndReject(errorCode, errorMsg, reject, this._licenseXHR?.response);
    }

    // private _licensePromiseHandler = (xResolve, xReject) => {
    //     this._licensePromiseRef = { resolve: xResolve, reject: xReject }
    // }

    private _ssmSessionTokenPromiseHandler = (xResolve, xReject) => {
        this._ssmSessionTokenPromiseRef = { resolve: xResolve, reject: xReject };
    }

    public certificateRetriever() {
        let that = this;
        return new Promise(function resolver(resolve, reject) {
            //TODO: Does any existing request need to be cancelled before the constructor is called?

            that._certificateXHR = new XMLHttpRequest();
            that._certificateXHR.open("GET", that._source.drm.certificateURL, true);
            that._certificateXHR.responseType = "arraybuffer";

            that._certificateXHR.onload = function onload() {
                if (that._certificateXHR.status === 200) {
                    resolve(new Uint8Array(that._certificateXHR.response));
                } else {
                    let errorCertMsg = "DRM.ts: Failed to receive certificate, HTTP status:" +
                        that._certificateXHR?.status;
                    that._fireErrorEventAndReject(PluginErrorCode.DRM_CERTIFICATE_REQUEST_FAILURE, errorCertMsg, reject, that._certificateXHR?.response);
                }
            };

            that._certificateXHR.onerror = function onerror() {
                let errorCertMessage = "DRM.ts: Error on certificate request";
                that._fireErrorEventAndReject(PluginErrorCode.DRM_CERTIFICATE_REQUEST_FAILURE, errorCertMessage, reject, that._certificateXHR?.response);
            };
            that._certificateXHR.send();
        });
    }

    // private _licensePromiseHandler(xResolve: any, xReject: any) {
    //     this._licensePromiseRef({ resolve: xResolve, reject: xReject });
    // }

    // NOTE: Can the source provided here be used to provide an update or is it just to check
    // the license request matches the existing source?
    public licenseRetriever(
        xKeySystem,
        xSource,
        xRequestPayload,
        xMessageType
    ) {
        this._logger.log(LOG_LEVEL.DEBUG, "DRM.ts: Entered licenseRetriever()");
        return new Promise((resolve, reject) => {
            if (this._drmState === DRMStates.ERROR) {
                // Intentionally unresolved
                return;
            }

            if (xMessageType === "license-renewal") {
                this._requestLicenseRenewal(xSource, xRequestPayload, xKeySystem)
                    .then((licenseData) => {
                        //set state to ACTIVE
                        resolve(licenseData);
                    })
                    .catch((errorData) => {
                        //set state to ERROR
                        reject(errorData);
                    })
            } else {
                if (this._isSSM(this._source)) {
                    this._logger.log(LOG_LEVEL.DEBUG, "DRM.ts: licenseRetriever() - SSM content");
                    if (this._source?.token) { // Has content token
                        if (this._drmState === DRMStates.INACTIVE || this._ssmState === SSMStates.SESSION_ON) {
                            //this._logger.assert(this._ssmState === SSMStates.SESSION_ON, "SSM State - Expected: SESSION_ON, Actual: %s", OTTHelper.getSSMStateString(this._ssmState));
                            this._fetchNewLicense(xSource, xRequestPayload, xKeySystem)
                                .then((licenseData) => {
                                    // set state to ACTIVE
                                    resolve(licenseData);
                                })
                                .catch((errorData) => {
                                    // set state to ERROR
                                    reject(errorData);
                                })
                        } else if (this._drmState === DRMStates.AWAITING_SESSION_TOKEN) {
                            //this._logger.assert(this._ssmState !== SSMStates.SESSION_ON, "SSM State - Expected an SSM state other than SESSION_ON");
                            this._waitForSSMSessionToken()
                                .then(() => {
                                    this._fetchNewLicense(xSource, xRequestPayload, xKeySystem)
                                        .then((licenseData) => {
                                            // set state to ACTIVE
                                            resolve(licenseData);
                                        })
                                        .catch((errorData) => {
                                            // set state to ERROR
                                            reject(errorData);
                                        })
                                }).catch((errorData) => {
                                    // set state to ERROR
                                    reject(errorData);
                                });
                        } else {
                            this._logger.log(LOG_LEVEL.ERROR, "DRM.ts: licenseRetriever() - Unexpected states -",
                                "DRM:", OTTHelper.getDRMStateString(this._drmState),
                                ", SSM:", OTTHelper.getSSMStateString(this._ssmState));
                        }
                    } else { // Wait for content and session token from SSM
                        if (this._drmState === DRMStates.AWAITING_CONTENT_TOKEN) {
                            this._waitForSSMSessionToken() // SSM will wait for the content token and set up the session, hence we don't call _waitForContentToken
                                .then(() => {
                                    this._fetchNewLicense(xSource, xRequestPayload, xKeySystem)
                                        .then((licenseData) => {
                                            //set state to ACTIVE
                                            resolve(licenseData);
                                        })
                                        .catch((errorData) => {
                                            //set state to ERROR
                                            reject(errorData);
                                        })
                                })
                                .catch((errorData) => {
                                    // set state to ERROR
                                    reject(errorData);
                                });
                        } else {
                            this._logger.log(LOG_LEVEL.ERROR, "DRM is in an unexpected state:", OTTHelper.getDRMStateString(this._drmState));
                        }
                    }
                } else { // Non-SSM
                    this._logger.log(LOG_LEVEL.DEBUG, "DRM.ts: licenseRetriever() - Non-SSM content");
                    if (this._source?.token) { // Non-SSM content with content token already provided
                        //this._logger.assert(this._drmState === DRMStates.INACTIVE, "DRM State - Expected: INACTIVE, Actual: %s", OTTHelper.getDRMStateString(this._drmState));
                        this._fetchNewLicense(xSource, xRequestPayload, xKeySystem)
                            .then((licenseData) => {
                                // set state to ACTIVE
                                resolve(licenseData);
                            })
                            .catch((errorData) => {
                                // set state to ERROR
                                reject(errorData);
                            })
                    } else { // Non-SSM content with content token not provided
                        //this._logger.assert(this._drmState === DRMStates.AWAITING_CONTENT_TOKEN, "DRM State - Expected: AWAITING_CONTENT_TOKEN, Actual: %s", OTTHelper.getDRMStateString(this._drmState));
                        this._waitForContentToken()
                            .then(() => {
                                this._fetchNewLicense(xSource, xRequestPayload, xKeySystem)
                                    .then((licenseData) => {
                                        //set state to ACTIVE
                                        resolve(licenseData);
                                    })
                                    .catch((errorData) => {
                                        //set state to ERROR
                                        reject(errorData);
                                    })
                            })
                            .catch((errorData) => {
                                //set state to ERROR
                                reject(errorData);
                            });
                    }
                }
            }
        });
    }

    private _fetchNewLicense(xSource: PlayerSource, xRequestPayload: any, xKeySystem: string) {
        this._logger.log(LOG_LEVEL.DEBUG, "DRM.ts - _fetchNewLicense() - enter");

        let keyType: EncryptionTypes = this.getEncryptionType(
            this._source.drm.type
        );
        if (xSource.src === this._source.src) {
            if (this._keySystemValidForType(xKeySystem, keyType)) {
                switch (xKeySystem) {
                    case EncryptionTypes.WIDEVINE:
                        return this._getWidevineLicense(xSource, xRequestPayload);

                    case EncryptionTypes.PLAYREADY:
                        return this._getPlayreadyLicense(xSource, xRequestPayload);

                    case EncryptionTypes.FAIRPLAY:
                    case EncryptionTypes.FAIRPLAY_1_0:
                        return this._getFairplayLicense(xSource, xRequestPayload);

                    case EncryptionTypes.TVKEY:
                        return this._getTVKeyLicense(xSource, xRequestPayload);

                    default:
                        this._logger.log(
                            LOG_LEVEL.ERROR,
                            "DRM.ts: licenseRetriever(): ",
                            "Invalid key system:",
                            xKeySystem
                        );
                        return this._fireErrorEventForInvalidKeySystem(xKeySystem);
                }
            } else {
                this._logger.log(
                    LOG_LEVEL.ERROR,
                    `DRM.ts: licenseRetrievalCallback(): Unsupported DRM type: ${keyType}`
                );
                let errorDrmTypeMessage = "Unsupported DRM type: " + keyType;
                this._fireErrorEventAndReject(PluginErrorCode.INVALID_KEY_SYSTEM, errorDrmTypeMessage);
                return Promise.reject(errorDrmTypeMessage);
            }
        } else {
            // This condition is reached if the source changes before receiving
            // the callback for previous source change
            this._logger.log(
                LOG_LEVEL.WARNING,
                "DRM.ts: licenseRetriever(): ",
                "Source mismatched",
                "current source: ", this._source.src,
                "input source: ", xSource.src
            );
            let errorSourceChangedMsg = "Source mismatched, current source:" + this._source?.src
                + " input source: " + xSource.src;
            this._fireErrorEventAndReject(PluginErrorCode.DRM_INVAILD_SOURCE, errorSourceChangedMsg);
            return Promise.reject("Source was changed");


        }
    }

    public setSource = (xSource: PlayerSource) => {
        this._logger.log(LOG_LEVEL.DEBUG, "DRM.ts setSource - source: ", JSON.stringify(xSource));

        this._prevSource = Object.assign({}, this._source);
        this._source = Object.assign({}, xSource);
        this._ssm.setSource(xSource);

        //TODO: Clean up this._contentTokenPromiseRef

        this._actionStateChange();
    }

    private _onSsmStateChanged = (xSSMState: SSMStates, xSource: PlayerSource, xSessionInfo: any, xError?: any) => {
        this._logger.log(LOG_LEVEL.DEBUG, "DRM.ts", "_onSsmStateChanged() -",
            "SSM State:", OTTHelper.getSSMStateString(this._ssmState), "->", OTTHelper.getSSMStateString(xSSMState),
            "\n(DRM State:", OTTHelper.getDRMStateString(this._drmState) + ")",
            "\nSource:", JSON.stringify(xSource),
            "\nSessionInfo:", JSON.stringify(xSessionInfo),
            xError && ("\nError: " + JSON.stringify(xError)));

        this._ssmState = xSSMState;
        this._ssmSessionInfo = xSessionInfo;

        switch (xSSMState) {
            case SSMStates.SETUP_REQUESTED:
                //TODO: Is the state check needed or should this always change the state to AWAITING_CONTENT_TOKEN?
                if (this._drmState === DRMStates.AWAITING_CONTENT_TOKEN) {
                    this._updateStateAndTriggerEvent(DRMStates.AWAITING_SESSION_TOKEN);
                }
                break;
            case SSMStates.SESSION_ON:
                //TODO: Is the state check needed?
                if (this._drmState === DRMStates.AWAITING_SESSION_TOKEN || this._drmState === DRMStates.AWAITING_CONTENT_TOKEN) {
                    if (this._ssmSessionTokenPromiseRef) {
                        this._ssmSessionTokenPromiseRef.resolve(true);
                    } else {
                        this._updateStateAndTriggerEvent(DRMStates.INACTIVE);
                    }
                }
                break;
            case SSMStates.ERROR:
                if (this._drmState !== DRMStates.ERROR) {
                    this._ssmSessionTokenPromiseRef?.reject(xError);
                    this._updateStateAndTriggerEvent(DRMStates.ERROR, xError);
                }
                break;
            default:
            // Do nothing
        }
    }

    private _updateStateAndTriggerEvent = (xNewState: DRMStates, xError?: PluginErrorParam) => {
        this._logger.log(LOG_LEVEL.DEBUG, "DRM.ts", "_updateStateAndTriggerEvent():",
            OTTHelper.getDRMStateString(this._drmState), "->", OTTHelper.getDRMStateString(xNewState));

        this._drmState = xNewState;

        this._onDrmStateChanged(xNewState, this._source, xError)
    }

    private _actionStateChange() {
        // Treat null / undefined / empty object new source as a reset trigger
        //const { token, drm } = this._newSource;

        switch (this._drmState) {
            case DRMStates.INACTIVE:
                this._handleSourceFromInactiveState();
                break;
            case DRMStates.AWAITING_CONTENT_TOKEN:
                this._handleSourceFromAwaitingContentTokenState();
                break;
            case DRMStates.AWAITING_SESSION_TOKEN:
                // Do nothing
                break;
            case DRMStates.LICENSE_REQUESTED:
                this._handleSourceFromLicenseRequestedState();
                break;
            case DRMStates.ACTIVE:
                this._handleSourceFromActiveState();
                break;
            case DRMStates.RENEWAL_REQUESTED:
                this._handleSourceFromRenewalRequestedState();
                break;
            case DRMStates.ERROR:
                this._handleSourceFromErrorState();
                break;
            default:
                this._logger.log(LOG_LEVEL.ERROR, "DRM.ts", "_actionStateChange - Unexpected state:", OTTHelper.getDRMStateString(this._drmState), "(" + this._drmState + ")");
        };
    }

    private _isNullOrClear = (xSource: PlayerSource | null) => {
        return xSource === null || !xSource.drm || !(xSource.drm?.licenseURL);
    }

    private _isSSM = (xSource: PlayerSource | null) => {
        return xSource && xSource.drm?.ssmServerURL;
    }

    private _isEncryptedNonSSM = (xSource: PlayerSource | null) => {
        return xSource && xSource.drm && !xSource.drm.ssmServerURL;
    }

    private _hasContentToken = (xSource: PlayerSource | null) => {
        return xSource && xSource.token;
    }

    private _isNewSource(xSource1: PlayerSource | null, xSource2: PlayerSource | null) {
        return (xSource1 === null && xSource2 !== null)
            || (xSource1 !== null && xSource2 === null)
            || (xSource1?.src !== xSource2?.src);
    }

    private _handleSourceFromInactiveState = () => {
        if (this._isNewSource(this._source, this._prevSource)) {
            if (this._isNullOrClear(this._source) || (this._isEncryptedNonSSM(this._source) && this._hasContentToken(this._source))) {
                return;
            }
            else if (this._isEncryptedNonSSM(this._source) && !this._hasContentToken(this._source)) {
                this._updateStateAndTriggerEvent(DRMStates.AWAITING_CONTENT_TOKEN); //TODO: Could handle this state change in _startContentTokenWaitTimer
                this._startContentTokenWaitTimer();
            } else if (this._isSSM(this._source) && this._hasContentToken(this._source)) {
                this._updateStateAndTriggerEvent(DRMStates.AWAITING_SESSION_TOKEN);
            } else if (this._isSSM(this._source) && !this._hasContentToken(this._source)) {
                this._updateStateAndTriggerEvent(DRMStates.AWAITING_CONTENT_TOKEN);
            }
        }
    }

    private _handleSourceFromAwaitingContentTokenState = () => {
        if (this._isNewSource(this._source, this._prevSource)) {
            if (this._isNullOrClear(this._source) || (this._isEncryptedNonSSM(this._source) && this._hasContentToken(this._source))) {
                if (!this._prevSource?.drm?.ssmServerURL) { //TODO: Check this, might not be sufficient check for non-SSM content
                    this._clearTokenReFetchTimer();
                }
                this._updateStateAndTriggerEvent(DRMStates.INACTIVE);
            } else if (this._isEncryptedNonSSM(this._source) && !this._hasContentToken(this._source)) {
                if (!this._prevSource?.drm?.ssmServerURL) {
                    this._clearTokenReFetchTimer();
                }
                this._updateStateAndTriggerEvent(DRMStates.AWAITING_CONTENT_TOKEN);
                this._startContentTokenWaitTimer();
            } else if (this._isSSM(this._source) && this._hasContentToken(this._source)) {
                if (!this._prevSource?.drm?.ssmServerURL) {
                    this._clearTokenReFetchTimer();
                }
                this._updateStateAndTriggerEvent(DRMStates.AWAITING_SESSION_TOKEN);
            } else if (this._isSSM(this._source) && !this._hasContentToken(this._source)) {
                if (!this._prevSource?.drm?.ssmServerURL) {
                    this._clearTokenReFetchTimer();
                }
                this._updateStateAndTriggerEvent(DRMStates.AWAITING_CONTENT_TOKEN);
            }
        }
    }

    private _handleSourceFromLicenseRequestedState = () => {
        if (this._isNewSource(this._source, this._prevSource)) {
            if (this._isNullOrClear(this._source) || (this._isEncryptedNonSSM(this._source) && this._hasContentToken(this._source))) {
                this._licenseXHR?.abort();
                this._updateStateAndTriggerEvent(DRMStates.INACTIVE);
            } else if (this._isEncryptedNonSSM(this._source) && !this._hasContentToken(this._source)) {
                this._licenseXHR?.abort();
                this._updateStateAndTriggerEvent(DRMStates.AWAITING_CONTENT_TOKEN);
                this._startContentTokenWaitTimer();
            } else if (this._isSSM(this._source) && this._hasContentToken(this._source)) {
                this._licenseXHR?.abort();
                this._updateStateAndTriggerEvent(DRMStates.AWAITING_SESSION_TOKEN);
            } else if (this._isSSM(this._source) && !this._hasContentToken(this._source)) {
                this._licenseXHR?.abort();
                this._updateStateAndTriggerEvent(DRMStates.AWAITING_CONTENT_TOKEN);
            }
        }
    }

    private _handleSourceFromActiveState = () => {
        if (this._isNewSource(this._source, this._prevSource)) {
            if (this._isNullOrClear(this._source) || (this._isEncryptedNonSSM(this._source) && this._hasContentToken(this._source))) {
                this._updateStateAndTriggerEvent(DRMStates.INACTIVE);
            } else if (this._isEncryptedNonSSM(this._source) && !this._hasContentToken(this._source)) {
                this._updateStateAndTriggerEvent(DRMStates.AWAITING_CONTENT_TOKEN);
                this._startContentTokenWaitTimer();
            } else if (this._isSSM(this._source) && this._hasContentToken(this._source)) {
                this._updateStateAndTriggerEvent(DRMStates.AWAITING_SESSION_TOKEN);
            } else if (this._isSSM(this._source) && !this._hasContentToken(this._source)) {
                this._updateStateAndTriggerEvent(DRMStates.AWAITING_CONTENT_TOKEN);
            }
        }
    }

    private _handleSourceFromRenewalRequestedState = () => {
        if (this._isNewSource(this._source, this._prevSource)) {
            if (this._isNullOrClear(this._source) || (this._isEncryptedNonSSM(this._source) && this._hasContentToken(this._source))) {
                this._licenseXHR?.abort();
                this._updateStateAndTriggerEvent(DRMStates.INACTIVE);
            } else if (this._isEncryptedNonSSM(this._source) && !this._hasContentToken(this._source)) {
                this._licenseXHR?.abort();
                this._updateStateAndTriggerEvent(DRMStates.AWAITING_CONTENT_TOKEN);
                this._startContentTokenWaitTimer();
            } else if (this._isSSM(this._source) && this._hasContentToken(this._source)) {
                this._licenseXHR?.abort();
                this._updateStateAndTriggerEvent(DRMStates.AWAITING_SESSION_TOKEN);
            } else if (this._isSSM(this._source) && !this._hasContentToken(this._source)) {
                this._licenseXHR?.abort();
                this._updateStateAndTriggerEvent(DRMStates.AWAITING_CONTENT_TOKEN);
            }
        }
    }

    private _handleSourceFromErrorState = () => {
        if (this._isNewSource(this._source, this._prevSource)) {
            if (this._isNullOrClear(this._source) || (this._isEncryptedNonSSM(this._source) && this._hasContentToken(this._source))) {
                this._updateStateAndTriggerEvent(DRMStates.INACTIVE);
            } else if (this._isEncryptedNonSSM(this._source) && !this._hasContentToken(this._source)) {
                this._updateStateAndTriggerEvent(DRMStates.AWAITING_CONTENT_TOKEN);
                this._startContentTokenWaitTimer();
            } else if (this._isSSM(this._source) && this._hasContentToken(this._source)) {
                this._updateStateAndTriggerEvent(DRMStates.AWAITING_SESSION_TOKEN);
            } else if (this._isSSM(this._source) && !this._hasContentToken(this._source)) {
                this._updateStateAndTriggerEvent(DRMStates.AWAITING_CONTENT_TOKEN);
            }
        }
    }

    private _contentTokenPromiseHandler = (xResolve: any, xReject: any) => {
        this._contentTokenPromiseRef = { resolve: xResolve, reject: xReject };
    }

    private _waitForContentToken = () => {
        return new Promise(this._contentTokenPromiseHandler);
    }

    private _waitForSSMSessionToken() {
        return new Promise(this._ssmSessionTokenPromiseHandler);
    }

    /**
      * @function _startContentTokenWaitTimer
      * @summary Start a timer to wait for the content token
      */
    private _startContentTokenWaitTimer = () => {
        if (this._source?.token) {
            this._logger.log(
                LOG_LEVEL.DEBUG,
                "DRM.ts: _waitForContentToken() _contentToken is now available"
            );
        } else if (this._source === null) {
            let error = {
                errorCode: PluginErrorCode.NULL_SOURCE,
                errorMessage: "Source is null",
            };
            this._logger.log(
                LOG_LEVEL.DEBUG,
                "DRM.ts: _waitForContentToken(): ", error.errorMessage
            );
            this._updateStateAndTriggerEvent(DRMStates.ERROR, error);
        }
        this._contentTokenReFetchTimerID = setInterval(() => {
            if (this._contentTokenReFetchCount < DRM.CONTENT_TOKEN_REFETCH_MAX_LIMIT) {
                if (this._source.token) {
                    this._logger.log(
                        LOG_LEVEL.DEBUG,
                        "DRM.ts: _waitForContentToken() _contentToken is now available"
                    );
                    this._clearTokenReFetchTimer();
                    if (this._contentTokenPromiseRef) {
                        this._contentTokenPromiseRef?.resolve(true);
                    } else {
                        this._updateStateAndTriggerEvent(DRMStates.INACTIVE);
                    }
                } else {
                    ++this._contentTokenReFetchCount;
                }
            } else {
                this._logger.log(
                    LOG_LEVEL.DEBUG,
                    "DRM.ts: _waitForContentToken() _contentToken is not available"
                );
                this._clearTokenReFetchTimer();
                let error = {
                    errorCode: PluginErrorCode.SSM_CONTENT_TOKEN_ERROR, //TODO: Need a new error code
                    errorMessage: "Token was not available",
                };
                this._updateStateAndTriggerEvent(DRMStates.ERROR, error);
                this._contentTokenPromiseRef?.reject(error.errorMessage);
            }
        }, DRM.CONTENT_TOKEN_FETCH_INTERVAL);
    }

    /**
      * @function _clearTokenReFetchTimer
      * @summary clear token fetch interval
      */
    private _clearTokenReFetchTimer = () => {
        this._contentTokenReFetchCount = 0;

        if (this._contentTokenReFetchTimerID) {
            clearInterval(this._contentTokenReFetchTimerID);
            this._contentTokenReFetchTimerID = null;
        }
    };

    private _isCertificateRequest(playloadLength: number) {
        return playloadLength < DRM.CERTIFICATE_PAYLOAD_LENGTH
    }

    // Return the license challenge in a Json string 
    private _packageBase64Payload = (challenge) => {
        let base64String = btoa(String.fromCharCode(...new Uint8Array(challenge)));
        return `{"challenge":"${base64String}"}`;
    }

    // return the first license in Uint8Array
    private _unpackageLicense = (response: string) => {
        let responseObj = JSON.parse(response);
        return Uint8Array.from(atob(responseObj.license[0]), c =>
            c.charCodeAt(0)
        );
    }

    private _enforcedModeEnabled = (response: string) => {
        let responseObj = JSON.parse(response);
        return responseObj.sessionDrmEnforced === undefined
            || responseObj.sessionDrmEnforced === null
            || responseObj.sessionDrmEnforced;

    }
}
