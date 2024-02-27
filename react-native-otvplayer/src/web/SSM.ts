// Copyright (c) 2020--2023 Nagravision SA. All rights reserved.
import { Logger } from "./../Logger";

import {
    OTVSDK_LOGLEVEL as LOG_LEVEL
} from "./../common/enums";

import {
    SsmResponse,
    PlayerSource,
    SSMStates,
    PluginErrorParam
} from "./common/interface";

import { PluginErrorCode } from "./common/ErrorHandler";
import { OTTHelper } from "./OTTHelper"

type StateChangedCb = (state: SSMStates, source: any, session: any, error: PluginErrorParam) => void;

export class SSM {
    static readonly DEFAULT_TOKEN_TYPE: string = "nv-authorizations";
    static readonly SETUP_ENDPOINT: string = "/sessions/setup";
    static readonly TEARDOWN_ENDPOINT: string = "/sessions/teardown";
    static readonly HEARTBEAT_ENDPOINT: string = "/sessions/heartbeat";
    static readonly WIDEVINE_RENEW_ENDPOINT: string = "/renewal-license-wv";


    static readonly CONTENT_TOKEN_REFETCH_MAX_LIMIT: number = 50;
    static readonly CONTENT_TOKEN_FETCH_INTERVAL: number = 100;
    static readonly MS_IN_SECONDS: number = 1000;
    static readonly HTTP_OK: number = 200;

    private _ssmState: SSMStates;
    private _player;
    private _onStateChangedCb: StateChangedCb;
    private _currentSource: PlayerSource; // Currently set source
    private _newSource: PlayerSource; // Pending source request
    private _ssmSession: SsmResponse;
    private _logger;

    private _ssmHeartbeatInterval: number;
    private _contentToken: string = null;
    private _contentTokenReFetchCount: number = 0;
    private _contentTokenReFetchTimerID: ReturnType<typeof setInterval> | null;

    constructor(onStateChanged: StateChangedCb) {
        this._ssmState = SSMStates.SESSION_OFF;
        this._ssmSession = null;
        this._currentSource = Object.assign({});

        this._onStateChangedCb = onStateChanged;
        this._logger = new Logger();

        this._logger.log(LOG_LEVEL.DEBUG, "SSM.ts", "constructor");
    }

    public setPlayer(player) {
        this._player = player;
    }

    // This is added so that this can be called internally to
    // re-check a state change based on source updates
    private _actionStateChange() {
        this._logger.log(LOG_LEVEL.DEBUG, "SSM.ts", "_actionStateChange",
            "Current SSM state is." + OTTHelper.getSSMStateString(this._ssmState),
            "New source is: ", JSON.stringify(this._newSource));
        if (this._newSource === undefined || this._newSource === null) {
            // there are no changes for source when newsource is null
            // the newsource should be {} object when DRM module reset 
            // ssm source. Do directly return to avoid null pointer crash.
            this._logger.log(LOG_LEVEL.DEBUG, "SSM.ts", "_actionStateChange", "There is no change for source.");
            return;
        }
        switch (this._ssmState) {
            case SSMStates.SESSION_OFF:
                this._updateSourceAndToken();
                this._checkAndTriggerSSMSetup(); //=>AWAITING_CONTENT_TOKEN or SETUP_REQUESTED
                break;

            case SSMStates.AWAITING_CONTENT_TOKEN:
                this._updateSourceAndToken();
                this._clearTokenReFetchTimer();
                this._checkAndSetSessionOff(); //=>SESSION_OFF
                this._checkAndTriggerSSMSetup(); //=>AWAITING_CONTENT_TOKEN or SETUP_REQUESTED
                break;

            case SSMStates.SESSION_ON:
                // clear Heartbeat/Enforced mode timer
                this._clearSSMHeartbeatIntervalTimer();
                this._requestTeardown(); //=>TEARDOWN_REQUESTED
                break;

            case SSMStates.ERROR:
                // New source is empty/non-SSM
                this._clearSSMHeartbeatIntervalTimer();
                this._updateSourceAndToken();
                this._checkAndSetSessionOff(); //=>SESSION_OFF
                this._checkAndTriggerSSMSetup(); //=>AWAITING_CONTENT_TOKEN or SETUP_REQUESTED
                break;

            case SSMStates.SETUP_REQUESTED: //=>SESSION_ON
            case SSMStates.TEARDOWN_REQUESTED: //=>SESSION_OFF
            case SSMStates.RENEWAL_REQUESTED: //=>SESSION_ON
                // A setup or teardown or renewal completion will anyway trigger a recheck of state
                // based on this._newSource, so no need to do anything here
                break;

            default:
                this._logger.log(LOG_LEVEL.ERROR, "SSM.ts", "Invalid SSM State!!!");
        }
    }

