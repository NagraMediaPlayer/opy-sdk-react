// Copyright (c) 2020--2023 Nagravision SA. All rights reserved.
/**
 * @jest-environment jsdom
 * @jest-environment-options {"url": "https://jestjs.io/"}
 */

import { DRM } from "../../../src/web/DRM";
import {
	DRMStates,
	EncryptionTypes,
	LicenseMsgTypes,
	SSMStates,
} from "../../../src/web/common/interface";
import { PluginErrorCode } from "../../../src/web/common/ErrorHandler";
import sinon from "../../../node_modules/sinon/pkg/sinon";

import { SSM } from "../../../src/web/SSM";

jest.mock("../../../src/web/SSM");

const BBB_CLEAR = {
	src: "https://replacemewithyourown.com/vod/dash/clear/bbb_multi-resolution/bbb_public/bbb_public.mpd",
	type: "application/dash+xml",
};

const BBB_NON_SSM_WV_NO_TOKEN = {
	src: "https://d3bqrzf9w11pn3.cloudfront.net/basic_dash_bbb_encrypted/bbb_public_android.mpd",
	type: "application/dash+xml",
	drm: {
		licenseURL:
			"https://vsd02fy1.anycast.nagra.com/VSD02FY1/wvls/contentlicenseservice/v1/licenses",
		type: "Widevine",
	},
};

const BBB_NON_SSM_WV_WITH_TOKEN = {
	src: "https://d3bqrzf9w11pn3.cloudfront.net/basic_dash_bbb_encrypted/bbb_public_android.mpd",
	type: "application/dash+xml",
	token: "eyJraWQiOiI4MTI0MjUiLCJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ2ZXIiOiIxLjAiLCJ0eXAiOiJDb250ZW50QXV0aFoiLCJjb250ZW50UmlnaHRzIjpbeyJkdXJhdGlvbiI6NzIwMCwiZGVmYXVsdEtjSWRzIjpbIjAyMDgxMTNlLWU2ZTgtNDI0Mi04NjdjLWQ5NjNmNWQ3ODkyMyJdLCJjb250ZW50SWQiOiI0NjgyZjFkNi05ODIwLTQwNmEtOWJhMC03YzAzZGJjZjE5NmMiLCJzdG9yYWJsZSI6dHJ1ZSwiZW5jcnlwdGlvbk1ldGhvZCI6IlJBV19BRVNfMTI4X0NUUl9DRU5DIiwiZGVmYXVsdFVzYWdlUnVsZXMiOnsibWluTGV2ZWwiOjAsIndhdGVybWFya2luZ0VuYWJsZWQiOnRydWUsImltYWdlQ29uc3RyYWludCI6dHJ1ZSwiaGRjcFR5cGUiOiJUWVBFXzEiLCJ1bmNvbXByZXNzZWREaWdpdGFsQ2FwcGluZ1Jlc29sdXRpb24iOiJOT19SRVNUUklDVElPTlMiLCJ1bnByb3RlY3RlZEFuYWxvZ091dHB1dCI6dHJ1ZSwiYW5hbG9nQ2FwcGluZ1Jlc29sdXRpb24iOiJOT19SRVNUUklDVElPTlMiLCJoZGNwIjp0cnVlLCJkZXZpY2VDYXBwaW5nUmVzb2x1dGlvbiI6Ik5PX1JFU1RSSUNUSU9OUyIsImRpZ2l0YWxPbmx5IjpmYWxzZSwidW5wcm90ZWN0ZWREaWdpdGFsT3V0cHV0Ijp0cnVlfX1dfQ.fZpotjTjiddueE_nPVcON0FnJwBO4FecTcYIoMmocnw,eyJrY0lkcyI6WyIwMjA4MTEzZS1lNmU4LTQyNDItODY3Yy1kOTYzZjVkNzg5MjMiXSwidHlwIjoiSldUIiwiZW5jIjoiQTEyOENCQy1IUzI1NiIsImFsZyI6ImRpciIsImtpZCI6IjgxMjQyNSJ9..ntJUOAc-g8sXrGLjZhx-MQ.nHnm-aciNeCz6kwUZEjOQgg-1PsLN1Uc8eYihUv_OUK8EaBoFH7JcdIyB9igEFfR9Cufau_5H-EvTdrmws20_ViWKjUTOZmUn7xPQOmwSftb99-rgd3g4QZO0quHIDB5qiBoKmksts8qDbcMZbr_aKMFIOlzNUUcBwiOvmrGyzo.-zTh5sY7tmbe7Ow94EQT9A",
	drm: {
		licenseURL:
			"https://vsd02fy1.anycast.nagra.com/VSD02FY1/wvls/contentlicenseservice/v1/licenses",
		type: "Widevine",
	},
};

const BBB_SSM_WV_WITH_TOKEN = {
	src: "https://replacemewithyourown.com/vod/demo_content/ed_big_buck_bunny_1080p/big_buck_bunny.mpd?SSM1KBig Buck Bunny",
	type: "application/dash+xml",
	token: "eyJraWQiOiIyOTI4NDgiLCJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ2ZXIiOiIxLjAiLCJ0eXAiOiJDb250ZW50QXV0aFoiLCJkZXZpY2UiOnsiYWNjb3VudElkIjoiaHRtbDEwMDAifSwiY29udGVudFJpZ2h0cyI6W3siZGVmYXVsdEtjSWRzIjpbImIxM2U0NWQwLTAzMjQtNDZkZC04NGQ1LTNiMmQ2NzkyZWIzNCJdLCJjb250ZW50SWQiOiJkYXNoLWRlbW9fYmlnX2J1Y2tfYnVubnkiLCJzdG9yYWJsZSI6dHJ1ZSwiZW5jcnlwdGlvbk1ldGhvZCI6IlJBV19BRVNfMTI4X0NUUl9DRU5DIiwic2Vzc2lvbkNvbnRyb2wiOnsibWF4U2Vzc2lvbnMiOjEwMDAsInNlc3Npb25Db250cm9sRW5hYmxlZCI6dHJ1ZX0sImRlZmF1bHRVc2FnZVJ1bGVzIjp7Im1pbkxldmVsIjowLCJkaWdpdGFsT25seSI6ZmFsc2UsInVucHJvdGVjdGVkRGlnaXRhbE91dHB1dCI6dHJ1ZX19XX0.fOHrdSlUn2tEMGq9dzeW9oM_x0zTCN4bXvLss1PA7-U,eyJrY0lkcyI6WyJiMTNlNDVkMC0wMzI0LTQ2ZGQtODRkNS0zYjJkNjc5MmViMzQiXSwidHlwIjoiSldUIiwiZW5jIjoiQTEyOENCQy1IUzI1NiIsImFsZyI6ImRpciIsImtpZCI6IjI5Mjg0OCJ9..oFKeKIrHEWZUgYzCXNsA_w.sUjV6JcA80TptH-qmy6vAuLRBVWX_omdwxengBIM7jJwz3O9K3hn2hz6of5iv1ZEQ_Jk6FCoVsuZMpJHkUxJVofjaSlTEd76K2htJBo0kBmwlxlcu_fBihBgvGY6v0GMwHYucVeTakhgwDWcrvuRtXL7v7B8yoPlgFXwhpkv0so.Rv_Hvo0gCqwnK7_kvriUmw",
	drm: {
		licenseURL:
			"https://tenantname.anycast.nagra.com/TENANTNAME/wvls/contentlicenseservice/v1/licenses",
		ssmServerURL: "https://tenantname-ssm.anycast.nagra.com/TENANTNAME/ssm",
		type: "Widevine", // "com.widevine.alpha"
	},
};

const BBB_SSM_WV_NO_TOKEN = {
	src: "https://replacemewithyourown.com/vod/demo_content/ed_big_buck_bunny_1080p/big_buck_bunny.mpd?SSM1KBig Buck Bunny",
	type: "application/dash+xml",
	drm: {
		licenseURL:
			"https://tenantname.anycast.nagra.com/TENANTNAME/wvls/contentlicenseservice/v1/licenses",
		ssmServerURL: "https://tenantname-ssm.anycast.nagra.com/TENANTNAME/ssm",
		type: "Widevine", // "com.widevine.alpha"
	},
};

const ELE_DREAM_SSM_WV_NO_TOKEN = {
	src: "https://replacemewithyourown.com/vod/demo_content/ed_elephants_dream_1080p/elephants_dream.mpd?SSM1000 Elephants Dream",
	type: "application/dash+xml",
	drm: {
		licenseURL:
			"https://tenantname.anycast.nagra.com/TENANTNAME/wvls/contentlicenseservice/v1/licenses",
		ssmServerURL: "https://tenantname-ssm.anycast.nagra.com/TENANTNAME/ssm",
		type: "Widevine",
	},
};

const SINTEL_SSM_WV_WITH_TOKEN = {
	src: "https://replacemewithyourown.com/vod/demo_content/ed_sintel_1080p/sintel.mpd?SSM1000 Sintel",
	type: "application/dash+xml",
	token: "eyJraWQiOiIyOTI4NDgiLCJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ2ZXIiOiIxLjAiLCJ0eXAiOiJDb250ZW50QXV0aFoiLCJkZXZpY2UiOnsiYWNjb3VudElkIjoiaHRtbDEwMDAifSwiY29udGVudFJpZ2h0cyI6W3siZGVmYXVsdEtjSWRzIjpbIjRkZDY3MGRmLWI4NDgtNDc2Yi1hODYyLTYzMjFjN2FlN2ZkNSJdLCJjb250ZW50SWQiOiJkYXNoLWRlbW9fc2ludGVsXzRrIiwic3RvcmFibGUiOnRydWUsImVuY3J5cHRpb25NZXRob2QiOiJSQVdfQUVTXzEyOF9DVFJfQ0VOQyIsInNlc3Npb25Db250cm9sIjp7Im1heFNlc3Npb25zIjoxMDAwLCJzZXNzaW9uQ29udHJvbEVuYWJsZWQiOnRydWV9LCJkZWZhdWx0VXNhZ2VSdWxlcyI6eyJtaW5MZXZlbCI6MCwiZGlnaXRhbE9ubHkiOmZhbHNlLCJ1bnByb3RlY3RlZERpZ2l0YWxPdXRwdXQiOnRydWV9fV19.O6P_W5MDtppchgtDcjRf6lGtvndg8qYI0SvX5AsTSNw,eyJrY0lkcyI6WyI0ZGQ2NzBkZi1iODQ4LTQ3NmItYTg2Mi02MzIxYzdhZTdmZDUiXSwidHlwIjoiSldUIiwiZW5jIjoiQTEyOENCQy1IUzI1NiIsImFsZyI6ImRpciIsImtpZCI6IjI5Mjg0OCJ9..FnAMFZvETeg0qSeT4dIkHg.vxvzTz9qm0i2dyz61E0f7Bx342m-jUF65YdmXbFPir27_bMdHgYOuMPDK8zG9rXivMBjMfJ0zhTuOAFgZS1hWWmPM_dGih8aO1LBxcNLF46oamrkhvlg7AweyNFi66jYt3Pg_X2zfoH-8hScHqtSNA3I4xy1pQhZHT5GdaQZj-c.Ml7dqvscUJKPJRDuwOuHXg",
	drm: {
		licenseURL:
			"https://tenantname.anycast.nagra.com/TENANTNAME/wvls/contentlicenseservice/v1/licenses",
		ssmServerURL: "https://tenantname-ssm.anycast.nagra.com/TENANTNAME/ssm",
		type: "Widevine", // "com.widevine.alpha"
	},
};

const SINTEL_SSM_WV_NO_TOKEN = {
	src: "https://replacemewithyourown.com/vod/demo_content/ed_sintel_1080p/sintel.mpd?SSM1000 Sintel",
	type: "application/dash+xml",
	drm: {
		licenseURL:
			"https://tenantname.anycast.nagra.com/TENANTNAME/wvls/contentlicenseservice/v1/licenses",
		ssmServerURL: "https://tenantname-ssm.anycast.nagra.com/TENANTNAME/ssm",
		type: "Widevine", // "com.widevine.alpha"
	},
};

const SINTEL_NON_SSM_WV_WITH_TOKEN = {
	src: "https://replacemewithyourown.com/demo/content/ed_sintel_1080p/sintel.mpd",
	token: "eyJraWQiOiIyOTI4NDgiLCJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ2ZXIiOiIxLjAiLCJ0eXAiOiJDb250ZW50QXV0aFoiLCJjb250ZW50UmlnaHRzIjpbeyJkZWZhdWx0S2NJZHMiOlsiNGRkNjcwZGYtYjg0OC00NzZiLWE4NjItNjMyMWM3YWU3ZmQ1Il0sImNvbnRlbnRJZCI6ImRhc2gtZGVtb19zaW50ZWxfNGsiLCJzdG9yYWJsZSI6dHJ1ZSwiZW5jcnlwdGlvbk1ldGhvZCI6IlJBV19BRVNfMTI4X0NUUl9DRU5DIiwiZGVmYXVsdFVzYWdlUnVsZXMiOnsibWluTGV2ZWwiOjAsImRpZ2l0YWxPbmx5IjpmYWxzZSwidW5wcm90ZWN0ZWREaWdpdGFsT3V0cHV0Ijp0cnVlfX1dfQ.RE5W1q44m5Po-gdcfrn7sK-CdFzrEq44KiFo0KK7Kx0,eyJrY0lkcyI6WyI0ZGQ2NzBkZi1iODQ4LTQ3NmItYTg2Mi02MzIxYzdhZTdmZDUiXSwidHlwIjoiSldUIiwiZW5jIjoiQTEyOENCQy1IUzI1NiIsImFsZyI6ImRpciIsImtpZCI6IjI5Mjg0OCJ9..G9PbDGQNz8VOX7NXoePFtQ.eDmP659_5ZQHfCxjrwD5lCiiP1oZqxp3dQKWx1sMpeAau1cJKFl9QuO3Iy-1N9_SzLB3SmCVoQCGWVF9obv5np-RU5nsZshCODtfVI4RqFZNSk5_31sGcFOQAe5qxNYrzQ0auCr9gfNNCZDYuqgLAHPXQMWOGkxf9cxNKHI3Ook.Po0ergXEvtoq35Tss0tNRQ",
	type: "application/dash+xml",
	drm: {
		licenseURL:
			"https://tenantname.anycast.nagra.com/TENANTNAME/wvls/contentlicenseservice/v1/licenses",
		type: "Widevine",
	},
};

const SINTEL_NON_SSM_WV_NO_TOKEN = {
	src: "https://replacemewithyourown.com/demo/content/ed_sintel_1080p/sintel.mpd",
	type: "application/dash+xml",
	drm: {
		licenseURL:
			"https://tenantname.anycast.nagra.com/TENANTNAME/wvls/contentlicenseservice/v1/licenses",
		type: "Widevine",
	},
};

const ALIENS_NON_SSM_PLAYREADY_NO_TOKEN = {
	src: "https://replacemewithyourown.com/vod/dash/customers/sfr/scramble/ssp_playready_odfox_Aliens_HD_Subbed/odfox_Aliens_HD_Subbed.mpd",
	type: "application/dash+xml",
	drm: {
		licenseURL:
			"https://tenantname.anycast.nagra.com/TENANTNAME/prls/contentlicenseservice/v1/licenses",
		type: "Playready",
	},
};

