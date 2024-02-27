// Copyright (c) 2020--2023 Nagravision SA. All rights reserved.
const serverList = [
	{
		name: 'OPY_MDRM_SSP_Cloud',
		description:
			'SSP License server supports Widevine/Playready hosted on AWS Cloud',
		url: 'https://tenantname.anycast.nagra.com/TENANTNAME/wvls/contentlicenseservice/v1/licenses',
		drm: 'widevine,playready',
		drm_key_request_properties: {
			Accept: 'application/octet-stream',
			'Content-Type': 'application/octet-stream',
			'nv-tenant-id': 'TENANTNAME',
		},
	},
	{
		name: 'OPY_MDRM_SSM_Cloud',
		description:
			'License server supports Widevine with SSM hosted on AWS Cloud',
		url: 'https://tenantname.anycast.nagra.com/TENANTNAME/wvls/contentlicenseservice/v1/licenses',
		drm: 'widevine',
		ssm_url: 'https://tenantname-ssm.anycast.nagra.com/TENANTNAME/ssm',
		drm_key_request_properties: {
			Accept: 'application/octet-stream',
			'Content-Type': 'application/octet-stream',
			'nv-tenant-id': 'TENANTNAME',
		},
	},
	{
		name: 'UEX2_SSP_Cloud',
		description:
			'SSP License server supports Widevine/Playready hosted on AWS Cloud',
		url: 'https://uex2x8dt.anycast.nagra.com/UEX2X8DT/wvls/contentlicenseservice/v1/licenses',
		drm: 'widevine,playready',
		drm_key_request_properties: {
			Accept: 'application/octet-stream',
			'Content-Type': 'application/octet-stream',
			'nv-tenant-id': 'UEX2X8DT',
		},
	},
	{
		name: 'OPY_MDRM_AZURE',
		description:
			'Azure Media Service License server supports Widevine, Playready',
		url: '',
		drm: 'widevine,playready',
		drm_key_request_properties: {
			Accept: 'application/octet-stream',
			'Content-Type': 'application/octet-stream',
		},
	},
	{
		name: 'OPY_PRM_direct_nonsilent',
		description: 'OPY License server support PRM-Direct-NonSilenet',
		url: 'http://replacemewithyourown.com/secureplayer/pcs/OnlineCredentials',
		drm: 'prm',
		drm_key_request_properties: {
			Accept: 'application/json',
			'Content-Type': 'application/json',
		},
		prm_specific: {
			opvault: 'opvault',
			initialization_client_protected_private_data: '',
		},
	},
	{
		name: 'OPY_PRM_indirect',
		description: 'OPY License server support PRM-Indirect',
		url: 'https://replacemewithyourown.com/secureplayer/sls-softwarelicense-WS/SoftwareEntitlement',
		drm: 'prm',
		drm_key_request_properties: {
			Accept: 'text/xml,application/text+xml,application/soap+xml',
			'Content-Type': 'text/xml; charset=utf-8',
		},
		prm_specific: {
			opvault: 'opvault',
			initialization_client_protected_private_data: '',
		},
	},
	{
		name: 'OPY_SSP_CONNECT_UEX3',
		description: 'SSP License server supporting Connect',
		url: 'https://tenantname.anycast.nagra.com/TENANTNAME/prmls/contentlicenseservice/v1/licenses/',
		certificateURL:
			'https://tenantname-ov.anycast.nagra.com/filedownload/v1/opvault/',
		drm: 'connect',
		drm_key_request_properties: {
			Accept: 'application/json',
			'Content-Type': 'application/json',
			'nv-tenant-id': 'TENANTNAME',
		},
	},
];

export default serverList;