    private _checkAndSetSessionOff() {
        const drm = this._currentSource.drm;
        if (Object.keys(this._currentSource).length === 0
            || drm?.ssmServerURL === null
            || drm?.ssmServerURL === undefined) {
            this._updateStateAndTriggerEvent(SSMStates.SESSION_OFF);
        }
    }

    private _checkAndTriggerSSMSetup() {
        if (this._currentSource?.drm?.ssmServerURL) {
            if (this._isValidContentToken(this._contentToken)) {
                // Move to SETUP_REQUESTED
                this._requestSetup();
            } else {
                // Move to AWAITING_CONTENT_TOKEN
                this._clearTokenReFetchTimer();
                this._waitForContentToken();
            }
        }
    }

    private _updateSourceAndToken() {
        this._currentSource = this._newSource;
        this._contentToken = this._isValidContentToken(this._currentSource.token) ? this._currentSource.token : null;
        this._newSource = null;
    }

    /* 
    * Source change, use cases:
    * 1. No content playing -> SSM
    * 2. SSM content playing -> Non-SSM
    * 3. SSM conent playing -> SSM
    * 4. Non-SSM content playing -> SSM
    * 5. Non-SSM cotent playing -> Non-SSM
    * 6. SSM content playing -> source reset
    * 7. Non-SSM content playing -> source reset
    * 
    * Special Case: 
    * 1. No conent token provided -> Content token provided for the same source
    * 2. New source is same as current source
    */

    public setSource(source) {
        // NOTE: Use null / undefined / empty source object only in cases
        // where you want to bring SSM to dormant state
        // For example stop and unmount
        this._logger.log(LOG_LEVEL.DEBUG, "SSM.ts", "setSource", JSON.stringify(source));

        // Check if this is just a content token update for the current source
        if (source && this._currentSource) {
            const { src, token } = this._currentSource;
            // NOTE: Empty string tokens are considered as valid
            if (src === source.src) {
                // Allow only one time update of token from invalid to a valid value
                if (!this._isValidContentToken(token) && this._isValidContentToken(source.token)) {
                    this._currentSource.token = source.token;
                    this._contentToken = this._currentSource.token;
                }
                return;
            } else {
                this._newSource = Object.assign({}, source);
            }
        } else {
            this._newSource = Object.assign({}, source);
        }

        // WARNING: beyond this point null/undefined is no longer a valid source
        // Only {} will be treated as a valid request to reset (if undefined/null 
        // was set by caller. A value of this._newSource = null will be considered
        // as no new source request pending. 
        this._actionStateChange();
    }

    // DRM request renewal
    public renewWidevine(requestPayload) {
        // Renew the current SSM session and trigger data through state change
        // DRM will use this for license renewal for WV content
        this._logger.log(LOG_LEVEL.DEBUG, "SSM.ts", "renewWidevine()");
        // Convert the request payload into the required JSON format
        const renewPayload = JSON.stringify({
            challenge: btoa(
                String.fromCharCode(...new Uint8Array(requestPayload))
            ),
        });

        let renewPromise = this._callWvLicenseRenewal(renewPayload);
        // Change state to RENEWAL_REQUESTED
        this._updateStateAndTriggerEvent(SSMStates.RENEWAL_REQUESTED);
        return renewPromise;
    }