const ALIENS_NON_SSM_PLAYREADY_WITH_TOKEN = {
	src: "https://replacemewithyourown.com/vod/dash/customers/sfr/scramble/ssp_playready_odfox_Aliens_HD_Subbed/odfox_Aliens_HD_Subbed.mpd",
	token: "eyJraWQiOiIyOTI4NDgiLCJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ2ZXIiOiIxLjAiLCJ0eXAiOiJDb250ZW50QXV0aFoiLCJjb250ZW50UmlnaHRzIjpbeyJkZWZhdWx0S2NJZHMiOlsiMjlhODQwNDMtMThmYy00MmM0LWEyYzAtZTFiNTBiNmMzZGVlIl0sImNvbnRlbnRJZCI6InBsYXlyZWFkeV9vZGZveF9BbGllbnNfSERfU3ViYmVkIiwic3RvcmFibGUiOnRydWUsImVuY3J5cHRpb25NZXRob2QiOiJSQVdfQUVTXzEyOF9DVFJfQ0VOQyIsImRlZmF1bHRVc2FnZVJ1bGVzIjp7Im1pbkxldmVsIjowLCJkaWdpdGFsT25seSI6dHJ1ZSwidW5wcm90ZWN0ZWREaWdpdGFsT3V0cHV0Ijp0cnVlfX1dfQ.Nx30R1AKkL56Yo9gXhtt1dCgWE9lGxb3hn27vKHJTfg,eyJrY0lkcyI6WyIyOWE4NDA0My0xOGZjLTQyYzQtYTJjMC1lMWI1MGI2YzNkZWUiXSwidHlwIjoiSldUIiwiZW5jIjoiQTEyOENCQy1IUzI1NiIsImFsZyI6ImRpciIsImtpZCI6IjI5Mjg0OCJ9..o7BOQcKDsEOOQNiKcb7OKw.ySAxGU1BS_uXckE-Huu1BAVfHsNQC13DMkL70ZQtCZmZ4JMF_le5n_e0fsidDC6fKAvbmroEC0Xp2_57TmeVHDSnppeu9yh7eFZ4bPZslSEYMG455ZO0jHGsouC7wu5lBq5Zl4crXgeJSm17LBvP2sD0ZrhHv6PWb1uXDXgEx4A.j1T62cf3n35-C8WdoG67hA",
	type: "application/dash+xml",
	drm: {
		licenseURL:
			"https://tenantname.anycast.nagra.com/TENANTNAME/prls/contentlicenseservice/v1/licenses",
		type: "Playready",
	},
};

const NON_SSM_TEARS_FAIRPLAY_WITH_TOKEN = {
	src: "https://replacemewithyourown.com/vod/hls5/scramble/TOS_1080p_24fps_ts_encrypted_fairplay/master-ssp.m3u8",
	type: "application/x-mpegURL",
	drm: {
		licenseURL:
			"https://tenantname.anycast.nagra.com/TENANTNAME/fpls/contentlicenseservice/v1/licenses",
		certificateURL:
			"https://tenantname.anycast.nagra.com/TENANTNAME/fpls/contentlicenseservice/v1/certificates",
		type: "Fairplay",
	},
	token: "eyJraWQiOiIyOTI4NDgiLCJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ2ZXIiOiIxLjAiLCJ0eXAiOiJDb250ZW50QXV0aFoiLCJjb250ZW50UmlnaHRzIjpbeyJkZWZhdWx0S2NJZHMiOlsiMTBmZjlhMzEtMTBiZC00ODgwLWIyMzEtZmZkZjg0ZGNhOGMyIl0sImNvbnRlbnRJZCI6IjJhNmY4NWI1LWM0MWYtNDYxZi04ZmYyLWFhM2MxOWE2MjljZCIsInN0b3JhYmxlIjp0cnVlLCJkZWZhdWx0VXNhZ2VSdWxlcyI6eyJtaW5MZXZlbCI6MCwiZGlnaXRhbE9ubHkiOnRydWUsInVucHJvdGVjdGVkRGlnaXRhbE91dHB1dCI6dHJ1ZX19XX0.ch1hZliH8J4qVeGcgGJFUFJqc4DxJ4iP_xGczf9yqHA",
};

const NON_SSM_TVKEY_BBB_WITH_TOKEN = {
	src: "https://replacemewithyourown.com/vod/dash/scramble/bbb_prm_cenc_mpd/dash/connect-manifest-prm-pssh.mpd",
	type: "application/dash+xml",
	token: "eyJraWQiOiI1ODc2OTAiLCJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ2ZXIiOiIxLjAiLCJ0eXAiOiJDb250ZW50QXV0aFoiLCJjb250ZW50UmlnaHRzIjpbeyJkZWZhdWx0S2NJZHMiOlsiMmU0NGE1YTItMjgyNy00MTllLThjZDktY2U0MzY3YmNkMTA2Il0sImNvbnRlbnRJZCI6IjBmMTFmOTUwLWQ5N2UtMTFlYi1iOGJjLTAyNDJhYzEzMDAwMyIsImVuY3J5cHRpb25NZXRob2QiOiJSQVdfQUVTXzEyOF9DVFJfQ0VOQyIsInVzYWdlUnVsZXNQcm9maWxlSWQiOiJUZXN0In1dfQ.tur1maSbIXKUkAs0lkCVePvRu_MUB28n_KfO93-6uwI,eyJrY0lkcyI6WyIyZTQ0YTVhMi0yODI3LTQxOWUtOGNkOS1jZTQzNjdiY2QxMDYiXSwidHlwIjoiSldUIiwiZW5jIjoiQTEyOENCQy1IUzI1NiIsImFsZyI6ImRpciIsImtpZCI6IjUyMDM0In0..qRhiM9VRk2yCBHi1WXBmlg.ZiLySDy13u_qLrytD1eWB5iHyRU7PxrPLn-eBN2nnMv2suzCBFj9Xpo4afOgaMbHSXnuDuf06mGJmHZL_D19-UfvAEwStWiwZMtTUDCzHJCGpgDzRO5TY92p3VWHNVxOsZXvDBsmoDseTk5yN1EwiMyU3DhTu9nhwxDKLLgOa-s.OVj-feVpGHNnLY-hMfA6DQ",
	drm: {
		licenseURL:
			"https://tvkcloud.anycast.nagra.com/TVKCLOUD/tkls/contentlicenseservice/v1/licenses",
		type: "TVKey",
	},
};

const NON_SSM_FAIRPLAY_TEARS_OF_STEEL_WITH_TOKEN = {
	src: "https://replacemewithyourown.com/vod/hls5/scramble/TOS_1080p_24fps_ts_encrypted_fairplay/master-ssp.m3u8",
	type: "application/x-mpegURL",
	drm: {
		licenseURL:
			"https://tenantname.anycast.nagra.com/TENANTNAME/fpls/contentlicenseservice/v1/licenses",
		certificateURL:
			"https://tenantname.anycast.nagra.com/TENANTNAME/fpls/contentlicenseservice/v1/certificates",
		type: "Fairplay",
	},
	token: "eyJraWQiOiIyOTI4NDgiLCJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ2ZXIiOiIxLjAiLCJ0eXAiOiJDb250ZW50QXV0aFoiLCJjb250ZW50UmlnaHRzIjpbeyJkZWZhdWx0S2NJZHMiOlsiMTBmZjlhMzEtMTBiZC00ODgwLWIyMzEtZmZkZjg0ZGNhOGMyIl0sImNvbnRlbnRJZCI6IjJhNmY4NWI1LWM0MWYtNDYxZi04ZmYyLWFhM2MxOWE2MjljZCIsInN0b3JhYmxlIjp0cnVlLCJkZWZhdWx0VXNhZ2VSdWxlcyI6eyJtaW5MZXZlbCI6MCwiZGlnaXRhbE9ubHkiOnRydWUsInVucHJvdGVjdGVkRGlnaXRhbE91dHB1dCI6dHJ1ZX19XX0.ch1hZliH8J4qVeGcgGJFUFJqc4DxJ4iP_xGczf9yqHA",
};

const SSM_BBB_WITH_TOKEN = {
	src: "https://replacemewithyourown.com/vod/hls6/scramble/bbb_sunflower_60fps_fmp4_fps_scramble/master-ssp.m3u8",
	token: "eyJraWQiOiI2MTgyMzgiLCJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ2ZXIiOiIxLjAiLCJ0eXAiOiJDb250ZW50QXV0aFoiLCJkZXZpY2UiOnsiYWNjb3VudElkIjoiaW9zMTAwMCJ9LCJjb250ZW50UmlnaHRzIjpbeyJkZWZhdWx0S2NJZHMiOlsiMTBmZjlhMzEtMTBiZC00ODgwLWIyMzEtZmZkZjg0ZGNhOGMyIl0sImNvbnRlbnRJZCI6IjJhNmY4NWI1LWM0MWYtNDYxZi04ZmYyLWFhM2MxOWE2MjljZCIsInN0b3JhYmxlIjp0cnVlLCJzZXNzaW9uQ29udHJvbCI6eyJtYXhTZXNzaW9ucyI6MTAwMCwic2Vzc2lvbkNvbnRyb2xFbmFibGVkIjp0cnVlfSwiZGVmYXVsdFVzYWdlUnVsZXMiOnsibWluTGV2ZWwiOjAsImRpZ2l0YWxPbmx5Ijp0cnVlLCJ1bnByb3RlY3RlZERpZ2l0YWxPdXRwdXQiOnRydWV9fV19.uHSVqlgaK_vKfL2wyuHcddGE1IcCzHLEaJ-YlK2gf2s",
	type: "application/x-mpegURL",
	drm: {
		licenseURL:
			"https://tenantname.anycast.nagra.com/TENANTNAME/fpls/contentlicenseservice/v1/licenses",
		certificateURL:
			"https://tenantname.anycast.nagra.com/TENANTNAME/fpls/contentlicenseservice/v1/certificates",
		ssmServerURL: "https://tenantname-ssm.anycast.nagra.com/TENANTNAME/ssm",
		type: "Fairplay",
	},
};

let drm;

// Spies
let updateStateFn;
let getWidevineLicenseFunc;
let clearContentTokenTimerFn;
let startContentTokenWaitTimerFn;

let xhrOpenCount;
let xhrSendCount;

let errorCallback = function () {};

const xhrMockClass = () => ({
	open: () => ++xhrOpenCount,
	send: () => ++xhrSendCount,
	setRequestHeader: jest.fn(),
	abort: jest.fn(),
});
window.XMLHttpRequest = jest.fn().mockImplementation(xhrMockClass);

jest.mock("../../../src/web/NMPWebPlayer", () => jest.fn());
jest.mock("../../../src/web/OTVSDKManager", () => jest.fn());

// Configuring sinon server
// Defaults
// server.autoRespond = false;
// server.autoRespondAfter = 10; // in milliseconds
// server.respondImmediately = false;
// server.fakeHTTPMethods = false;

// // configure fakeServer to autoRespond
// server.autoRespond = true;

// // Change server now to respondImmediately
// server.configure({ respondImmediately: true });

const setLicenseCustomDataFn = jest.fn();

beforeEach(() => {
	drm = new DRM(errorCallback);
	jest.useFakeTimers();
	xhrOpenCount = 0;
	xhrSendCount = 0;
	updateStateFn = jest.spyOn(drm, "_updateStateAndTriggerEvent");
	getWidevineLicenseFunc = jest.spyOn(drm, "_getWidevineLicense");
	clearContentTokenTimerFn = jest.spyOn(drm, "_clearTokenReFetchTimer");
	startContentTokenWaitTimerFn = jest.spyOn(
		drm,
		"_startContentTokenWaitTimer"
	);
	SSM.mockImplementation(() => {
		return {
			setSource: jest.fn(),
			renewWidevine: () => {
				return Promise.resolve("license string");
			},
			setLicenseCustomData: setLicenseCustomDataFn,
		};
	});
});

afterEach(() => {
	sinon.reset();
	jest.clearAllMocks();
});

// TODO: Test cases with empty source objects passed?

// TODO: Some more tests with different initial sources?

describe("Null source", () => {
	test("State: INACTIVE", () => {
		drm._drmState = DRMStates.INACTIVE;
		drm._source = BBB_NON_SSM_WV_WITH_TOKEN;

		drm.setSource(null);

		expect(updateStateFn).not.toHaveBeenCalled();
		expect(drm._drmState).toEqual(DRMStates.INACTIVE);
	});

	test("State: AWAITING_CONTENT_TOKEN, current source: non-SSM", () => {
		drm._drmState = DRMStates.AWAITING_CONTENT_TOKEN;
		drm._source = BBB_NON_SSM_WV_WITH_TOKEN;

		drm.setSource(null);

		expect(clearContentTokenTimerFn).toHaveBeenCalled();
		expect(updateStateFn).toHaveBeenCalledWith(DRMStates.INACTIVE);
		expect(drm._drmState).toEqual(DRMStates.INACTIVE);
	});

	test("State: AWAITING_CONTENT_TOKEN, current source: SSM", () => {
		drm._drmState = DRMStates.AWAITING_CONTENT_TOKEN;
		drm._source = ELE_DREAM_SSM_WV_NO_TOKEN;

		drm.setSource(null);

		expect(clearContentTokenTimerFn).not.toHaveBeenCalled();
		expect(updateStateFn).toHaveBeenCalledWith(DRMStates.INACTIVE);
		expect(drm._drmState).toEqual(DRMStates.INACTIVE);
	});

	test("State: AWAITING_SESSION_TOKEN  - Set null source", () => {
		drm._drmState = DRMStates.AWAITING_SESSION_TOKEN;
		drm._source = SINTEL_SSM_WV_WITH_TOKEN;

		drm.setSource(null);

		expect(clearContentTokenTimerFn).not.toHaveBeenCalled(); //TODO: Needed? No harm if left
		expect(getWidevineLicenseFunc).not.toHaveBeenCalled(); //TODO: Needed? No harm if left
		expect(updateStateFn).not.toHaveBeenCalled();
		expect(drm._drmState).toEqual(DRMStates.AWAITING_SESSION_TOKEN);
	});

	test("State: LICENSE_REQUESTED", () => {
		drm._drmState = DRMStates.LICENSE_REQUESTED;
		drm._source = SINTEL_SSM_WV_WITH_TOKEN;
		drm._licenseXHR = new XMLHttpRequest();
		let abortLicenseXHR = jest.spyOn(drm._licenseXHR, "abort");

		drm.setSource(null);

		expect(abortLicenseXHR).toHaveBeenCalled();
		expect(updateStateFn).toHaveBeenCalledWith(DRMStates.INACTIVE);
		expect(drm._drmState).toEqual(DRMStates.INACTIVE);
	});

	test("State: ACTIVE", () => {
		drm._drmState = DRMStates.ACTIVE;
		drm._source = SINTEL_SSM_WV_WITH_TOKEN;

		drm.setSource(null);

		expect(clearContentTokenTimerFn).not.toHaveBeenCalled(); //TODO: Needed? No harm if left
		expect(updateStateFn).toHaveBeenCalledWith(DRMStates.INACTIVE);
		expect(drm._drmState).toEqual(DRMStates.INACTIVE);
	});

	test("State: RENEWAL_REQUESTED", () => {
		drm._drmState = DRMStates.RENEWAL_REQUESTED;
		drm._source = SINTEL_SSM_WV_WITH_TOKEN;
		drm._licenseXHR = new XMLHttpRequest(); //TODO: Swap for a mock implementation
		let abortLicenseXHR = jest.spyOn(drm._licenseXHR, "abort");

		drm.setSource(null);

		expect(abortLicenseXHR).toHaveBeenCalledTimes(1);
		expect(clearContentTokenTimerFn).not.toHaveBeenCalled(); //TODO: Needed? No harm if left
		expect(updateStateFn).toHaveBeenCalledWith(DRMStates.INACTIVE);
		expect(drm._drmState).toEqual(DRMStates.INACTIVE);
	});

	test("State: ERROR", () => {
		drm._drmState = DRMStates.ERROR;
		drm._source = SINTEL_SSM_WV_WITH_TOKEN;

		drm.setSource(null);

		expect(clearContentTokenTimerFn).not.toHaveBeenCalled(); //TODO: Needed? No harm if left
		expect(updateStateFn).toHaveBeenCalledWith(DRMStates.INACTIVE);
		expect(drm._drmState).toEqual(DRMStates.INACTIVE);
	});
});

