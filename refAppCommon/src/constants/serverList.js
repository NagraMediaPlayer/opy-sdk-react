// Copyright (c) 2020--2023 Nagravision SA. All rights reserved.
const serverList = [
	{
		name: 'OPY_FPS_SSP',
		description: 'License server supports FPS',
		url: 'https://tenantname.anycast.nagra.com/TENANTNAME/fpls/contentlicenseservice/v1/licenses',
		certificateURL:
			'https://tenantname.anycast.nagra.com/TENANTNAME/fpls/contentlicenseservice/v1/certificates',
		drm: 'fairplay',
		drm_key_request_properties: {
			Accept: 'application/octet-stream',
			'Content-Type': 'application/octet-stream',
			'nv-tenant-id': 'TENANTNAME',
		},
	},
];

export default serverList;