    private _triggerWVRenewErrorEvent(errorResponse) {
        let errorMsg = "Widevine License Renewal Failed";
        let error = this._generateError(PluginErrorCode.SSM_HEARTBEAT_SEND_MESSAGE_FAILURE, errorMsg, this._ssmSession.serverUrl, errorResponse);
        this._logger.log(LOG_LEVEL.DEBUG, "SSM.ts", "_triggerWVRenewErrorEvent()", JSON.stringify(errorResponse));
        this._updateStateAndTriggerEvent(SSMStates.ERROR, error);
        // check state change in other event loop.
        this._actionStateChange();
    }

    private _triggerSessionOnEvent(license) {
        this._logger.log(LOG_LEVEL.DEBUG, "SSM.ts", "_triggerSessionOnEvent(): new widevine license: ", JSON.stringify(license));
        this._updateStateAndTriggerEvent(SSMStates.SESSION_ON);
        // check state change in other event loop.
        this._actionStateChange();
    }

    private _callWvLicenseRenewal(renewPayload) {
        const { tokenType } = this._currentSource;
        const tokenKey: string = tokenType || SSM.DEFAULT_TOKEN_TYPE;
        const endpointUrl = this._homogeniseSsmUri(this._currentSource?.drm?.ssmServerURL) + SSM.WIDEVINE_RENEW_ENDPOINT;
        const headers = {
            Accept: "application/json",
            "Content-Type": "application/json",
            [tokenKey]: this._ssmSession.sessionToken,
        };

        const that = this;

        return new Promise(function resolver(resolve, reject) {
            let xhr = new XMLHttpRequest();

            xhr.open("POST", endpointUrl, true);
            xhr.responseType = "text";
            for (let key in headers) {
                if (headers.hasOwnProperty(key)) {
                    xhr.setRequestHeader(key, headers[key]);
                }
            }

            xhr.onload = function onload() {
                if (xhr.status === SSM.HTTP_OK) {
                    try {
                        let responseJSON = JSON.parse(xhr.response);
                        // Extract the updated SSM session token
                        that._ssmSession.sessionToken = responseJSON.sessionToken;
                        // Convert the license to a Uint8Array to return to the SDK
                        let string = atob(responseJSON.license);
                        let buffer = new ArrayBuffer(string.length);
                        let array = new Uint8Array(buffer);
                        for (let i = 0, strLen = string.length; i < strLen; i++) {
                            array[i] = string.charCodeAt(i);
                        }
                        resolve(array);
                        that._triggerSessionOnEvent(array);
                    } catch (errorResponse) {
                        let errorMsg = "Failed JSON response parse: " + JSON.stringify(errorResponse);
                        reject(errorMsg);
                        that._triggerWVRenewErrorEvent(errorResponse)
                    }
                } else {
                    let errorMsg = "Failed to renew widevine license, HTTP status:" + xhr.status;
                    reject(errorMsg);
                    that._triggerWVRenewErrorEvent(errorMsg)
                }
            };

            xhr.onerror = function onerror() {
                let errorMsg = "Error on license renewal";
                reject(errorMsg);
                that._triggerWVRenewErrorEvent(errorMsg)
            };

            xhr.send(renewPayload);
        });
    }

    public setLicenseCustomData(data) {
        this._logger.log(LOG_LEVEL.DEBUG, "SSM.ts", "setLicenseCustomData, session token ", data?.sessionToken);
        if (this._currentSource.drm) {
            let heartbeatMode = true;
            if (data?.sessionToken) {
                //enforce mode. To call API for renewal.
                // A customData field with a sessionToken attribute must be contained in enforce mode, 
                // otherwise we must use heartbeat mode. The session token in customData is not used
                this._ssmSession.sessionToken = data.sessionToken;
                heartbeatMode = false;
            }
            if (!this._ssmHeartbeatInterval) {
                this._startHeartbeatInterval(heartbeatMode);
            }
        }
    }

    /**
      * @function startHeartbeatInterval
      * @summary Start the SSM heartbeat timer to send a license request/renewal at the requested period
      * @param heartbeatMode
      */
    private _startHeartbeatInterval(heartbeatMode) {
        // Start the SSM heartbeat timer to send a license request/renewal at the requested period
        let ssmHeartbeatCB = heartbeatMode
            ? this._sendSSMHeartbeat
            : this._proactiveLicenseRequest;

        this._ssmHeartbeatInterval = window.setInterval(
            ssmHeartbeatCB,
            this._ssmSession.heartbeat * SSM.MS_IN_SECONDS
        );
    }