describe("New clear source", () => {
	test("State: INACTIVE", () => {
		drm._drmState = DRMStates.INACTIVE;
		drm._source = BBB_NON_SSM_WV_WITH_TOKEN; // TODO: Current source should have no impact on what happens in this case

		drm.setSource(BBB_CLEAR);

		expect(updateStateFn).not.toHaveBeenCalled();
		expect(drm._drmState).toEqual(DRMStates.INACTIVE);
	});

	test("State: AWAITING_CONTENT_TOKEN, current source: non-SSM", () => {
		drm._drmState = DRMStates.AWAITING_CONTENT_TOKEN;
		drm._source = BBB_NON_SSM_WV_WITH_TOKEN;

		drm.setSource(BBB_CLEAR);

		expect(clearContentTokenTimerFn).toHaveBeenCalled();
		expect(updateStateFn).toHaveBeenCalledWith(DRMStates.INACTIVE);
		expect(drm._drmState).toEqual(DRMStates.INACTIVE);
	});

	test("State: AWAITING_CONTENT_TOKEN, current source: SSM", () => {
		drm._drmState = DRMStates.AWAITING_CONTENT_TOKEN;
		drm._source = ELE_DREAM_SSM_WV_NO_TOKEN;

		drm.setSource(BBB_CLEAR);

		expect(clearContentTokenTimerFn).not.toHaveBeenCalled();
		expect(updateStateFn).toHaveBeenCalledWith(DRMStates.INACTIVE);
		expect(drm._drmState).toEqual(DRMStates.INACTIVE);
	});

	test("State: AWAITING_SESSION_TOKEN", () => {
		drm._drmState = DRMStates.AWAITING_SESSION_TOKEN;
		drm._source = SINTEL_SSM_WV_WITH_TOKEN;

		drm.setSource(BBB_CLEAR);

		expect(clearContentTokenTimerFn).not.toHaveBeenCalled();
		expect(updateStateFn).not.toHaveBeenCalled();
		expect(drm._drmState).toEqual(DRMStates.AWAITING_SESSION_TOKEN);
	});

	test("State: LICENSE_REQUESTED", () => {
		drm._drmState = DRMStates.LICENSE_REQUESTED;
		drm._source = SINTEL_SSM_WV_WITH_TOKEN;
		drm._licenseXHR = new XMLHttpRequest();
		let abortLicenseXHR = jest.spyOn(drm._licenseXHR, "abort");

		drm.setSource(BBB_CLEAR);

		expect(abortLicenseXHR).toHaveBeenCalled();
		expect(updateStateFn).toHaveBeenCalledWith(DRMStates.INACTIVE);
		expect(drm._drmState).toEqual(DRMStates.INACTIVE);
	});

	test("State: ACTIVE", () => {
		drm._drmState = DRMStates.ACTIVE;
		drm._source = SINTEL_SSM_WV_WITH_TOKEN;

		drm.setSource(BBB_CLEAR);

		expect(clearContentTokenTimerFn).not.toHaveBeenCalled(); //TODO: Needed? No harm if left
		expect(updateStateFn).toHaveBeenCalledWith(DRMStates.INACTIVE);
		expect(drm._drmState).toEqual(DRMStates.INACTIVE);
	});

	test("State: RENEWAL_REQUESTED", () => {
		drm._drmState = DRMStates.RENEWAL_REQUESTED;
		drm._source = SINTEL_SSM_WV_WITH_TOKEN;
		drm._licenseXHR = new XMLHttpRequest(); //TODO: Swap for a mock implementation
		let abortLicenseXHR = jest.spyOn(drm._licenseXHR, "abort");

		drm.setSource(BBB_CLEAR);

		expect(abortLicenseXHR).toHaveBeenCalledTimes(1);
		expect(clearContentTokenTimerFn).not.toHaveBeenCalled(); //TODO: Needed? No harm if left
		expect(updateStateFn).toHaveBeenCalledWith(DRMStates.INACTIVE);
		expect(drm._drmState).toEqual(DRMStates.INACTIVE);
	});

	test("State: ERROR", () => {
		drm._drmState = DRMStates.ERROR;
		drm._source = SINTEL_SSM_WV_WITH_TOKEN;

		drm.setSource(BBB_CLEAR);

		expect(clearContentTokenTimerFn).not.toHaveBeenCalled(); //TODO: Needed? No harm if left
		expect(updateStateFn).toHaveBeenCalledWith(DRMStates.INACTIVE);
		expect(drm._drmState).toEqual(DRMStates.INACTIVE);
	});
});

describe("New non-SSM, encrypted source, with content token", () => {
	test("State: INACTIVE", () => {
		drm._drmState = DRMStates.INACTIVE;
		drm._source = SINTEL_NON_SSM_WV_WITH_TOKEN; // Current source should have no impact on what happens in this case

		drm.setSource(BBB_NON_SSM_WV_WITH_TOKEN);

		expect(updateStateFn).not.toHaveBeenCalled();
		expect(drm._drmState).toEqual(DRMStates.INACTIVE);
	});

	test("State: AWAITING_CONTENT_TOKEN, current source: non-SSM, no content token", () => {
		drm._drmState = DRMStates.AWAITING_CONTENT_TOKEN;
		drm._source = BBB_NON_SSM_WV_NO_TOKEN;

		drm.setSource(SINTEL_NON_SSM_WV_WITH_TOKEN);

		expect(clearContentTokenTimerFn).toHaveBeenCalledTimes(1);
		expect(updateStateFn).toHaveBeenCalledWith(DRMStates.INACTIVE);
		expect(drm._drmState).toEqual(DRMStates.INACTIVE);
	});

	test("State: AWAITING_CONTENT_TOKEN, current source: SSM, no content token", () => {
		drm._drmState = DRMStates.AWAITING_CONTENT_TOKEN;
		drm._source = ELE_DREAM_SSM_WV_NO_TOKEN;

		drm.setSource(BBB_NON_SSM_WV_WITH_TOKEN);

		expect(clearContentTokenTimerFn).not.toHaveBeenCalled();
		expect(updateStateFn).toHaveBeenCalledWith(DRMStates.INACTIVE);
		expect(drm._drmState).toEqual(DRMStates.INACTIVE);
	});

	test("State: AWAITING_SESSION_TOKEN", () => {
		drm._drmState = DRMStates.AWAITING_SESSION_TOKEN;
		drm._source = ELE_DREAM_SSM_WV_NO_TOKEN;

		drm.setSource(BBB_NON_SSM_WV_WITH_TOKEN);

		expect(updateStateFn).not.toHaveBeenCalled();
		expect(drm._drmState).toEqual(DRMStates.AWAITING_SESSION_TOKEN);
	});

	test("State: LICENSE_REQUESTED", () => {
		drm._drmState = DRMStates.LICENSE_REQUESTED;
		drm._source = SINTEL_NON_SSM_WV_WITH_TOKEN;
		drm._licenseXHR = new XMLHttpRequest(); //TODO: Swap for a mock implementation
		let abortLicenseXHR = jest.spyOn(drm._licenseXHR, "abort");

		drm.setSource(BBB_NON_SSM_WV_WITH_TOKEN);

		expect(abortLicenseXHR).toHaveBeenCalledTimes(1);
		expect(updateStateFn).toHaveBeenCalledWith(DRMStates.INACTIVE);
		expect(drm._drmState).toEqual(DRMStates.INACTIVE);
	});

	test("State: ACTIVE", () => {
		drm._drmState = DRMStates.ACTIVE;
		drm._source = SINTEL_NON_SSM_WV_WITH_TOKEN;

		drm.setSource(BBB_NON_SSM_WV_WITH_TOKEN);

		expect(updateStateFn).toHaveBeenCalledWith(DRMStates.INACTIVE);
		expect(drm._drmState).toEqual(DRMStates.INACTIVE);
	});

	test("State: RENEWAL_REQUESTED", () => {
		drm._drmState = DRMStates.RENEWAL_REQUESTED;
		drm._source = SINTEL_NON_SSM_WV_WITH_TOKEN;
		drm._licenseXHR = new XMLHttpRequest(); //TODO: Swap for a mock implementation
		let abortLicenseXHR = jest.spyOn(drm._licenseXHR, "abort");

		drm.setSource(BBB_NON_SSM_WV_WITH_TOKEN);

		expect(abortLicenseXHR).toHaveBeenCalledTimes(1);
		expect(updateStateFn).toHaveBeenCalledWith(DRMStates.INACTIVE);
		expect(drm._drmState).toEqual(DRMStates.INACTIVE);
	});

	test("State: ERROR", () => {
		drm._drmState = DRMStates.ERROR;
		drm._source = ELE_DREAM_SSM_WV_NO_TOKEN;

		drm.setSource(BBB_NON_SSM_WV_WITH_TOKEN);

		expect(updateStateFn).toHaveBeenCalledWith(DRMStates.INACTIVE);
		expect(drm._drmState).toEqual(DRMStates.INACTIVE);
	});
});

describe("New encrypted, non-SSM source, no content token", () => {
	test("State: INACTIVE", () => {
		drm._drmState = DRMStates.INACTIVE;
		drm._source = null; // Current source should have no impact on what happens in this case
		let initialTimerId = drm._contentTokenReFetchTimerID;

		drm.setSource(BBB_NON_SSM_WV_NO_TOKEN);

		expect(startContentTokenWaitTimerFn).toHaveBeenCalledTimes(1);
		expect(drm._contentTokenReFetchTimerID).not.toEqual(initialTimerId);
		// State update
		expect(updateStateFn).toHaveBeenCalledWith(
			DRMStates.AWAITING_CONTENT_TOKEN
		);
		expect(drm._drmState).toEqual(DRMStates.AWAITING_CONTENT_TOKEN);
	});

	test("State: AWAITING_CONTENT_TOKEN, current source: non-SSM, no content token", () => {
		drm._drmState = DRMStates.AWAITING_CONTENT_TOKEN;
		drm._source = SINTEL_NON_SSM_WV_NO_TOKEN;
		let initialTimerId = drm._contentTokenReFetchTimerID;

		drm.setSource(BBB_NON_SSM_WV_NO_TOKEN);

		// Timer cleared
		expect(clearContentTokenTimerFn).toHaveBeenCalledTimes(1);

		expect(startContentTokenWaitTimerFn).toHaveBeenCalledTimes(1);
		expect(drm._contentTokenReFetchTimerID).not.toEqual(initialTimerId); // null or undefined
		// State update
		expect(updateStateFn).toHaveBeenCalledWith(
			DRMStates.AWAITING_CONTENT_TOKEN
		);
		expect(drm._drmState).toEqual(DRMStates.AWAITING_CONTENT_TOKEN);
	});

	test("State: AWAITING_CONTENT_TOKEN, current source: SSM, no content token", () => {
		drm._drmState = DRMStates.AWAITING_CONTENT_TOKEN;
		drm._source = ELE_DREAM_SSM_WV_NO_TOKEN;
		let initialTimerId = drm._contentTokenReFetchTimerID; //TODO: Is this fragile?

		drm.setSource(BBB_NON_SSM_WV_NO_TOKEN);

		// Timer should not be running, so shouldn't be cleared either
		expect(clearContentTokenTimerFn).not.toHaveBeenCalled();

		expect(startContentTokenWaitTimerFn).toHaveBeenCalledTimes(1);
		expect(drm._contentTokenReFetchTimerID).not.toEqual(initialTimerId);
		// State update
		expect(updateStateFn).toHaveBeenCalledWith(
			DRMStates.AWAITING_CONTENT_TOKEN
		);
		expect(drm._drmState).toEqual(DRMStates.AWAITING_CONTENT_TOKEN);
	});

	test("State: AWAITING_SESSION_TOKEN", () => {
		//TODO: Check if this case really should do nothing
		drm._drmState = DRMStates.AWAITING_SESSION_TOKEN;
		drm._source = ELE_DREAM_SSM_WV_NO_TOKEN;

		drm.setSource(BBB_NON_SSM_WV_NO_TOKEN);

		// State update
		expect(updateStateFn).not.toHaveBeenCalled();
		expect(drm._drmState).toEqual(DRMStates.AWAITING_SESSION_TOKEN);
	});

	test("State: LICENSE_REQUESTED", () => {
		drm._drmState = DRMStates.LICENSE_REQUESTED;
		drm._source = SINTEL_NON_SSM_WV_WITH_TOKEN;
		drm._licenseXHR = new XMLHttpRequest(); //TODO: Swap for a mock implementation
		let abortLicenseXHR = jest.spyOn(drm._licenseXHR, "abort");
		let initialTimerId = drm._contentTokenReFetchTimerID;

		drm.setSource(BBB_NON_SSM_WV_NO_TOKEN);

		expect(abortLicenseXHR).toHaveBeenCalledTimes(1);

		expect(startContentTokenWaitTimerFn).toHaveBeenCalledTimes(1);
		expect(drm._contentTokenReFetchTimerID).not.toEqual(initialTimerId);
		// State update
		expect(updateStateFn).toHaveBeenCalledWith(
			DRMStates.AWAITING_CONTENT_TOKEN
		);
		expect(drm._drmState).toEqual(DRMStates.AWAITING_CONTENT_TOKEN);
	});

	test("State: ACTIVE", () => {
		drm._drmState = DRMStates.ACTIVE;
		drm._source = SINTEL_NON_SSM_WV_WITH_TOKEN;
		let initialTimerId = drm._contentTokenReFetchTimerID;

		drm.setSource(BBB_NON_SSM_WV_NO_TOKEN);

		expect(startContentTokenWaitTimerFn).toHaveBeenCalledTimes(1);
		expect(drm._contentTokenReFetchTimerID).not.toEqual(initialTimerId);
		// State update
		expect(updateStateFn).toHaveBeenCalledWith(
			DRMStates.AWAITING_CONTENT_TOKEN
		);
		expect(drm._drmState).toEqual(DRMStates.AWAITING_CONTENT_TOKEN);
	});

	test("State: RENEWAL_REQUESTED", () => {
		drm._drmState = DRMStates.RENEWAL_REQUESTED;
		drm._source = SINTEL_NON_SSM_WV_WITH_TOKEN;
		drm._licenseXHR = new XMLHttpRequest(); //TODO: Swap for a mock implementation
		let abortLicenseXHR = jest.spyOn(drm._licenseXHR, "abort");
		let initialTimerId = drm._contentTokenReFetchTimerID; //TODO: Is this fragile?

		drm.setSource(BBB_NON_SSM_WV_NO_TOKEN);

		expect(abortLicenseXHR).toHaveBeenCalledTimes(1);
		// Don't start a new timer until licenseRetriever() called
		expect(startContentTokenWaitTimerFn).toHaveBeenCalledTimes(1);
		expect(drm._contentTokenReFetchTimerID).not.toEqual(initialTimerId);
		// State update
		expect(updateStateFn).toHaveBeenCalledWith(
			DRMStates.AWAITING_CONTENT_TOKEN
		);
		expect(drm._drmState).toEqual(DRMStates.AWAITING_CONTENT_TOKEN);
	});

	test("State: ERROR", () => {
		drm._drmState = DRMStates.ERROR;
		drm._source = ELE_DREAM_SSM_WV_NO_TOKEN;
		let initialTimerId = drm._contentTokenReFetchTimerID; //TODO: Is this fragile?

		drm.setSource(BBB_NON_SSM_WV_NO_TOKEN);

		// Don't start a new timer until licenseRetriever() called
		expect(startContentTokenWaitTimerFn).toHaveBeenCalledTimes(1);
		expect(drm._contentTokenReFetchTimerID).not.toEqual(initialTimerId);
		// State update
		expect(updateStateFn).toHaveBeenCalledWith(
			DRMStates.AWAITING_CONTENT_TOKEN
		);
		expect(drm._drmState).toEqual(DRMStates.AWAITING_CONTENT_TOKEN);
	});
});

describe("New SSM source with a content token", () => {
	test("State: INACTIVE", () => {
		drm._drmState = DRMStates.INACTIVE;
		drm._source = null; // Current source should have no impact on what happens in this case

		drm.setSource(SINTEL_SSM_WV_WITH_TOKEN);

		expect(updateStateFn).toHaveBeenCalledWith(
			DRMStates.AWAITING_SESSION_TOKEN
		);
		expect(drm._drmState).toEqual(DRMStates.AWAITING_SESSION_TOKEN);
	});

	test("State: AWAITING_CONTENT_TOKEN, current source: non-SSM, no content token", () => {
		drm._drmState = DRMStates.AWAITING_CONTENT_TOKEN;
		drm._source = SINTEL_NON_SSM_WV_NO_TOKEN;
		drm._contentTokenReFetchTimerID = 1; //Set it so we can confirm it's cleared

		drm.setSource(SINTEL_SSM_WV_WITH_TOKEN);

		expect(clearContentTokenTimerFn).toHaveBeenCalledTimes(1);
		expect(drm._contentTokenReFetchTimerID).toBeFalsy();
		expect(updateStateFn).toHaveBeenCalledWith(
			DRMStates.AWAITING_SESSION_TOKEN
		);
		expect(drm._drmState).toEqual(DRMStates.AWAITING_SESSION_TOKEN);
	});

	test("State: AWAITING_CONTENT_TOKEN, current source: SSM, no content token", () => {
		drm._drmState = DRMStates.AWAITING_CONTENT_TOKEN;
		drm._source = ELE_DREAM_SSM_WV_NO_TOKEN;
		drm._contentTokenReFetchTimerID = 1; //Set it so we can confirm it's not cleared

		drm.setSource(SINTEL_SSM_WV_WITH_TOKEN);

		expect(clearContentTokenTimerFn).not.toHaveBeenCalled();
		expect(drm._contentTokenReFetchTimerID).toEqual(1);
		expect(updateStateFn).toHaveBeenCalledWith(
			DRMStates.AWAITING_SESSION_TOKEN
		);
		expect(drm._drmState).toEqual(DRMStates.AWAITING_SESSION_TOKEN);
	});

	test("State: AWAITING_SESSION_TOKEN", () => {
		drm._drmState = DRMStates.AWAITING_SESSION_TOKEN;
		drm._source = BBB_SSM_WV_WITH_TOKEN;

		drm.setSource(SINTEL_SSM_WV_WITH_TOKEN);

		expect(updateStateFn).not.toHaveBeenCalled();
		expect(drm._drmState).toEqual(DRMStates.AWAITING_SESSION_TOKEN);
	});

	test("State: LICENSE_REQUESTED", () => {
		drm._drmState = DRMStates.LICENSE_REQUESTED;
		drm._source = BBB_NON_SSM_WV_WITH_TOKEN;
		drm._licenseXHR = new XMLHttpRequest(); //TODO: Swap for a mock implementation
		let abortLicenseXHR = jest.spyOn(drm._licenseXHR, "abort");

		drm.setSource(SINTEL_SSM_WV_WITH_TOKEN);

		expect(abortLicenseXHR).toHaveBeenCalledTimes(1);
		expect(updateStateFn).toHaveBeenCalledWith(
			DRMStates.AWAITING_SESSION_TOKEN
		);
		expect(drm._drmState).toEqual(DRMStates.AWAITING_SESSION_TOKEN);
	});

	test("State: ACTIVE", () => {
		drm._drmState = DRMStates.ACTIVE;
		drm._source = BBB_NON_SSM_WV_WITH_TOKEN;

		drm.setSource(SINTEL_SSM_WV_WITH_TOKEN);

		expect(updateStateFn).toHaveBeenCalledWith(
			DRMStates.AWAITING_SESSION_TOKEN
		);
		expect(drm._drmState).toEqual(DRMStates.AWAITING_SESSION_TOKEN);
	});

	test("State: RENEWAL_REQUESTED", () => {
		drm._drmState = DRMStates.RENEWAL_REQUESTED;
		drm._source = BBB_NON_SSM_WV_WITH_TOKEN;
		drm._licenseXHR = new XMLHttpRequest(); //TODO: Swap for a mock implementation
		let abortLicenseXHR = jest.spyOn(drm._licenseXHR, "abort");

		drm.setSource(SINTEL_SSM_WV_WITH_TOKEN);

		expect(abortLicenseXHR).toHaveBeenCalledTimes(1);
		expect(updateStateFn).toHaveBeenCalledWith(
			DRMStates.AWAITING_SESSION_TOKEN
		);
		expect(drm._drmState).toEqual(DRMStates.AWAITING_SESSION_TOKEN);
	});

	test("State: ERROR", () => {
		drm._drmState = DRMStates.ERROR;
		drm._source = ELE_DREAM_SSM_WV_NO_TOKEN;

		drm.setSource(SINTEL_SSM_WV_WITH_TOKEN);

		expect(updateStateFn).toHaveBeenCalledWith(
			DRMStates.AWAITING_SESSION_TOKEN
		);
		expect(drm._drmState).toEqual(DRMStates.AWAITING_SESSION_TOKEN);
	});
});

describe("New SSM source, no content token", () => {
	test("State: INACTIVE", () => {
		drm._drmState = DRMStates.INACTIVE;
		drm._source = null; // Current source should have no impact on what happens in this case

		drm.setSource(ELE_DREAM_SSM_WV_NO_TOKEN);

		// Don't start a new timer until licenseRetriever() called
		expect(startContentTokenWaitTimerFn).not.toHaveBeenCalled();
		expect(drm._contentTokenReFetchTimerID).toBeFalsy();
		// State change
		expect(updateStateFn).toHaveBeenCalledWith(
			DRMStates.AWAITING_CONTENT_TOKEN
		);
		expect(drm._drmState).toEqual(DRMStates.AWAITING_CONTENT_TOKEN);
	});

	test("State: AWAITING_CONTENT_TOKEN, current source: non-SSM, no content token", () => {
		drm._drmState = DRMStates.AWAITING_CONTENT_TOKEN;
		drm._source = SINTEL_NON_SSM_WV_NO_TOKEN;

		drm.setSource(ELE_DREAM_SSM_WV_NO_TOKEN);

		expect(clearContentTokenTimerFn).toHaveBeenCalledTimes(1);
		// Don't start a new timer until licenseRetriever() called
		expect(startContentTokenWaitTimerFn).not.toHaveBeenCalled();
		expect(drm._contentTokenReFetchTimerID).toBeFalsy();
		// State change
		expect(updateStateFn).toHaveBeenCalledWith(
			DRMStates.AWAITING_CONTENT_TOKEN
		);
		expect(drm._drmState).toEqual(DRMStates.AWAITING_CONTENT_TOKEN);
	});

	test("State: AWAITING_CONTENT_TOKEN, current source: SSM, no content token", () => {
		drm._drmState = DRMStates.AWAITING_CONTENT_TOKEN;
		drm._source = BBB_SSM_WV_NO_TOKEN;

		drm.setSource(ELE_DREAM_SSM_WV_NO_TOKEN);

		expect(clearContentTokenTimerFn).not.toHaveBeenCalled();
		// Don't start a new timer until licenseRetriever() called
		expect(startContentTokenWaitTimerFn).not.toHaveBeenCalled();
		expect(drm._contentTokenReFetchTimerID).toBeFalsy();
		// State change
		expect(updateStateFn).toHaveBeenCalledWith(
			DRMStates.AWAITING_CONTENT_TOKEN
		);
		expect(drm._drmState).toEqual(DRMStates.AWAITING_CONTENT_TOKEN);
	});

	test("State: AWAITING_SESSION_TOKEN", () => {
		drm._drmState = DRMStates.AWAITING_SESSION_TOKEN;
		drm._source = BBB_SSM_WV_WITH_TOKEN;

		drm.setSource(ELE_DREAM_SSM_WV_NO_TOKEN);

		expect(updateStateFn).not.toHaveBeenCalled();
		expect(drm._drmState).toEqual(DRMStates.AWAITING_SESSION_TOKEN);
	});

	test("State: LICENSE_REQUESTED", () => {
		drm._drmState = DRMStates.LICENSE_REQUESTED;
		drm._source = BBB_NON_SSM_WV_WITH_TOKEN;
		drm._licenseXHR = new XMLHttpRequest(); //TODO: Swap for a mock implementation
		let abortLicenseXHR = jest.spyOn(drm._licenseXHR, "abort");

		drm.setSource(ELE_DREAM_SSM_WV_NO_TOKEN);

		expect(abortLicenseXHR).toHaveBeenCalledTimes(1);
		// Don't start a new timer until licenseRetriever() called
		expect(startContentTokenWaitTimerFn).not.toHaveBeenCalled();
		expect(drm._contentTokenReFetchTimerID).toBeFalsy();
		// State change
		expect(updateStateFn).toHaveBeenCalledWith(
			DRMStates.AWAITING_CONTENT_TOKEN
		);
		expect(drm._drmState).toEqual(DRMStates.AWAITING_CONTENT_TOKEN);
	});

	test("State: ACTIVE", () => {
		drm._drmState = DRMStates.ACTIVE;
		drm._source = BBB_NON_SSM_WV_WITH_TOKEN;

		drm.setSource(ELE_DREAM_SSM_WV_NO_TOKEN);

		// Don't start a new timer until licenseRetriever() called
		expect(startContentTokenWaitTimerFn).not.toHaveBeenCalled();
		expect(drm._contentTokenReFetchTimerID).toBeFalsy();
		// State change
		expect(updateStateFn).toHaveBeenCalledWith(
			DRMStates.AWAITING_CONTENT_TOKEN
		);
		expect(drm._drmState).toEqual(DRMStates.AWAITING_CONTENT_TOKEN);
	});

	test("State: RENEWAL_REQUESTED", () => {
		drm._drmState = DRMStates.RENEWAL_REQUESTED;
		drm._source = BBB_NON_SSM_WV_WITH_TOKEN;
		drm._licenseXHR = new XMLHttpRequest(); //TODO: Swap for a mock implementation
		let abortLicenseXHR = jest.spyOn(drm._licenseXHR, "abort");

		drm.setSource(ELE_DREAM_SSM_WV_NO_TOKEN);

		expect(abortLicenseXHR).toHaveBeenCalledTimes(1);
		// Don't start a new timer until licenseRetriever() called
		expect(startContentTokenWaitTimerFn).not.toHaveBeenCalled();
		expect(drm._contentTokenReFetchTimerID).toBeFalsy();
		// State change
		expect(updateStateFn).toHaveBeenCalledWith(
			DRMStates.AWAITING_CONTENT_TOKEN
		);
		expect(drm._drmState).toEqual(DRMStates.AWAITING_CONTENT_TOKEN);
	});

	test("State: ERROR", () => {
		drm._drmState = DRMStates.ERROR;
		drm._source = SINTEL_NON_SSM_WV_NO_TOKEN;

		drm.setSource(ELE_DREAM_SSM_WV_NO_TOKEN);

		// Don't start a new timer until licenseRetriever() called
		expect(startContentTokenWaitTimerFn).not.toHaveBeenCalled();
		expect(drm._contentTokenReFetchTimerID).toBeFalsy();
		// State change
		expect(updateStateFn).toHaveBeenCalledWith(
			DRMStates.AWAITING_CONTENT_TOKEN
		);
		expect(drm._drmState).toEqual(DRMStates.AWAITING_CONTENT_TOKEN);
	});
});

describe("Same source, but token added (was previously null)", () => {
	test("State: INACTIVE", () => {
		drm._drmState = DRMStates.INACTIVE;
		drm._source = BBB_NON_SSM_WV_NO_TOKEN;

		drm.setSource(BBB_NON_SSM_WV_WITH_TOKEN);

		expect(updateStateFn).not.toHaveBeenCalled();
		expect(drm._drmState).toEqual(DRMStates.INACTIVE);
	});

	test("State: AWAITING_CONTENT_TOKEN, current source: non-SSM, no content token", () => {
		drm._drmState = DRMStates.AWAITING_CONTENT_TOKEN;
		drm._source = BBB_NON_SSM_WV_NO_TOKEN;
		drm._licenseXHR = null;

		drm.setSource(BBB_NON_SSM_WV_WITH_TOKEN);

		// Don't start a new timer until licenseRetriever() called
		expect(startContentTokenWaitTimerFn).not.toHaveBeenCalled();
		expect(drm._contentTokenReFetchTimerID).toBeFalsy();
		// Don't change state until licenseRetriever() called
		expect(updateStateFn).not.toHaveBeenCalledWith();
		expect(drm._drmState).toEqual(DRMStates.AWAITING_CONTENT_TOKEN);
	});

	test("State: AWAITING_CONTENT_TOKEN, current source: SSM, no content token", () => {
		drm._drmState = DRMStates.AWAITING_CONTENT_TOKEN;
		drm._source = SINTEL_SSM_WV_NO_TOKEN;

		drm.setSource(SINTEL_SSM_WV_WITH_TOKEN);

		// Don't start a new timer until licenseRetriever() called
		expect(startContentTokenWaitTimerFn).not.toHaveBeenCalled();
		expect(drm._contentTokenReFetchTimerID).toBeFalsy();
		// Don't change state until licenseRetriever() called
		expect(updateStateFn).not.toHaveBeenCalled();
		expect(drm._drmState).toEqual(DRMStates.AWAITING_CONTENT_TOKEN);
	});

	test("State: AWAITING_SESSION_TOKEN", () => {
		drm._drmState = DRMStates.AWAITING_SESSION_TOKEN;
		drm._source = SINTEL_SSM_WV_NO_TOKEN;

		drm.setSource(SINTEL_SSM_WV_WITH_TOKEN);

		expect(updateStateFn).not.toHaveBeenCalled();
		expect(drm._drmState).toEqual(DRMStates.AWAITING_SESSION_TOKEN);
	});

	test("State: LICENSE_REQUESTED", () => {
		drm._drmState = DRMStates.LICENSE_REQUESTED;
		drm._source = BBB_NON_SSM_WV_NO_TOKEN;
		drm._licenseXHR = new XMLHttpRequest(); //TODO: Swap for a mock implementation
		let abortLicenseXHR = jest.spyOn(drm._licenseXHR, "abort");

		drm.setSource(BBB_NON_SSM_WV_WITH_TOKEN);

		expect(abortLicenseXHR).not.toHaveBeenCalled();
		expect(updateStateFn).not.toHaveBeenCalled();
		expect(drm._drmState).toEqual(DRMStates.LICENSE_REQUESTED);
	});

	test("State: ACTIVE", () => {
		drm._drmState = DRMStates.ACTIVE;
		drm._source = BBB_NON_SSM_WV_NO_TOKEN;

		drm.setSource(BBB_NON_SSM_WV_WITH_TOKEN);

		expect(updateStateFn).not.toHaveBeenCalled();
		expect(drm._drmState).toEqual(DRMStates.ACTIVE);
	});

	test("State: RENEWAL_REQUESTED", () => {
		drm._drmState = DRMStates.RENEWAL_REQUESTED;
		drm._source = BBB_NON_SSM_WV_NO_TOKEN;
		drm._licenseXHR = new XMLHttpRequest(); //TODO: Swap for a mock implementation
		let abortLicenseXHR = jest.spyOn(drm._licenseXHR, "abort"); //TODO: Necessary?

		drm.setSource(BBB_NON_SSM_WV_WITH_TOKEN);

		expect(abortLicenseXHR).not.toHaveBeenCalled(); //TODO: Necessary?
		expect(updateStateFn).not.toHaveBeenCalled();
		expect(drm._drmState).toEqual(DRMStates.RENEWAL_REQUESTED);
	});

	test("State: ERROR", () => {
		drm._drmState = DRMStates.ERROR;
		drm._source = BBB_NON_SSM_WV_NO_TOKEN;

		drm.setSource(BBB_NON_SSM_WV_WITH_TOKEN);

		expect(updateStateFn).not.toHaveBeenCalled();
		expect(drm._drmState).toEqual(DRMStates.ERROR);
	});
});