    /**
      * @function proactiveLicenseRequest
      * @summary
      * @param
      */
    private _proactiveLicenseRequest = () => {
        this._logger.log(LOG_LEVEL.DEBUG, "calling proactiveLicenseRequest");
        // Change state to RENEWAL_REQUESTED
        this._updateStateAndTriggerEvent(SSMStates.RENEWAL_REQUESTED);
        if (this._player) {
            this._player.otvtoolkit().drmController.renewLicence();
        }
        this._updateStateAndTriggerEvent(SSMStates.SESSION_ON);
        // Trigger check for any changes required due to new source
        this._actionStateChange();
    }

    private _sendSSMHeartbeat = () => {
        const token = this._ssmSession.sessionToken;
        const { drm, tokenType } = this._currentSource;
        let tokenKey: string = tokenType || SSM.DEFAULT_TOKEN_TYPE;
        const endpointUrl = this._homogeniseSsmUri(drm.ssmServerURL) + SSM.HEARTBEAT_ENDPOINT;

        this._callSsm(endpointUrl, tokenKey, token)
            .then((response: SsmResponse) => {
                this._logger.log(LOG_LEVEL.DEBUG, "SSM.ts", "_sendSSMHeartbeat() - New session token: " + response.sessionToken);
                this._ssmSession.sessionToken = response.sessionToken;
                this._updateStateAndTriggerEvent(SSMStates.SESSION_ON);
            })
            .catch((errorResponse) => {
                let errorMsg = "Send heartbeat error";
                let error = this._generateError(PluginErrorCode.SSM_HEARTBEAT_SEND_MESSAGE_FAILURE, errorMsg, endpointUrl, errorResponse);
                this._updateStateAndTriggerEvent(SSMStates.ERROR, error);
                this._logger.log(LOG_LEVEL.DEBUG, "SSM.ts", "_sendSSMHeartbeat: Failed ", JSON.stringify(errorResponse));
            })
            .finally(() => {
                // Trigger check for any changes required due to new source
                this._actionStateChange();
            });
        // Change state to RENEWAL_REQUESTED
        this._updateStateAndTriggerEvent(SSMStates.RENEWAL_REQUESTED);
    }

    private _updateStateAndTriggerEvent(newState: SSMStates, error?: PluginErrorParam) {
        this._logger.log(LOG_LEVEL.DEBUG, "SSM.ts", "_updateStateAndTriggerEvent",
            OTTHelper.getSSMStateString(this._ssmState), '==>', OTTHelper.getSSMStateString(newState));
        this._ssmState = newState;
        this._logger.log(LOG_LEVEL.DEBUG, "SSM.ts",
            "call onStateChanged callback of DRM: state: ", OTTHelper.getSSMStateString(newState),
            " source: ", JSON.stringify(this._currentSource),
            " ssm session: ", JSON.stringify(this._ssmSession),
            " error: ", JSON.stringify(error));
        this._onStateChangedCb(
            newState,
            this._currentSource,
            this._ssmSession,
            error // Only valid if the state changes to error 
        );
    }

    private _callSsm(url, tokenKey, token) {
        let headers = {
            Accept: "application/json",
            [tokenKey]: token,
            "content-type": "application/json; charset=utf-8",
        };

        const that = this;

        return new Promise(function resolver(resolve, reject) {
            const xhr = new XMLHttpRequest();
            xhr.open("POST", url, true);
            xhr.responseType = "text";
            for (let key in headers) {
                if (headers.hasOwnProperty(key)) {
                    xhr.setRequestHeader(key, headers[key]);
                }
            }

            xhr.onload = function onload() {
                let response = JSON.parse(xhr.response);
                if (xhr.status === SSM.HTTP_OK) {
                    resolve(response);
                } else {
                    that._logger.log(LOG_LEVEL.ERROR, "SSM.ts", "_callSSM", JSON.stringify(response));
                    reject(response);
                }
            };

            xhr.onerror = function onerror() {
                reject("Failed SSM API call, Status code:" + xhr.status + ", Status text: " + xhr.statusText);
            };

            xhr.send("{}");
        });
    }

    private _requestSetup() {
        const { token, drm, tokenType } = this._currentSource;
        let tokenKey: string = tokenType || SSM.DEFAULT_TOKEN_TYPE;
        const endpointUrl = this._homogeniseSsmUri(drm?.ssmServerURL) + SSM.SETUP_ENDPOINT;

        this._callSsm(endpointUrl, tokenKey, token)
            .then((response: SsmResponse) => {
                if (
                    typeof response.heartbeat !== "number" ||
                    typeof response.heartbeat === "undefined" ||
                    response.heartbeat <= 0) {
                    this._logger.log(LOG_LEVEL.DEBUG, "SSM.ts", "_requestSetup: Failed ", JSON.stringify(response));
                    let errorMsg = "SSM heartbeat error";
                    let error = this._generateError(PluginErrorCode.SSM_HEARTBEAT_SEND_MESSAGE_FAILURE, errorMsg, endpointUrl, response);
                    this._updateStateAndTriggerEvent(SSMStates.ERROR, error);
                } else {
                    // Update session data
                    this._ssmSession = {
                        sessionToken: response.sessionToken,
                        serverUrl: endpointUrl,
                        heartbeat: response.heartbeat,
                    }
                    this._logger.log(LOG_LEVEL.DEBUG, "SSM.ts", "_requestSetup: Success ", JSON.stringify(response));
                    this._updateStateAndTriggerEvent(SSMStates.SESSION_ON);
                }
            })
            .catch((errorResponse) => {
                let errorCode;
                let errorMsg;
                switch (errorResponse.errorCode) {
                    case PluginErrorCode.SSM_HEARTBEAT_SEND_MESSAGE_FAILURE:
                        errorCode = PluginErrorCode.SSM_HEARTBEAT_SEND_MESSAGE_FAILURE;
                        errorMsg = "Invalid heartbeat period";
                        break;

                    case PluginErrorCode.USER_REACHED_MAXIMUM_SESSIONS_LIMIT:
                        errorCode = PluginErrorCode.USER_REACHED_MAXIMUM_SESSIONS_LIMIT;
                        errorMsg = "Maximum sessions limit reached";
                        break;

                    default:
                        errorCode = PluginErrorCode.SSM_SETUP_FAILURE;
                        errorMsg = "SSM setup request failed";
                        break;
                }
                this._logger.log(LOG_LEVEL.DEBUG, "SSM.ts", "_requestSetup: Failed ", JSON.stringify(errorResponse));
                let error = this._generateError(errorCode, errorMsg, endpointUrl, errorResponse);
                this._updateStateAndTriggerEvent(SSMStates.ERROR, error);
            })
            .finally(() => {
                // Trigger check for any changes required due to new source
                this._actionStateChange();
            });

        // Change state to SETUP_REQUESTED
        this._updateStateAndTriggerEvent(SSMStates.SETUP_REQUESTED);
    }

    // Call to teardown will allways fall through to check  
    // and update states if there is a change in the _newSource
    private _requestTeardown() {
        const { drm, tokenType } = this._currentSource;

        if (this._ssmSession) {
            const endpointUrl = this._homogeniseSsmUri(drm?.ssmServerURL) + SSM.TEARDOWN_ENDPOINT;
            const { sessionToken } = this._ssmSession;
            let tokenKey: string = tokenType || SSM.DEFAULT_TOKEN_TYPE;

            this._callSsm(
                endpointUrl,
                tokenKey,
                sessionToken
            )
                .then((response) => {
                    // Update session data
                    this._ssmSession = null;
                    this._currentSource = Object.assign({});
                    this._updateStateAndTriggerEvent(SSMStates.SESSION_OFF);
                    this._logger.log(LOG_LEVEL.DEBUG, "SSM.ts", "_requestTeardown: Success ", JSON.stringify(response));
                })
                .catch((errorResponse) => {
                    let errorCode = PluginErrorCode.SSM_TEARDOWN_FAILURE;
                    let errorMsg = "SSM teardown failed";
                    let error = this._generateError(errorCode, errorMsg, endpointUrl, errorResponse);
                    this._updateStateAndTriggerEvent(
                        SSMStates.ERROR,
                        error
                    );
                    this._logger.log(LOG_LEVEL.ERROR, "SSM.ts", "_requestTeardown: Failed ", JSON.stringify(errorResponse));
                })
                .finally(() => {
                    // Trigger check for any changes required due to new source
                    this._actionStateChange();
                });
        }

        // Change state to TEARDOWN_REQUESTED
        this._updateStateAndTriggerEvent(SSMStates.TEARDOWN_REQUESTED);
    }