// TODO: licenseRequest test calls
// drm.licenseRetriever(EncryptionTypes.WIDEVINE, null, null, LicenseMsgTypes.LICENSE_REQUEST);
// drm.licenseRetriever(EncryptionTypes.WIDEVINE, BBB_NON_SSM_WV_WITH_TOKEN, null, LicenseMsgTypes.LICENSE_REQUEST);
// drm.licenseRetriever(EncryptionTypes.WIDEVINE, BBB_NON_SSM_WV_NO_TOKEN, "request.payload", LicenseMsgTypes.LICENSE_REQUEST);
//     e.g.
// expect(drm._licenseXHR).toBeNull();

//         drm.setSource(BBB_NON_SSM_WV_NO_TOKEN);

describe("Request license", () => {
	test("Non-SSM Widevine source with token", () => {
		let server = sinon.fakeServer.create();
		server.configure({ respondImmediately: true });
		server.respondWith("POST", "*", [
			200,
			{ "Content-Type": "application/json" },
			'{"status": "OK", "errorCode": 0, "license": ["MTIzNDU="]}',
		]);
		let widevineLicenceReq = jest.spyOn(drm, "_getWidevineLicense");
		let requestLicenseFunc = jest.spyOn(drm, "_requestLicense");

		drm._drmState = DRMStates.INACTIVE;
		drm._source = null;

		drm.setSource(BBB_NON_SSM_WV_WITH_TOKEN);

		return drm
			.licenseRetriever(
				EncryptionTypes.WIDEVINE,
				BBB_NON_SSM_WV_WITH_TOKEN,
				"request.payload",
				LicenseMsgTypes.LICENSE_REQUEST
			)
			.then(() => {
				expect(startContentTokenWaitTimerFn).not.toHaveBeenCalled();
				expect(widevineLicenceReq).toHaveBeenCalledTimes(1);
				expect(requestLicenseFunc).toHaveBeenCalledTimes(1);

				expect(updateStateFn.mock.calls[0][0]).toEqual(
					DRMStates.LICENSE_REQUESTED
				);
				expect(updateStateFn.mock.calls[1][0]).toEqual(
					DRMStates.ACTIVE
				);

				expect(drm._drmState).toEqual(DRMStates.ACTIVE);
			});
	});

	test("Non-SSM TVKey source with token", () => {
		let server = sinon.fakeServer.create();
		server.configure({ respondImmediately: true });
		server.respondWith("POST", "*", [
			200,
			{ "Content-Type": "application/json" },
			'[{ "id": 12, "comment": "Hey there" }]',
		]);
		let tvKeyLicenceReq = jest.spyOn(drm, "_getTVKeyLicense");
		let requestLicenseFunc = jest.spyOn(drm, "_requestLicense");

		drm._drmState = DRMStates.INACTIVE;
		drm._source = null;

		drm.setSource(NON_SSM_TVKEY_BBB_WITH_TOKEN);

		return drm
			.licenseRetriever(
				EncryptionTypes.TVKEY,
				NON_SSM_TVKEY_BBB_WITH_TOKEN,
				"request.payload",
				LicenseMsgTypes.LICENSE_REQUEST
			)
			.then(() => {
				expect(startContentTokenWaitTimerFn).not.toHaveBeenCalled();
				expect(tvKeyLicenceReq).toHaveBeenCalledTimes(1);
				expect(requestLicenseFunc).toHaveBeenCalledTimes(1);

				expect(updateStateFn.mock.calls[0][0]).toEqual(
					DRMStates.LICENSE_REQUESTED
				);
				expect(updateStateFn.mock.calls[1][0]).toEqual(
					DRMStates.ACTIVE
				);

				expect(drm._drmState).toEqual(DRMStates.ACTIVE);
			});
	});

	test("Non-SSM PlayReady source with token", () => {
		let server = sinon.fakeServer.create();
		server.configure({ respondImmediately: true });
		server.respondWith("POST", "*", [
			200,
			{ "Content-Type": "application/json" },
			'[{ "id": 12, "comment": "Hey there" }]',
		]);

		let playreadyLicenceReq = jest.spyOn(drm, "_getPlayreadyLicense");

		drm._drmState = DRMStates.INACTIVE;
		drm._source = null;

		drm.setSource(ALIENS_NON_SSM_PLAYREADY_WITH_TOKEN);

		return drm
			.licenseRetriever(
				EncryptionTypes.PLAYREADY,
				ALIENS_NON_SSM_PLAYREADY_WITH_TOKEN,
				"request.payload",
				LicenseMsgTypes.LICENSE_REQUEST
			)
			.then(() => {
				expect(startContentTokenWaitTimerFn).not.toHaveBeenCalled();
				expect(playreadyLicenceReq).toHaveBeenCalledTimes(1);

				expect(updateStateFn.mock.calls[0][0]).toEqual(
					DRMStates.LICENSE_REQUESTED
				);
				expect(updateStateFn.mock.calls[1][0]).toEqual(
					DRMStates.ACTIVE
				);

				expect(drm._drmState).toEqual(DRMStates.ACTIVE);
			});
	});

	test("Non-SSM FairPlay source with token", () => {
		let server = sinon.fakeServer.create();
		server.configure({ respondImmediately: true });
		server.respondWith("POST", "*", [
			200,
			{ "Content-Type": "application/json" },
			'{ "CkcMessage" : "Nonsense Data" }',
		]);
		let fairplayLicenceReq = jest.spyOn(drm, "_getFairplayLicense");

		drm._drmState = DRMStates.INACTIVE;
		drm._source = null;

		drm.setSource(NON_SSM_FAIRPLAY_TEARS_OF_STEEL_WITH_TOKEN);

		return drm
			.licenseRetriever(
				EncryptionTypes.FAIRPLAY,
				NON_SSM_FAIRPLAY_TEARS_OF_STEEL_WITH_TOKEN,
				"request.payload",
				LicenseMsgTypes.LICENSE_REQUEST
			)
			.then(() => {
				expect(startContentTokenWaitTimerFn).not.toHaveBeenCalled();
				expect(fairplayLicenceReq).toHaveBeenCalledTimes(1);

				expect(updateStateFn.mock.calls[0][0]).toEqual(
					DRMStates.LICENSE_REQUESTED
				);
				expect(updateStateFn.mock.calls[1][0]).toEqual(
					DRMStates.ACTIVE
				);

				expect(drm._drmState).toEqual(DRMStates.ACTIVE);
			});
	});

	test("Non-SSM Widevine source without token; time limit expires for receiving a token", async () => {
		let widevineLicenceReq = jest.spyOn(drm, "_getWidevineLicense");

		drm._drmState = DRMStates.INACTIVE;
		drm._source = null;

		drm.setSource(BBB_NON_SSM_WV_NO_TOKEN);
		const wvLicenseMethod = drm.licenseRetriever(
			EncryptionTypes.WIDEVINE,
			BBB_NON_SSM_WV_NO_TOKEN,
			"request.payload",
			LicenseMsgTypes.LICENSE_REQUEST
		);

		// Run beyond the time limit for a token to be set
		jest.advanceTimersByTime(
			(DRM.CONTENT_TOKEN_REFETCH_MAX_LIMIT + 3) *
				DRM.CONTENT_TOKEN_FETCH_INTERVAL
		);

		// Assertions
		await expect(wvLicenseMethod).rejects.toMatch(
			"Token was not available"
		);

		expect(startContentTokenWaitTimerFn).toHaveBeenCalledTimes(1);
		expect(widevineLicenceReq).not.toHaveBeenCalled();

		expect(updateStateFn).toHaveBeenCalledTimes(2);
		expect(updateStateFn.mock.calls[0][0]).toEqual(
			DRMStates.AWAITING_CONTENT_TOKEN
		);
		expect(updateStateFn.mock.calls[1][0]).toEqual(DRMStates.ERROR);

		expect(drm._drmState).toEqual(DRMStates.ERROR);
	});

	test("Non-SSM Widevine source without token; token updated before the timer expires", () => {
		let server = sinon.fakeServer.create();
		server.configure({ respondImmediately: true });
		server.respondWith("POST", "*", [
			200,
			{ "Content-Type": "application/json" },
			'{"status": "OK", "errorCode": 0, "license": ["MTIzNDU="]}',
		]);
		let widevineLicenceReq = jest.spyOn(drm, "_getWidevineLicense");
		let requestLicenseFunc = jest.spyOn(drm, "_requestLicense");

		drm._drmState = DRMStates.INACTIVE;
		drm._source = null;

		drm.setSource(BBB_NON_SSM_WV_NO_TOKEN);
		const wvLicenseMethod = drm.licenseRetriever(
			EncryptionTypes.WIDEVINE,
			BBB_NON_SSM_WV_NO_TOKEN,
			"request.payload",
			LicenseMsgTypes.LICENSE_REQUEST
		);

		//Check that a license will be requested if the token is provided before the timer expires
		jest.advanceTimersByTime(DRM.CONTENT_TOKEN_FETCH_INTERVAL);
		drm.setSource(BBB_NON_SSM_WV_WITH_TOKEN);
		jest.advanceTimersByTime(DRM.CONTENT_TOKEN_FETCH_INTERVAL);

		return wvLicenseMethod.then(() => {
			expect(widevineLicenceReq).toHaveBeenCalledTimes(1);
			expect(requestLicenseFunc).toHaveBeenCalledTimes(1);
			expect(updateStateFn).toHaveBeenCalledTimes(3);

			expect(updateStateFn.mock.calls[0][0]).toEqual(
				DRMStates.AWAITING_CONTENT_TOKEN
			);
			expect(updateStateFn.mock.calls[1][0]).toEqual(
				DRMStates.LICENSE_REQUESTED
			);
			expect(updateStateFn.mock.calls[2][0]).toEqual(DRMStates.ACTIVE);

			expect(drm._drmState).toEqual(DRMStates.ACTIVE);
		});
	});

	test("Non-SSM PlayReady source without token; token updated before the timer expires", () => {
		let server = sinon.fakeServer.create();
		server.configure({ respondImmediately: true });
		server.respondWith("POST", "*", [
			200,
			{ "Content-Type": "application/json" },
			'[{ "id": 12, "comment": "Hey there" }]',
		]);
		let playreadyLicenceReq = jest.spyOn(drm, "_getPlayreadyLicense");

		drm._drmState = DRMStates.INACTIVE;
		drm._source = null;

		drm.setSource(ALIENS_NON_SSM_PLAYREADY_NO_TOKEN);
		const prLicenseMethod = drm.licenseRetriever(
			EncryptionTypes.PLAYREADY,
			ALIENS_NON_SSM_PLAYREADY_NO_TOKEN,
			"request.payload",
			LicenseMsgTypes.LICENSE_REQUEST
		);

		//Check that a license will be requested if the token is provided before the timer expires
		jest.advanceTimersByTime(DRM.CONTENT_TOKEN_FETCH_INTERVAL);
		drm.setSource(ALIENS_NON_SSM_PLAYREADY_WITH_TOKEN);
		jest.advanceTimersByTime(DRM.CONTENT_TOKEN_FETCH_INTERVAL);

		return prLicenseMethod.then(() => {
			expect(playreadyLicenceReq).toHaveBeenCalledTimes(1);

			expect(updateStateFn).toHaveBeenCalledTimes(3);
			expect(updateStateFn.mock.calls[0][0]).toEqual(
				DRMStates.AWAITING_CONTENT_TOKEN
			);
			expect(updateStateFn.mock.calls[1][0]).toEqual(
				DRMStates.LICENSE_REQUESTED
			);
			expect(updateStateFn.mock.calls[2][0]).toEqual(DRMStates.ACTIVE);

			expect(drm._drmState).toEqual(DRMStates.ACTIVE);
		});
	});

	test("SSM Widevine source with token", () => {
		let server = sinon.fakeServer.create();
		server.configure({ respondImmediately: true });
		server.respondWith("POST", "*", [
			200,
			{ "Content-Type": "application/json" },
			'{"status": "OK", "errorCode": 0, "license": ["MTIzNDU="]}',
		]);
		let widevineLicenceReq = jest.spyOn(drm, "_getWidevineLicense");
		let requestLicenseFunc = jest.spyOn(drm, "_requestLicense");

		drm._drmState = DRMStates.INACTIVE;
		drm._source = null;

		drm.setSource(BBB_SSM_WV_WITH_TOKEN);

		const wvLicenseRetriever = drm.licenseRetriever(
			EncryptionTypes.WIDEVINE,
			BBB_SSM_WV_WITH_TOKEN,
			"request.payload",
			LicenseMsgTypes.LICENSE_REQUEST
		);

		drm._onSsmStateChanged(SSMStates.SESSION_ON, BBB_SSM_WV_WITH_TOKEN, {
			sessionToken: "session123",
			serverUrl: "https://a.server",
		});

		return wvLicenseRetriever.then(() => {
			expect(startContentTokenWaitTimerFn).not.toHaveBeenCalled();
			expect(widevineLicenceReq).toHaveBeenCalledTimes(1);
			expect(requestLicenseFunc).toHaveBeenCalledTimes(1);

			expect(updateStateFn).toHaveBeenCalledTimes(3);
			expect(updateStateFn.mock.calls[0][0]).toEqual(
				DRMStates.AWAITING_SESSION_TOKEN
			);
			expect(updateStateFn.mock.calls[1][0]).toEqual(
				DRMStates.LICENSE_REQUESTED
			);
			expect(updateStateFn.mock.calls[2][0]).toEqual(DRMStates.ACTIVE);

			expect(drm._drmState).toEqual(DRMStates.ACTIVE);
		});
	});

	test("SSM Widevine source without content token; token updated after license request", () => {
		let server = sinon.fakeServer.create();
		server.configure({ respondImmediately: true });
		server.respondWith("POST", "*", [
			200,
			{ "Content-Type": "application/json" },
			'{"status": "OK", "errorCode": 0, "license": ["MTIzNDU="]}',
		]);
		let widevineLicenceReq = jest.spyOn(drm, "_getWidevineLicense");
		let requestLicenseFunc = jest.spyOn(drm, "_requestLicense");

		drm._drmState = DRMStates.AWAITING_CONTENT_TOKEN;
		drm._source = BBB_SSM_WV_NO_TOKEN;

		const wvLicenseRetriever = drm.licenseRetriever(
			EncryptionTypes.WIDEVINE,
			BBB_SSM_WV_NO_TOKEN,
			"request.payload",
			LicenseMsgTypes.LICENSE_REQUEST
		);

		drm.setSource(BBB_SSM_WV_WITH_TOKEN);

		drm._onSsmStateChanged(SSMStates.SESSION_ON, BBB_SSM_WV_WITH_TOKEN, {
			sessionToken: "session123",
			serverUrl: "https://a.server",
		});

		return wvLicenseRetriever.then(() => {
			expect(startContentTokenWaitTimerFn).not.toHaveBeenCalled();
			expect(widevineLicenceReq).toHaveBeenCalledTimes(1);
			expect(requestLicenseFunc).toHaveBeenCalledTimes(1);

			expect(updateStateFn).toHaveBeenCalledTimes(2);
			expect(updateStateFn.mock.calls[0][0]).toEqual(
				DRMStates.LICENSE_REQUESTED
			);
			expect(updateStateFn.mock.calls[1][0]).toEqual(DRMStates.ACTIVE);

			expect(drm._drmState).toEqual(DRMStates.ACTIVE);
		});
	});

	test("SSM Widevine source without content token; token updated before license request", () => {
		let server = sinon.fakeServer.create();
		server.configure({ respondImmediately: true });
		server.respondWith("POST", "*", [
			200,
			{ "Content-Type": "application/json" },
			'{"status": "OK", "errorCode": 0, "license": ["MTIzNDU="]}',
		]);
		let widevineLicenceReq = jest.spyOn(drm, "_getWidevineLicense");
		let requestLicenseFunc = jest.spyOn(drm, "_requestLicense");

		drm._drmState = DRMStates.AWAITING_CONTENT_TOKEN;
		drm._source = BBB_SSM_WV_NO_TOKEN;

		drm.setSource(BBB_SSM_WV_WITH_TOKEN);

		drm._onSsmStateChanged(
			SSMStates.SETUP_REQUESTED,
			BBB_SSM_WV_WITH_TOKEN,
			{ serverUrl: "https://a.server" }
		);

		drm._onSsmStateChanged(SSMStates.SESSION_ON, BBB_SSM_WV_WITH_TOKEN, {
			sessionToken: "session123",
			serverUrl: "https://a.server",
		});

		const wvLicenseRetriever = drm.licenseRetriever(
			EncryptionTypes.WIDEVINE,
			BBB_SSM_WV_NO_TOKEN,
			"request.payload",
			LicenseMsgTypes.LICENSE_REQUEST
		);

		return wvLicenseRetriever.then(() => {
			expect(startContentTokenWaitTimerFn).not.toHaveBeenCalled();
			expect(widevineLicenceReq).toHaveBeenCalledTimes(1);
			expect(requestLicenseFunc).toHaveBeenCalledTimes(1);

			expect(updateStateFn).toHaveBeenCalledTimes(4);
			expect(updateStateFn.mock.calls[0][0]).toEqual(
				DRMStates.AWAITING_SESSION_TOKEN
			);
			expect(updateStateFn.mock.calls[1][0]).toEqual(DRMStates.INACTIVE);
			expect(updateStateFn.mock.calls[2][0]).toEqual(
				DRMStates.LICENSE_REQUESTED
			);
			expect(updateStateFn.mock.calls[3][0]).toEqual(DRMStates.ACTIVE);

			expect(drm._drmState).toEqual(DRMStates.ACTIVE);
		});
	});

	test("SSM Widevine source without content token; token updated before license request", () => {
		let server = sinon.fakeServer.create();
		server.configure({ respondImmediately: true });
		server.respondWith("POST", "*", [
			200,
			{ "Content-Type": "application/json" },
			'{"status": "OK", "errorCode": 0, "license": ["MTIzNDU="]}',
		]);
		let widevineLicenceReq = jest.spyOn(drm, "_getWidevineLicense");
		let requestLicenseFunc = jest.spyOn(drm, "_requestLicense");

		drm._drmState = DRMStates.AWAITING_CONTENT_TOKEN;
		drm._source = BBB_SSM_WV_NO_TOKEN;

		drm.setSource(BBB_SSM_WV_WITH_TOKEN);

		drm._onSsmStateChanged(
			SSMStates.SETUP_REQUESTED,
			BBB_SSM_WV_WITH_TOKEN,
			{ serverUrl: "https://a.server" }
		);

		drm._onSsmStateChanged(SSMStates.SESSION_ON, BBB_SSM_WV_WITH_TOKEN, {
			sessionToken: "session123",
			serverUrl: "https://a.server",
		});

		const wvLicenseRetriever = drm.licenseRetriever(
			EncryptionTypes.WIDEVINE,
			BBB_SSM_WV_NO_TOKEN,
			"request.payload",
			LicenseMsgTypes.LICENSE_REQUEST
		);

		return wvLicenseRetriever.then(() => {
			expect(startContentTokenWaitTimerFn).not.toHaveBeenCalled();
			expect(widevineLicenceReq).toHaveBeenCalledTimes(1);
			expect(requestLicenseFunc).toHaveBeenCalledTimes(1);

			expect(updateStateFn).toHaveBeenCalledTimes(4);
			expect(updateStateFn.mock.calls[0][0]).toEqual(
				DRMStates.AWAITING_SESSION_TOKEN
			);
			expect(updateStateFn.mock.calls[1][0]).toEqual(DRMStates.INACTIVE);
			expect(updateStateFn.mock.calls[2][0]).toEqual(
				DRMStates.LICENSE_REQUESTED
			);
			expect(updateStateFn.mock.calls[3][0]).toEqual(DRMStates.ACTIVE);

			expect(drm._drmState).toEqual(DRMStates.ACTIVE);
		});
	});

	test("Non-SSM Widevine source with token - request returns error code", () => {
		let server = sinon.fakeServer.create();
		server.configure({ respondImmediately: true });
		server.respondWith("POST", "*", [
			400,
			{ "Content-Type": "application/json" },
			'[{ "comment": "Nope" }]',
		]);
		let widevineLicenceReq = jest.spyOn(drm, "_getWidevineLicense");
		let requestLicenseFunc = jest.spyOn(drm, "_requestLicense");

		drm._drmState = DRMStates.INACTIVE;
		drm._source = null;

		drm.setSource(BBB_NON_SSM_WV_WITH_TOKEN);

		return drm
			.licenseRetriever(
				EncryptionTypes.WIDEVINE,
				BBB_NON_SSM_WV_WITH_TOKEN,
				"request.payload",
				LicenseMsgTypes.LICENSE_REQUEST
			)
			.catch(() => {
				expect(startContentTokenWaitTimerFn).not.toHaveBeenCalled();
				expect(widevineLicenceReq).toHaveBeenCalledTimes(1);
				expect(requestLicenseFunc).toHaveBeenCalledTimes(1);

				expect(updateStateFn).toHaveBeenCalledTimes(2);
				expect(updateStateFn.mock.calls[0][0]).toEqual(
					DRMStates.LICENSE_REQUESTED
				);
				expect(updateStateFn.mock.calls[1][0]).toEqual(DRMStates.ERROR);

				expect(drm._drmState).toEqual(DRMStates.ERROR);
			});
	});

	test("Non-SSM Widevine source with token - request fails", () => {
		let server = sinon.fakeServer.create();

		let widevineLicenceReq = jest.spyOn(drm, "_getWidevineLicense");
		let requestLicenseFunc = jest.spyOn(drm, "_requestLicense");

		drm._drmState = DRMStates.INACTIVE;
		drm._source = null;

		drm.setSource(BBB_NON_SSM_WV_WITH_TOKEN);

		const wvLicenseRetriever = drm.licenseRetriever(
			EncryptionTypes.WIDEVINE,
			BBB_NON_SSM_WV_WITH_TOKEN,
			"request.payload",
			LicenseMsgTypes.LICENSE_REQUEST
		);

		server.requests[0].error();

		return wvLicenseRetriever.catch(() => {
			expect(startContentTokenWaitTimerFn).not.toHaveBeenCalled();
			expect(widevineLicenceReq).toHaveBeenCalledTimes(1);
			expect(requestLicenseFunc).toHaveBeenCalledTimes(1);

			expect(updateStateFn).toHaveBeenCalledTimes(2);
			expect(updateStateFn.mock.calls[0][0]).toEqual(
				DRMStates.LICENSE_REQUESTED
			);
			expect(updateStateFn.mock.calls[1][0]).toEqual(DRMStates.ERROR);
			expect(updateStateFn.mock.calls[1][1].errorCode).toEqual(
				PluginErrorCode.DRM_LICENSE_REQUEST_FAILURE
			);
			expect(drm._drmState).toEqual(DRMStates.ERROR);
		});
	});

	test("Non-SSM Widevine - request for different source", () => {
		let widevineLicenceReq = jest.spyOn(drm, "_getWidevineLicense");
		let requestLicenseFunc = jest.spyOn(drm, "_requestLicense");

		drm._drmState = DRMStates.INACTIVE;
		drm._source = BBB_NON_SSM_WV_WITH_TOKEN;

		const wvLicenseRetriever = drm.licenseRetriever(
			EncryptionTypes.WIDEVINE,
			SINTEL_NON_SSM_WV_WITH_TOKEN,
			"request.payload",
			LicenseMsgTypes.LICENSE_REQUEST
		);

		return wvLicenseRetriever.catch(() => {
			expect(startContentTokenWaitTimerFn).not.toHaveBeenCalled();
			expect(widevineLicenceReq).not.toHaveBeenCalled();
			expect(requestLicenseFunc).not.toHaveBeenCalled();

			expect(updateStateFn).toHaveBeenCalledTimes(1);
			expect(updateStateFn.mock.calls[0][0]).toEqual(DRMStates.ERROR);

			expect(drm._drmState).toEqual(DRMStates.ERROR);
		});
	});

	test("Non-SSM Widevine - source is changed when license returns", () => {
		let server = sinon.fakeServer.create();
		server.configure({ respondImmediately: true });
		server.respondWith("POST", "*", [
			200,
			{ "Content-Type": "application/json" },
			'[{ "id": 12, "comment": "Hey there" }]',
		]);
		let widevineLicenceReq = jest.spyOn(drm, "_getWidevineLicense");
		let requestLicenseFunc = jest.spyOn(drm, "_requestLicense");
		jest.spyOn(drm, "_isOngoingContent").mockImplementation(() => false);

		drm._drmState = DRMStates.INACTIVE;
		drm._source = BBB_NON_SSM_WV_WITH_TOKEN;

		const wvLicenseRetriever = drm.licenseRetriever(
			EncryptionTypes.WIDEVINE,
			BBB_NON_SSM_WV_WITH_TOKEN,
			"request.payload",
			LicenseMsgTypes.LICENSE_REQUEST
		);

		return wvLicenseRetriever.catch(() => {
			expect(startContentTokenWaitTimerFn).not.toHaveBeenCalled();
			expect(widevineLicenceReq).toHaveBeenCalledTimes(1);
			expect(requestLicenseFunc).toHaveBeenCalledTimes(1);

			expect(updateStateFn).toHaveBeenCalledTimes(2);
			expect(updateStateFn.mock.calls[0][0]).toEqual(
				DRMStates.LICENSE_REQUESTED
			);
			expect(updateStateFn.mock.calls[1][0]).toEqual(DRMStates.ERROR);
			expect(updateStateFn.mock.calls[1][1].errorCode).toEqual(
				PluginErrorCode.DRM_INVAILD_SOURCE
			);
			expect(drm._drmState).toEqual(DRMStates.ERROR);
		});
	});

	test("Non-SSM Widevine - Async network error handling", () => {
		let server = sinon.fakeServer.create();
		server.configure({ respondImmediately: true });
		server.respondWith("POST", "*", [
			200,
			{ "Content-Type": "application/json" },
			'[{ "id": 12, "comment": "Hey there" }]',
		]);
		let widevineLicenceReq = jest.spyOn(drm, "_getWidevineLicense");
		let requestLicenseFunc = jest.spyOn(drm, "_requestLicense");
		jest.spyOn(drm, "_isOngoingContent").mockImplementation(() => false);

		drm._drmState = DRMStates.INACTIVE;
		drm._source = BBB_NON_SSM_WV_WITH_TOKEN;

		const wvLicenseRetriever = drm.licenseRetriever(
			EncryptionTypes.WIDEVINE,
			BBB_NON_SSM_WV_WITH_TOKEN,
			"request.payload",
			LicenseMsgTypes.LICENSE_REQUEST
		);

		drm._licenseXHR.onerror();

		jest.spyOn(drm, "_isOngoingContent").mockImplementation(() => true);

		drm._licenseXHR.onerror();

		return wvLicenseRetriever.catch(() => {
			expect(startContentTokenWaitTimerFn).not.toHaveBeenCalled();
			expect(widevineLicenceReq).toHaveBeenCalledTimes(1);
			expect(requestLicenseFunc).toHaveBeenCalledTimes(1);

			expect(updateStateFn).toHaveBeenCalledTimes(4);
			expect(updateStateFn.mock.calls[0][0]).toEqual(
				DRMStates.LICENSE_REQUESTED
			);
			expect(updateStateFn.mock.calls[1][0]).toEqual(DRMStates.ERROR);
			expect(updateStateFn.mock.calls[1][1].errorCode).toEqual(
				PluginErrorCode.DRM_INVAILD_SOURCE
			);
			expect(updateStateFn.mock.calls[2][1].errorCode).toEqual(
				PluginErrorCode.DRM_INVAILD_SOURCE
			);
			expect(updateStateFn.mock.calls[3][1].errorCode).toEqual(
				PluginErrorCode.DRM_LICENSE_REQUEST_FAILURE
			);
			expect(drm._drmState).toEqual(DRMStates.ERROR);
		});
	});

	test("Invalid key system", () => {
		let widevineLicenceReq = jest.spyOn(drm, "_getWidevineLicense");
		let requestLicenseFunc = jest.spyOn(drm, "_requestLicense");

		drm._drmState = DRMStates.INACTIVE;
		drm._source = BBB_NON_SSM_WV_WITH_TOKEN;

		const wvLicenseRetriever = drm.licenseRetriever(
			"another.drm",
			BBB_NON_SSM_WV_WITH_TOKEN,
			"request.payload",
			LicenseMsgTypes.LICENSE_REQUEST
		);

		return wvLicenseRetriever.catch(() => {
			expect(startContentTokenWaitTimerFn).not.toHaveBeenCalled();
			expect(widevineLicenceReq).not.toHaveBeenCalled();
			expect(requestLicenseFunc).not.toHaveBeenCalled();

			expect(updateStateFn).toHaveBeenCalledTimes(1);
			expect(updateStateFn.mock.calls[0][0]).toEqual(DRMStates.ERROR);

			expect(drm._drmState).toEqual(DRMStates.ERROR);
		});
	});

	test("SSM Widevine source with invalid sessionToken", () => {
		let server = sinon.fakeServer.create();
		server.configure({ respondImmediately: true });
		server.respondWith("POST", "*", [
			200,
			{ "Content-Type": "application/json" },
			'{"status": "OK", "errorCode": 0, "license": ["MTIzNDU="]}',
		]);

		let requestLicenseFunc = jest.spyOn(drm, "_requestLicense");

		drm._drmState = DRMStates.INACTIVE;
		drm._source = null;

		drm.setSource(BBB_SSM_WV_WITH_TOKEN);

		const wvLicenseRetriever = drm.licenseRetriever(
			EncryptionTypes.WIDEVINE,
			BBB_SSM_WV_WITH_TOKEN,
			"request.payload",
			LicenseMsgTypes.LICENSE_REQUEST
		);

		drm._onSsmStateChanged(SSMStates.SESSION_ON, BBB_SSM_WV_WITH_TOKEN, {
			sessionToken: undefined,
			serverUrl: "https://a.server",
		});

		return wvLicenseRetriever.catch((error) => {
			expect(error).not.toBeFalsy();
			expect(requestLicenseFunc).toHaveBeenCalledTimes(1);

			expect(updateStateFn).toHaveBeenCalledTimes(2);
			expect(updateStateFn.mock.calls[1][0]).toEqual(DRMStates.ERROR);
			expect(updateStateFn.mock.calls[1][1].errorCode).toEqual(
				PluginErrorCode.DRM_INVAILD_SOURCE
			);
		});
	});
});