    /**
      * @function _waitForContentToken
      * @summary check token is available or not
      */
    private _waitForContentToken = () => {
        this._logger.log(LOG_LEVEL.DEBUG, "SSM.ts", "_waitForContentToken");

        if (this._isValidContentToken(this._contentToken)) {
            this._logger.log(
                LOG_LEVEL.DEBUG,
                "SSM.ts: _waitForContentToken() _contentToken is now available"
            );
            this._requestSetup();
        } else {
            this._contentTokenReFetchTimerID = setInterval(() => {
                if (this._contentTokenReFetchCount < SSM.CONTENT_TOKEN_REFETCH_MAX_LIMIT) {
                    if (this._isValidContentToken(this._contentToken)) {
                        this._logger.log(
                            LOG_LEVEL.DEBUG,
                            "SSM.ts: _waitForContentToken() _contentToken is now available"
                        );
                        this._clearTokenReFetchTimer();
                        this._requestSetup();
                    } else {
                        this._contentTokenReFetchCount++;
                    }
                } else {
                    this._logger.log(
                        LOG_LEVEL.DEBUG,
                        "SSM.ts: _waitForContentToken() _contentToken is not available"
                    );
                    this._clearTokenReFetchTimer();
                    let errorMsg = "Token was not available";
                    let error = this._generateError(PluginErrorCode.SSM_CONTENT_TOKEN_ERROR, errorMsg);
                    this._updateStateAndTriggerEvent(SSMStates.ERROR, error);

                }
            }, SSM.CONTENT_TOKEN_FETCH_INTERVAL);
        }

        this._updateStateAndTriggerEvent(SSMStates.AWAITING_CONTENT_TOKEN);
    }

    /**
      * @function _clearTokenReFetchTimer
      * @summary clear token fetch interval
      */
    public _clearTokenReFetchTimer = () => {
        this._contentTokenReFetchCount = 0;
        if (this._contentTokenReFetchTimerID) {
            clearInterval(this._contentTokenReFetchTimerID);
            this._contentTokenReFetchTimerID = null;
        }
    };

    /**
      * @function
      * @summary clear timer: SSM Heartbeat Interval.
      * @param
      */
    private _clearSSMHeartbeatIntervalTimer = () => {
        if (this._ssmHeartbeatInterval) {
            clearInterval(this._ssmHeartbeatInterval);
            this._ssmHeartbeatInterval = null;
        }
    };

    private _isValidContentToken(token: string) {
        // empty token is available token.
        return token !== null && token !== undefined;
    }

    private _homogeniseSsmUri(ssmServerUrl: string) {
        let newSSMUrl = ssmServerUrl;

        // Deal with optional parts of the URI
        if (ssmServerUrl) {
            let matches = ssmServerUrl.match(
                /^(http(s)?):(\/\/.*?)(\/v1)?(\/)?$/
                //|----|-|-| |-------||----| |--|
                //    1 2        3      4      5
            );
            const httpsMatchIndex = 1;
            const urlBodyIndex = 3;
            if (matches) {
                newSSMUrl =
                    `${matches[httpsMatchIndex]}:${matches[urlBodyIndex]}/v1`;
            }
        }
        return newSSMUrl;
    }

    private _generateError(pluginErrorCode: PluginErrorCode, errorMsg: string, url?: string | undefined, errorObj?: any) {
        let pluginError: PluginErrorParam = {
            errorCode: pluginErrorCode,
            errorMessage: errorMsg,
            content: {
                serverUrl: url,
                source: this._currentSource?.src,
                serverResponse: errorObj
            }
        };
        return pluginError;
    }
}