describe("License renewal", () => {
	test("Widevine SSM", () => {
		let server = sinon.fakeServer.create();
		server.configure({ respondImmediately: true });
		server.respondWith("POST", "*", [
			200,
			{ "Content-Type": "application/json" },
			'{ "license": "ABCDEF", "sessionToken": "0987654321" }',
		]);

		let widevineLicenceReq = jest.spyOn(drm, "_getWidevineLicense");
		let requestLicenseFunc = jest.spyOn(drm, "_requestLicense");
		let renewLicenseFunc = jest.spyOn(drm, "_requestLicenseRenewal");

		drm._drmState = DRMStates.ACTIVE;
		drm._source = SINTEL_SSM_WV_WITH_TOKEN;
		drm._ssmSessionInfo = {
			serverUrl: "",
			sessionToken: "1234567890",
		};

		const licenseRenewPromise = drm.licenseRetriever(
			EncryptionTypes.WIDEVINE,
			SINTEL_SSM_WV_WITH_TOKEN,
			"request.payload",
			LicenseMsgTypes.LICENSE_RENEWAL
		);

		return licenseRenewPromise.then((response) => {
			expect(response).not.toBeFalsy();
			expect(startContentTokenWaitTimerFn).not.toHaveBeenCalled();
			expect(widevineLicenceReq).not.toHaveBeenCalled();
			expect(requestLicenseFunc).not.toHaveBeenCalled();

			expect(renewLicenseFunc).toHaveBeenCalledTimes(1);

			expect(updateStateFn).toHaveBeenCalledTimes(2);
			expect(updateStateFn.mock.calls[0][0]).toEqual(
				DRMStates.RENEWAL_REQUESTED
			);
			expect(updateStateFn.mock.calls[1][0]).toEqual(DRMStates.ACTIVE);
		});
	});

	test("PlayReady SSM", () => {
		let server = sinon.fakeServer.create();
		server.configure({ respondImmediately: true });
		server.respondWith("POST", "*", [
			200,
			{ "Content-Type": "application/json" },
			'{ "license": "ABCDEF", "sessionToken": "0987654321" }',
		]);

		let playreadyLicenceReq = jest.spyOn(drm, "_getPlayreadyLicense");
		let renewLicenseFunc = jest.spyOn(drm, "_requestLicenseRenewal");

		drm._drmState = DRMStates.ACTIVE;
		drm._source = ALIENS_NON_SSM_PLAYREADY_WITH_TOKEN;
		drm._ssmSessionInfo = {
			serverUrl: "",
			sessionToken: "1234567890",
		};

		const licenseRenewPromise = drm.licenseRetriever(
			EncryptionTypes.PLAYREADY,
			ALIENS_NON_SSM_PLAYREADY_WITH_TOKEN,
			"request.payload",
			LicenseMsgTypes.LICENSE_RENEWAL
		);

		return licenseRenewPromise.then((response) => {
			expect(response).not.toBeFalsy();
			expect(startContentTokenWaitTimerFn).not.toHaveBeenCalled();
			expect(playreadyLicenceReq).not.toHaveBeenCalled();

			expect(renewLicenseFunc).toHaveBeenCalledTimes(1);

			expect(updateStateFn).toHaveBeenCalledTimes(2);
			expect(updateStateFn.mock.calls[0][0]).toEqual(
				DRMStates.RENEWAL_REQUESTED
			);
			expect(updateStateFn.mock.calls[1][0]).toEqual(DRMStates.ACTIVE);
		});
	});

	test("FairPlay SSM", () => {
		let server = sinon.fakeServer.create();
		server.configure({ respondImmediately: true });
		server.respondWith("POST", "*", [
			200,
			{ "Content-Type": "application/json" },
			'{ "CkcMessage" : "Nonsense Data" }',
		]);

		let fairplayLicenceReq = jest.spyOn(drm, "_getFairplayLicense");
		let renewLicenseFunc = jest.spyOn(drm, "_requestLicenseRenewal");

		drm._drmState = DRMStates.ACTIVE;
		drm._source = SSM_BBB_WITH_TOKEN;
		drm._ssmSessionInfo = {
			serverUrl: "",
			sessionToken: "1234567890",
		};

		const licenseRenewPromise = drm.licenseRetriever(
			EncryptionTypes.FAIRPLAY,
			SSM_BBB_WITH_TOKEN,
			"request.payload",
			LicenseMsgTypes.LICENSE_RENEWAL
		);

		return licenseRenewPromise.then((response) => {
			expect(response).not.toBeFalsy();
			expect(startContentTokenWaitTimerFn).not.toHaveBeenCalled();
			expect(fairplayLicenceReq).not.toHaveBeenCalled();

			expect(renewLicenseFunc).toHaveBeenCalledTimes(1);

			expect(updateStateFn).toHaveBeenCalledTimes(2);
			expect(updateStateFn.mock.calls[0][0]).toEqual(
				DRMStates.RENEWAL_REQUESTED
			);
			expect(updateStateFn.mock.calls[1][0]).toEqual(DRMStates.ACTIVE);
		});
	});

	test("Invalid key system", () => {
		let server = sinon.fakeServer.create();
		server.configure({ respondImmediately: true });
		server.respondWith("POST", "*", [
			200,
			{ "Content-Type": "application/json" },
			'{ "CkcMessage" : "Nonsense Data" }',
		]);

		let fairplayLicenceReq = jest.spyOn(drm, "_getFairplayLicense");
		let renewLicenseFunc = jest.spyOn(drm, "_requestLicenseRenewal");

		drm._drmState = DRMStates.ACTIVE;
		drm._source = SSM_BBB_WITH_TOKEN;
		drm._ssmSessionInfo = {
			serverUrl: "",
			sessionToken: "1234567890",
		};

		const licenseRenewPromise = drm.licenseRetriever(
			"other.drm",
			SSM_BBB_WITH_TOKEN,
			"request.payload",
			LicenseMsgTypes.LICENSE_RENEWAL
		);

		return licenseRenewPromise.catch((errorData) => {
			expect(errorData).not.toBeFalsy();

			expect(fairplayLicenceReq).not.toHaveBeenCalled();

			expect(renewLicenseFunc).toHaveBeenCalledTimes(1);

			expect(updateStateFn).toHaveBeenCalledTimes(1);
			expect(updateStateFn.mock.calls[0][0]).toEqual(DRMStates.ERROR);
			expect(updateStateFn.mock.calls[0][1].errorCode).toEqual(
				PluginErrorCode.INVALID_KEY_SYSTEM
			);
		});
	});

	//TODO: RENEWAL FAILURE CASES
	test("PlayReady SSM with network failure", () => {
		let server = sinon.fakeServer.create();
		server.configure({ respondImmediately: true });
		server.respondWith("POST", "*", [
			400,
			{ "Content-Type": "application/json" },
			'{ "license": "ABCDEF", "sessionToken": "0987654321" }',
		]);

		let renewLicenseFunc = jest.spyOn(drm, "_requestLicenseRenewal");

		drm._drmState = DRMStates.ACTIVE;
		drm._source = ALIENS_NON_SSM_PLAYREADY_WITH_TOKEN;
		drm._ssmSessionInfo = {
			serverUrl: "",
			sessionToken: "1234567890",
		};

		const licenseRenewPromise = drm.licenseRetriever(
			EncryptionTypes.PLAYREADY,
			ALIENS_NON_SSM_PLAYREADY_WITH_TOKEN,
			"request.payload",
			LicenseMsgTypes.LICENSE_RENEWAL
		);

		return licenseRenewPromise.catch((error) => {
			expect(error).not.toBeFalsy();
			expect(renewLicenseFunc).toHaveBeenCalledTimes(1);

			expect(updateStateFn).toHaveBeenCalledTimes(2);
			expect(updateStateFn.mock.calls[0][0]).toEqual(
				DRMStates.RENEWAL_REQUESTED
			);
			expect(updateStateFn.mock.calls[1][0]).toEqual(DRMStates.ERROR);
			expect(updateStateFn.mock.calls[1][1].errorCode).toEqual(
				PluginErrorCode.SSM_HEARTBEAT_SEND_MESSAGE_FAILURE
			);
		});
	});

	test("PlayReady SSM with Source changed error", () => {
		let server = sinon.fakeServer.create();
		server.configure({ respondImmediately: true });
		server.respondWith("POST", "*", [
			200,
			{ "Content-Type": "application/json" },
			'{ "license": "ABCDEF", "sessionToken": "0987654321" }',
		]);

		let renewLicenseFunc = jest.spyOn(drm, "_requestLicenseRenewal");

		drm._drmState = DRMStates.ACTIVE;
		drm._source = ALIENS_NON_SSM_PLAYREADY_WITH_TOKEN;
		drm._ssmSessionInfo = {
			serverUrl: "",
			sessionToken: "1234567890",
		};

		jest.spyOn(drm, "_isOngoingContent").mockImplementation(() => false);

		const licenseRenewPromise = drm.licenseRetriever(
			EncryptionTypes.PLAYREADY,
			ALIENS_NON_SSM_PLAYREADY_WITH_TOKEN,
			"request.payload",
			LicenseMsgTypes.LICENSE_RENEWAL
		);

		return licenseRenewPromise.catch((error) => {
			expect(error).not.toBeFalsy();
			expect(renewLicenseFunc).toHaveBeenCalledTimes(1);

			expect(updateStateFn).toHaveBeenCalledTimes(2);
			expect(updateStateFn.mock.calls[0][0]).toEqual(
				DRMStates.RENEWAL_REQUESTED
			);
			expect(updateStateFn.mock.calls[1][0]).toEqual(DRMStates.ERROR);
			expect(updateStateFn.mock.calls[1][1].errorCode).toEqual(
				PluginErrorCode.DRM_INVAILD_SOURCE
			);
		});
	});

	test("Non-SSM PlayReady - license request network error", () => {
		let server = sinon.fakeServer.create();
		server.configure({ respondImmediately: true });
		server.respondWith("POST", "*", [
			400,
			{ "Content-Type": "application/json" },
			'[{ "id": 12, "comment": "Hey there" }]',
		]);

		let playreadyLicenceReq = jest.spyOn(drm, "_getPlayreadyLicense");

		drm._drmState = DRMStates.INACTIVE;
		drm._source = null;

		drm.setSource(ALIENS_NON_SSM_PLAYREADY_WITH_TOKEN);

		let licenseRequestPromise = drm.licenseRetriever(
			EncryptionTypes.PLAYREADY,
			ALIENS_NON_SSM_PLAYREADY_WITH_TOKEN,
			"request.payload",
			LicenseMsgTypes.LICENSE_REQUEST
		);

		return licenseRequestPromise.catch((error) => {
			expect(error).not.toBeFalsy();
			expect(playreadyLicenceReq).toHaveBeenCalledTimes(1);

			expect(updateStateFn).toHaveBeenCalledTimes(2);
			expect(updateStateFn.mock.calls[0][0]).toEqual(
				DRMStates.LICENSE_REQUESTED
			);
			expect(updateStateFn.mock.calls[1][0]).toEqual(DRMStates.ERROR);
			expect(updateStateFn.mock.calls[1][1].errorCode).toEqual(
				PluginErrorCode.DRM_LICENSE_REQUEST_FAILURE
			);
		});
	});

	test("Non-SSM PlayReady - source is changed when license returns", () => {
		let server = sinon.fakeServer.create();
		server.configure({ respondImmediately: true });
		server.respondWith("POST", "*", [
			200,
			{ "Content-Type": "application/json" },
			'[{ "id": 12, "comment": "Hey there" }]',
		]);

		let playreadyLicenceReq = jest.spyOn(drm, "_getPlayreadyLicense");
		jest.spyOn(drm, "_isOngoingContent").mockImplementation(() => false);

		drm._drmState = DRMStates.INACTIVE;
		drm._source = null;

		drm.setSource(ALIENS_NON_SSM_PLAYREADY_WITH_TOKEN);

		let licenseRequestPromise = drm.licenseRetriever(
			EncryptionTypes.PLAYREADY,
			ALIENS_NON_SSM_PLAYREADY_WITH_TOKEN,
			"request.payload",
			LicenseMsgTypes.LICENSE_REQUEST
		);

		return licenseRequestPromise.catch((error) => {
			expect(error).not.toBeFalsy();
			expect(playreadyLicenceReq).toHaveBeenCalledTimes(1);

			expect(updateStateFn).toHaveBeenCalledTimes(2);
			expect(updateStateFn.mock.calls[0][0]).toEqual(
				DRMStates.LICENSE_REQUESTED
			);
			expect(updateStateFn.mock.calls[1][0]).toEqual(DRMStates.ERROR);
			expect(updateStateFn.mock.calls[1][1].errorCode).toEqual(
				PluginErrorCode.DRM_INVAILD_SOURCE
			);
		});
	});

	test("Non-SSM PlayReady - async network error handling ", () => {
		let server = sinon.fakeServer.create();
		server.configure({ respondImmediately: true });
		server.respondWith("POST", "*", [
			200,
			{ "Content-Type": "application/json" },
			'[{ "id": 12, "comment": "Hey there" }]',
		]);

		let playreadyLicenceReq = jest.spyOn(drm, "_getPlayreadyLicense");
		jest.spyOn(drm, "_isOngoingContent").mockImplementation(() => false);

		drm._drmState = DRMStates.INACTIVE;
		drm._source = null;

		drm.setSource(ALIENS_NON_SSM_PLAYREADY_WITH_TOKEN);

		let licenseRequestPromise = drm.licenseRetriever(
			EncryptionTypes.PLAYREADY,
			ALIENS_NON_SSM_PLAYREADY_WITH_TOKEN,
			"request.payload",
			LicenseMsgTypes.LICENSE_REQUEST
		);

		drm._licenseXHR.onerror();
		jest.spyOn(drm, "_isOngoingContent").mockImplementation(() => true);
		drm._licenseXHR.onerror();

		return licenseRequestPromise.catch((error) => {
			expect(error).not.toBeFalsy();
			expect(playreadyLicenceReq).toHaveBeenCalledTimes(1);

			expect(updateStateFn).toHaveBeenCalledTimes(4);
			expect(updateStateFn.mock.calls[0][0]).toEqual(
				DRMStates.LICENSE_REQUESTED
			);
			expect(updateStateFn.mock.calls[1][0]).toEqual(DRMStates.ERROR);
			expect(updateStateFn.mock.calls[1][1].errorCode).toEqual(
				PluginErrorCode.DRM_INVAILD_SOURCE
			);
			expect(updateStateFn.mock.calls[2][1].errorCode).toEqual(
				PluginErrorCode.DRM_INVAILD_SOURCE
			);
			expect(updateStateFn.mock.calls[3][1].errorCode).toEqual(
				PluginErrorCode.DRM_LICENSE_REQUEST_FAILURE
			);
		});
	});

	test("Non-SSM FairPlay - license request network error", () => {
		let server = sinon.fakeServer.create();
		server.configure({ respondImmediately: true });
		server.respondWith("POST", "*", [
			400,
			{ "Content-Type": "application/json" },
			'{ "CkcMessage" : "Nonsense Data" }',
		]);
		let fairplayLicenceReq = jest.spyOn(drm, "_getFairplayLicense");

		drm._drmState = DRMStates.INACTIVE;
		drm._source = null;

		drm.setSource(NON_SSM_FAIRPLAY_TEARS_OF_STEEL_WITH_TOKEN);

		let licenseRequestPromise = drm.licenseRetriever(
			EncryptionTypes.FAIRPLAY,
			NON_SSM_FAIRPLAY_TEARS_OF_STEEL_WITH_TOKEN,
			"request.payload",
			LicenseMsgTypes.LICENSE_REQUEST
		);
		return licenseRequestPromise.catch((error) => {
			expect(error).not.toBeFalsy();
			expect(fairplayLicenceReq).toHaveBeenCalledTimes(1);

			expect(updateStateFn).toHaveBeenCalledTimes(2);
			expect(updateStateFn.mock.calls[0][0]).toEqual(
				DRMStates.LICENSE_REQUESTED
			);
			expect(updateStateFn.mock.calls[1][0]).toEqual(DRMStates.ERROR);
			expect(updateStateFn.mock.calls[1][1].errorCode).toEqual(
				PluginErrorCode.DRM_LICENSE_REQUEST_FAILURE
			);
		});
	});

	test("Non-SSM FairPlay - source is changed when license retuens", () => {
		let server = sinon.fakeServer.create();
		server.configure({ respondImmediately: true });
		server.respondWith("POST", "*", [
			400,
			{ "Content-Type": "application/json" },
			'{ "CkcMessage" : "Nonsense Data" }',
		]);
		let fairplayLicenceReq = jest.spyOn(drm, "_getFairplayLicense");
		jest.spyOn(drm, "_isOngoingContent").mockImplementation(() => false);

		drm._drmState = DRMStates.INACTIVE;
		drm._source = null;

		drm.setSource(NON_SSM_FAIRPLAY_TEARS_OF_STEEL_WITH_TOKEN);

		let licenseRequestPromise = drm.licenseRetriever(
			EncryptionTypes.FAIRPLAY,
			NON_SSM_FAIRPLAY_TEARS_OF_STEEL_WITH_TOKEN,
			"request.payload",
			LicenseMsgTypes.LICENSE_REQUEST
		);
		return licenseRequestPromise.catch((error) => {
			expect(error).not.toBeFalsy();
			expect(fairplayLicenceReq).toHaveBeenCalledTimes(1);

			expect(updateStateFn).toHaveBeenCalledTimes(2);
			expect(updateStateFn.mock.calls[0][0]).toEqual(
				DRMStates.LICENSE_REQUESTED
			);
			expect(updateStateFn.mock.calls[1][0]).toEqual(DRMStates.ERROR);
			expect(updateStateFn.mock.calls[1][1].errorCode).toEqual(
				PluginErrorCode.DRM_INVAILD_SOURCE
			);
		});
	});

	test("Non-SSM FairPlay - async network error handling", () => {
		let server = sinon.fakeServer.create();
		server.configure({ respondImmediately: true });
		server.respondWith("POST", "*", [
			400,
			{ "Content-Type": "application/json" },
			'{ "CkcMessage" : "Nonsense Data" }',
		]);
		let fairplayLicenceReq = jest.spyOn(drm, "_getFairplayLicense");
		jest.spyOn(drm, "_isOngoingContent").mockImplementation(() => false);

		drm._drmState = DRMStates.INACTIVE;
		drm._source = null;

		drm.setSource(NON_SSM_FAIRPLAY_TEARS_OF_STEEL_WITH_TOKEN);

		let licenseRequestPromise = drm.licenseRetriever(
			EncryptionTypes.FAIRPLAY,
			NON_SSM_FAIRPLAY_TEARS_OF_STEEL_WITH_TOKEN,
			"request.payload",
			LicenseMsgTypes.LICENSE_REQUEST
		);

		drm._licenseXHR.onerror();
		jest.spyOn(drm, "_isOngoingContent").mockImplementation(() => true);
		drm._licenseXHR.onerror();

		return licenseRequestPromise.catch((error) => {
			expect(error).not.toBeFalsy();
			expect(fairplayLicenceReq).toHaveBeenCalledTimes(1);

			expect(updateStateFn).toHaveBeenCalledTimes(4);
			expect(updateStateFn.mock.calls[0][0]).toEqual(
				DRMStates.LICENSE_REQUESTED
			);
			expect(updateStateFn.mock.calls[1][0]).toEqual(DRMStates.ERROR);
			expect(updateStateFn.mock.calls[1][1].errorCode).toEqual(
				PluginErrorCode.DRM_INVAILD_SOURCE
			);
			expect(updateStateFn.mock.calls[2][1].errorCode).toEqual(
				PluginErrorCode.DRM_INVAILD_SOURCE
			);
			expect(updateStateFn.mock.calls[3][1].errorCode).toEqual(
				PluginErrorCode.DRM_LICENSE_REQUEST_FAILURE
			);
		});
	});

	test("Widevine SSM with failture from SSM module", () => {
		let renewLicenseFunc = jest.spyOn(drm, "_requestLicenseRenewal");
		SSM.mockImplementation(() => {
			return {
				setSource: jest.fn(),
				renewWidevine: () => {
					return Promise.reject("license request failed.");
				},
				setLicenseCustomData: setLicenseCustomDataFn,
			};
		});

		drm._drmState = DRMStates.ACTIVE;
		drm._source = SINTEL_SSM_WV_WITH_TOKEN;
		drm._ssmSessionInfo = {
			serverUrl: "",
			sessionToken: "1234567890",
		};

		const licenseRenewPromise = drm.licenseRetriever(
			EncryptionTypes.WIDEVINE,
			SINTEL_SSM_WV_WITH_TOKEN,
			"request.payload",
			LicenseMsgTypes.LICENSE_RENEWAL
		);

		return licenseRenewPromise.catch((errorData) => {
			expect(errorData).not.toBeFalsy();
			expect(renewLicenseFunc).toHaveBeenCalledTimes(1);

			expect(updateStateFn).toHaveBeenCalledTimes(2);
			expect(updateStateFn.mock.calls[0][0]).toEqual(
				DRMStates.RENEWAL_REQUESTED
			);
			expect(updateStateFn.mock.calls[1][0]).toEqual(DRMStates.ERROR);
			expect(updateStateFn.mock.calls[1][1].errorCode).toEqual(
				PluginErrorCode.SSM_RENEW_ERROR
			);
		});
	});

	test("Widevine SSM license request with hearbeat mode", () => {
		let server = sinon.fakeServer.create();
		server.configure({ respondImmediately: true });
		server.respondWith("POST", "*", [
			200,
			{ "Content-Type": "application/json" },
			'{"status": "OK", "errorCode": 0, "sessionDrmEnforced": false, "license": ["MTIzNDU="]}',
		]);
		let widevineLicenceReq = jest.spyOn(drm, "_getWidevineLicense");
		let requestLicenseFunc = jest.spyOn(drm, "_requestLicense");
		drm._drmState = DRMStates.INACTIVE;
		drm._source = null;

		drm.setSource(BBB_SSM_WV_WITH_TOKEN);

		const wvLicenseRetriever = drm.licenseRetriever(
			EncryptionTypes.WIDEVINE,
			BBB_SSM_WV_WITH_TOKEN,
			"request.payload",
			LicenseMsgTypes.LICENSE_REQUEST
		);

		drm._onSsmStateChanged(SSMStates.SESSION_ON, BBB_SSM_WV_WITH_TOKEN, {
			sessionToken: "session123",
			serverUrl: "https://a.server",
		});

		return wvLicenseRetriever.then(() => {
			expect(widevineLicenceReq).toHaveBeenCalledTimes(1);
			expect(requestLicenseFunc).toHaveBeenCalledTimes(1);

			expect(updateStateFn).toHaveBeenCalledTimes(3);
			expect(updateStateFn.mock.calls[0][0]).toEqual(
				DRMStates.AWAITING_SESSION_TOKEN
			);
			expect(updateStateFn.mock.calls[1][0]).toEqual(
				DRMStates.LICENSE_REQUESTED
			);
			expect(updateStateFn.mock.calls[2][0]).toEqual(DRMStates.ACTIVE);
			expect(drm._drmState).toEqual(DRMStates.ACTIVE);
			expect(setLicenseCustomDataFn).toHaveBeenCalledTimes(1);
		});
	});

	test("Widevine request certificate when certificate already exists.", () => {
		const requestPayload = new Uint8Array([
			99, 98, 97, 96, 95, 10, 11, 12, 13, 14,
		]);
		const certificatePayload = new Uint8Array(50);
		let server = sinon.fakeServer.create();
		server.configure({ respondImmediately: true });
		server.respondWith("POST", "*", [
			200,
			{ "Content-Type": "application/json" },
			'{"status": "OK", "errorCode": 0, "sessionDrmEnforced": true, "license": ["MTIzNDU="]}',
		]);
		let widevineLicenceReq = jest.spyOn(drm, "_getWidevineLicense");
		let requestLicenseFunc = jest.spyOn(drm, "_requestLicense");
		drm._drmState = DRMStates.INACTIVE;
		drm._source = null;

		drm.setSource(BBB_SSM_WV_WITH_TOKEN);

		drm._widevineCertArray = certificatePayload;

		const wvLicenseRetriever = drm.licenseRetriever(
			EncryptionTypes.WIDEVINE,
			BBB_SSM_WV_WITH_TOKEN,
			requestPayload.buffer,
			LicenseMsgTypes.LICENSE_REQUEST
		);

		drm._onSsmStateChanged(SSMStates.SESSION_ON, BBB_SSM_WV_WITH_TOKEN, {
			sessionToken: "session123",
			serverUrl: "https://a.server",
		});

		return wvLicenseRetriever.then((response) => {
			expect(response).not.toBeFalsy();
			expect(widevineLicenceReq).toHaveBeenCalledTimes(1);
			expect(requestLicenseFunc).toHaveBeenCalledTimes(0);
			expect(response).toEqual(certificatePayload);
		});
	});

	test("Widevine request certificate when certificate does not exist.", () => {
		const requestPayload = new Uint8Array([99, 98, 97, 96, 95, 10]);
		const fakeResponse = new Uint8Array([
			99, 98, 97, 96, 95, 10, 11, 12, 13, 14,
		]);

		let server = sinon.fakeServer.create();
		server.configure({ respondImmediately: true });
		server.respondWith("POST", "*", [
			200,
			{ "Content-Type": "application/json" },
			fakeResponse.buffer,
		]);
		let widevineLicenceReq = jest.spyOn(drm, "_getWidevineLicense");
		let requestLicenseFunc = jest.spyOn(drm, "_requestLicense");
		drm._drmState = DRMStates.INACTIVE;
		drm._source = null;

		drm.setSource(BBB_SSM_WV_WITH_TOKEN);

		const wvLicenseRetriever = drm.licenseRetriever(
			EncryptionTypes.WIDEVINE,
			BBB_SSM_WV_WITH_TOKEN,
			requestPayload.buffer,
			LicenseMsgTypes.LICENSE_REQUEST
		);

		drm._onSsmStateChanged(SSMStates.SESSION_ON, BBB_SSM_WV_WITH_TOKEN, {
			sessionToken: "session123",
			serverUrl: "https://a.server",
		});

		return wvLicenseRetriever.then((response) => {
			expect(response).not.toBeFalsy();
			expect(widevineLicenceReq).toHaveBeenCalledTimes(1);
			expect(requestLicenseFunc).toHaveBeenCalledTimes(1);
			expect(response).toEqual(fakeResponse);
		});
	});
});

describe("certificateRetriever", () => {
	// TODO: For some reason these interfere with license requests if put before them
	// It may just be missing teardown, but needs investigating

	test("onload", () => {
		const fakeResponse = new Uint8Array([
			99, 98, 97, 96, 95, 10, 11, 12, 13, 14,
		]);
		let server = sinon.fakeServer.create();
		server.configure({ respondImmediately: true });
		server.respondWith("GET", "*", [
			200,
			{ "Content-Type": "application/json" },
			fakeResponse.buffer,
		]);

		drm._source = NON_SSM_TEARS_FAIRPLAY_WITH_TOKEN;

		const certificatePromise = drm.certificateRetriever();

		return certificatePromise.then((response) => {
			expect(response).toEqual(fakeResponse);
		});
	});

	test("onerror", () => {
		const response = '[{ "id": 666, "comment": "Fail 123" }]';
		let server = sinon.fakeServer.create();
		server.configure({ respondImmediately: true });
		server.respondWith("GET", "*", [
			404,
			{ "Content-Type": "application/json" },
			response,
		]);

		drm._source = NON_SSM_TEARS_FAIRPLAY_WITH_TOKEN;
		const certificatePromise = drm.certificateRetriever();

		drm._certificateXHR.onerror();

		return certificatePromise.catch((error) => {
			expect(error).not.toBeFalsy();
			expect(updateStateFn).toHaveBeenCalledTimes(2);
			expect(updateStateFn.mock.calls[0][1].errorCode).toEqual(
				PluginErrorCode.DRM_CERTIFICATE_REQUEST_FAILURE
			);
			expect(updateStateFn.mock.calls[1][1].errorCode).toEqual(
				PluginErrorCode.DRM_CERTIFICATE_REQUEST_FAILURE
			);
		});
	});
});

describe("onSsmStateChanged callback", () => {
	test("SSMStates.ERROR state", () => {
		drm._drmState = DRMStates.ACTIVE;
		drm._onSsmStateChanged(
			SSMStates.ERROR,
			BBB_SSM_WV_WITH_TOKEN,
			{ sessionToken: "session123", serverUrl: "https://a.server" },
			{ errorCode: PluginErrorCode.SSM_HEARTBEAT_SEND_MESSAGE_FAILURE }
		);
		expect(updateStateFn).toHaveBeenCalledTimes(1);
		expect(updateStateFn.mock.calls[0][0]).toEqual(DRMStates.ERROR);
		expect(updateStateFn.mock.calls[0][1].errorCode).toEqual(
			PluginErrorCode.SSM_HEARTBEAT_SEND_MESSAGE_FAILURE
		);

		updateStateFn.mockClear();
		drm._drmState = DRMStates.ERROR;
		drm._onSsmStateChanged(
			SSMStates.ERROR,
			BBB_SSM_WV_WITH_TOKEN,
			{ sessionToken: "session123", serverUrl: "https://a.server" },
			{ errorCode: PluginErrorCode.SSM_HEARTBEAT_SEND_MESSAGE_FAILURE }
		);
		expect(updateStateFn).not.toHaveBeenCalled();
	});
});
